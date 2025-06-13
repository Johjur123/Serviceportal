import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { apiLimiter, authLimiter, messageLimiter, adminLimiter } from "./rateLimiting";
import { healthCheck, requestLogger } from "./healthCheck";
import { withCache, invalidateCache } from "./cache";
import WebSocketManager from "./websocket";
import {
  insertCustomerSchema,
  insertConversationSchema,
  insertMessageSchema,
  insertTemplateSchema,
  insertInternalNoteSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Add request logging
  app.use(requestLogger);
  
  // Health check endpoint (no rate limiting)
  app.get('/health', healthCheck);
  
  // Apply rate limiting
  app.use('/api/', apiLimiter);
  app.use('/api/login', authLimiter);
  app.use('/api/callback', authLimiter);
  app.use('/api/messages', messageLimiter);
  
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Customer routes
  app.post('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const customerData = insertCustomerSchema.parse({
        ...req.body,
        companyId: user.companyId,
      });
      
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error creating customer:", error);
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.get('/api/customers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const { search } = req.query;
      let customers;
      
      if (search) {
        customers = await storage.searchCustomers(user.companyId, search as string);
      } else {
        customers = await storage.getCustomersByCompany(user.companyId);
      }
      
      res.json(customers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const customer = await storage.getCustomer(parseInt(req.params.id));
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error("Error fetching customer:", error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req: any, res) => {
    try {
      const customerData = req.body;
      const customer = await storage.updateCustomer(parseInt(req.params.id), customerData);
      res.json(customer);
    } catch (error) {
      console.error("Error updating customer:", error);
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  // Conversation routes
  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const conversationData = insertConversationSchema.parse({
        ...req.body,
        assignedTo: req.user.claims.sub,
      });
      
      const conversation = await storage.createConversation(conversationData);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const conversations = await withCache(
        `conversations:${user.companyId}`,
        () => storage.getConversationsByCompany(user.companyId!),
        60 // 1 minute cache
      );
      
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.get('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const conversation = await storage.getConversationWithDetails(parseInt(req.params.id));
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });

  app.put('/api/conversations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const conversationData = req.body;
      const conversation = await storage.updateConversation(parseInt(req.params.id), conversationData);
      res.json(conversation);
    } catch (error) {
      console.error("Error updating conversation:", error);
      res.status(500).json({ message: "Failed to update conversation" });
    }
  });

  // Create HTTP server and initialize WebSocket manager
  const httpServer = createServer(app);
  const wsManager = new WebSocketManager(httpServer);

  // Message routes with WebSocket integration
  app.post('/api/messages', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.body.senderType === 'agent' ? req.user.claims.sub : req.body.senderId,
      });
      
      const message = await storage.createMessage(messageData);
      
      // Invalidate conversation cache
      invalidateCache(`conversations:${user.companyId}`);
      
      // Notify via WebSocket
      if (user.companyId) {
        wsManager.notifyNewMessage(user.companyId, messageData.conversationId, message);
      }
      
      res.json(message);
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ message: "Failed to create message" });
    }
  });

  app.get('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const messages = await storage.getMessagesByConversation(parseInt(req.params.id));
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.put('/api/conversations/:id/mark-read', isAuthenticated, async (req: any, res) => {
    try {
      await storage.markMessagesAsRead(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Failed to mark messages as read" });
    }
  });

  // Template routes
  app.post('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const templateData = insertTemplateSchema.parse({
        ...req.body,
        companyId: user.companyId,
        createdBy: req.user.claims.sub,
      });
      
      const template = await storage.createTemplate(templateData);
      res.json(template);
    } catch (error) {
      console.error("Error creating template:", error);
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.get('/api/templates', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const templates = await storage.getTemplatesByCompany(user.companyId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching templates:", error);
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Internal notes routes
  app.post('/api/internal-notes', isAuthenticated, async (req: any, res) => {
    try {
      const noteData = insertInternalNoteSchema.parse({
        ...req.body,
        createdBy: req.user.claims.sub,
      });
      
      const note = await storage.createInternalNote(noteData);
      res.json(note);
    } catch (error) {
      console.error("Error creating internal note:", error);
      res.status(500).json({ message: "Failed to create internal note" });
    }
  });

  app.get('/api/customers/:id/notes', isAuthenticated, async (req: any, res) => {
    try {
      const notes = await storage.getNotesByCustomer(parseInt(req.params.id));
      res.json(notes);
    } catch (error) {
      console.error("Error fetching internal notes:", error);
      res.status(500).json({ message: "Failed to fetch internal notes" });
    }
  });

  // Analytics routes
  app.get('/api/analytics', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.companyId) {
        return res.status(400).json({ message: "User not associated with a company" });
      }

      const analytics = await storage.getAnalytics(user.companyId);
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Admin routes - Company Management
  app.get("/api/admin/companies", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.post("/api/admin/companies", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const company = await storage.createCompany(req.body);
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.put("/api/admin/companies/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== "super_admin") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const companyId = parseInt(req.params.id);
      const company = await storage.updateCompany(companyId, req.body);
      res.json(company);
    } catch (error) {
      console.error("Error updating company:", error);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Admin routes - User Management
  app.get("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const companyId = req.query.companyId ? parseInt(req.query.companyId as string) : null;
      
      if (user?.role === "super_admin") {
        const users = companyId 
          ? await storage.getUsersByCompany(companyId)
          : await storage.getAllUsers();
        res.json(users);
      } else if (user?.role === "company_admin" && user.companyId) {
        const users = await storage.getUsersByCompany(user.companyId);
        res.json(users);
      } else {
        return res.status(403).json({ message: "Access denied" });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/admin/users", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!["super_admin", "company_admin"].includes(user?.role || "")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Company admins can only create users for their own company
      if (user?.role === "company_admin" && req.body.companyId !== user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const newUser = await storage.createCompanyUser(req.body);
      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!["super_admin", "company_admin"].includes(user?.role || "")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const userId = req.params.id;
      const targetUser = await storage.getUser(userId);
      
      // Company admins can only manage users from their own company
      if (user?.role === "company_admin" && targetUser?.companyId !== user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/admin/users/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!["super_admin", "company_admin"].includes(user?.role || "")) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const userId = req.params.id;
      const targetUser = await storage.getUser(userId);
      
      // Company admins can only delete users from their own company
      if (user?.role === "company_admin" && targetUser?.companyId !== user.companyId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteUser(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  return httpServer;
}
