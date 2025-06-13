import {
  users,
  companies,
  customers,
  conversations,
  messages,
  templates,
  internalNotes,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type Customer,
  type InsertCustomer,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Template,
  type InsertTemplate,
  type InternalNote,
  type InsertInternalNote,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, like, or } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Company operations
  createCompany(company: InsertCompany): Promise<Company>;
  getCompany(id: number): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  
  // Admin user management operations
  getAllUsers(): Promise<User[]>;
  getUsersByCompany(companyId: number): Promise<User[]>;
  updateUser(id: string, user: Partial<UpsertUser>): Promise<User>;
  deleteUser(id: string): Promise<void>;
  createCompanyUser(userData: UpsertUser): Promise<User>;
  
  // Customer operations
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  getCustomer(id: number): Promise<Customer | undefined>;
  getCustomersByCompany(companyId: number): Promise<Customer[]>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  searchCustomers(companyId: number, query: string): Promise<Customer[]>;
  
  // Conversation operations
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  getConversationsByCompany(companyId: number): Promise<Conversation[]>;
  updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation>;
  getConversationWithDetails(id: number): Promise<any>;
  
  // Message operations
  createMessage(message: InsertMessage): Promise<Message>;
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  markMessagesAsRead(conversationId: number): Promise<void>;
  
  // Template operations
  createTemplate(template: InsertTemplate): Promise<Template>;
  getTemplatesByCompany(companyId: number): Promise<Template[]>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template>;
  deleteTemplate(id: number): Promise<void>;
  
  // Internal notes operations
  createInternalNote(note: InsertInternalNote): Promise<InternalNote>;
  getNotesByCustomer(customerId: number): Promise<InternalNote[]>;
  
  // Analytics operations
  getAnalytics(companyId: number): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  // User operations (required for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Company operations
  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  // Admin user management operations
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getUsersByCompany(companyId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.companyId, companyId));
  }

  async updateUser(id: string, user: Partial<UpsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...user, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
  }

  async createCompanyUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  // Customer operations
  async createCustomer(customer: InsertCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(customer).returning();
    return newCustomer;
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    return customer;
  }

  async getCustomersByCompany(companyId: number): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.companyId, companyId));
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer> {
    const [updated] = await db
      .update(customers)
      .set(customer)
      .where(eq(customers.id, id))
      .returning();
    return updated;
  }

  async searchCustomers(companyId: number, query: string): Promise<Customer[]> {
    return await db
      .select()
      .from(customers)
      .where(
        and(
          eq(customers.companyId, companyId),
          or(
            like(customers.name, `%${query}%`),
            like(customers.email, `%${query}%`),
            like(customers.phone, `%${query}%`)
          )
        )
      );
  }

  // Conversation operations
  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db.insert(conversations).values(conversation).returning();
    return newConversation;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation;
  }

  async getConversationsByCompany(companyId: number): Promise<Conversation[]> {
    return await db
      .select({
        id: conversations.id,
        customerId: conversations.customerId,
        channel: conversations.channel,
        status: conversations.status,
        assignedTo: conversations.assignedTo,
        priority: conversations.priority,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
        customerIsVip: customers.isVip,
        assignedUserName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        unreadCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${messages} 
          WHERE ${messages.conversationId} = ${conversations.id} 
          AND ${messages.isRead} = false 
          AND ${messages.senderType} = 'customer'
        )`,
        lastMessage: sql<string>`(
          SELECT ${messages.content} FROM ${messages} 
          WHERE ${messages.conversationId} = ${conversations.id} 
          ORDER BY ${messages.timestamp} DESC 
          LIMIT 1
        )`,
      })
      .from(conversations)
      .leftJoin(customers, eq(conversations.customerId, customers.id))
      .leftJoin(users, eq(conversations.assignedTo, users.id))
      .where(eq(customers.companyId, companyId))
      .orderBy(desc(conversations.lastMessageAt));
  }

  async updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation> {
    const [updated] = await db
      .update(conversations)
      .set({ ...conversation, lastMessageAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async getConversationWithDetails(id: number): Promise<any> {
    const [result] = await db
      .select({
        id: conversations.id,
        customerId: conversations.customerId,
        channel: conversations.channel,
        status: conversations.status,
        assignedTo: conversations.assignedTo,
        priority: conversations.priority,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        customerId2: customers.id,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerEmail: customers.email,
        customerWhatsappNumber: customers.whatsappNumber,
        customerInstagramHandle: customers.instagramHandle,
        customerFacebookId: customers.facebookId,
        customerIsVip: customers.isVip,
        customerCreatedAt: customers.createdAt,
        userId: users.id,
        userFirstName: users.firstName,
        userLastName: users.lastName,
        userEmail: users.email,
      })
      .from(conversations)
      .leftJoin(customers, eq(conversations.customerId, customers.id))
      .leftJoin(users, eq(conversations.assignedTo, users.id))
      .where(eq(conversations.id, id));
    
    if (!result) return null;
    
    // Restructure the data to match the expected format
    return {
      id: result.id,
      customerId: result.customerId,
      channel: result.channel,
      status: result.status,
      assignedTo: result.assignedTo,
      priority: result.priority,
      lastMessageAt: result.lastMessageAt,
      createdAt: result.createdAt,
      customer: {
        id: result.customerId2,
        name: result.customerName,
        phone: result.customerPhone,
        email: result.customerEmail,
        whatsappNumber: result.customerWhatsappNumber,
        instagramHandle: result.customerInstagramHandle,
        facebookId: result.customerFacebookId,
        isVip: result.customerIsVip,
        createdAt: result.customerCreatedAt,
      },
      assignedUser: result.userId ? {
        id: result.userId,
        firstName: result.userFirstName,
        lastName: result.userLastName,
        email: result.userEmail,
      } : null,
    };
  }

  // Message operations
  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Update conversation last message time
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId!));
    
    return newMessage;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.timestamp);
  }

  async markMessagesAsRead(conversationId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderType, "customer")
        )
      );
  }

  // Template operations
  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  async getTemplatesByCompany(companyId: number): Promise<Template[]> {
    return await db
      .select()
      .from(templates)
      .where(and(eq(templates.companyId, companyId), eq(templates.isActive, true)))
      .orderBy(templates.title);
  }

  async updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template> {
    const [updated] = await db
      .update(templates)
      .set(template)
      .where(eq(templates.id, id))
      .returning();
    return updated;
  }

  async deleteTemplate(id: number): Promise<void> {
    await db.update(templates).set({ isActive: false }).where(eq(templates.id, id));
  }

  // Internal notes operations
  async createInternalNote(note: InsertInternalNote): Promise<InternalNote> {
    const [newNote] = await db.insert(internalNotes).values(note).returning();
    return newNote;
  }

  async getNotesByCustomer(customerId: number): Promise<InternalNote[]> {
    return await db
      .select({
        id: internalNotes.id,
        customerId: internalNotes.customerId,
        content: internalNotes.content,
        createdBy: internalNotes.createdBy,
        createdAt: internalNotes.createdAt,
        createdByName: sql<string>`CONCAT(${users.firstName}, ' ', SUBSTRING(${users.lastName}, 1, 1), '.')`,
      })
      .from(internalNotes)
      .leftJoin(users, eq(internalNotes.createdBy, users.id))
      .where(eq(internalNotes.customerId, customerId))
      .orderBy(desc(internalNotes.createdAt));
  }

  // Analytics operations
  async getAnalytics(companyId: number): Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get conversation counts by status
    const conversationStats = await db
      .select({
        status: conversations.status,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(conversations)
      .leftJoin(customers, eq(conversations.customerId, customers.id))
      .where(eq(customers.companyId, companyId))
      .groupBy(conversations.status);

    // Get channel distribution
    const channelStats = await db
      .select({
        channel: conversations.channel,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(conversations)
      .leftJoin(customers, eq(conversations.customerId, customers.id))
      .where(eq(customers.companyId, companyId))
      .groupBy(conversations.channel);

    // Get today's conversations
    const todayConversations = await db
      .select({
        count: sql<number>`COUNT(*)::int`,
      })
      .from(conversations)
      .leftJoin(customers, eq(conversations.customerId, customers.id))
      .where(
        and(
          eq(customers.companyId, companyId),
          sql`${conversations.createdAt} >= ${today}`
        )
      );

    // Get team performance
    const teamPerformance = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        conversationCount: sql<number>`COUNT(DISTINCT ${conversations.id})::int`,
        avgResponseTime: sql<string>`COALESCE(AVG(EXTRACT(EPOCH FROM (${messages.timestamp} - ${conversations.createdAt})))/60, 0)`,
      })
      .from(users)
      .leftJoin(conversations, eq(users.id, conversations.assignedTo))
      .leftJoin(customers, eq(conversations.customerId, customers.id))
      .leftJoin(messages, and(
        eq(messages.conversationId, conversations.id),
        eq(messages.senderType, "agent")
      ))
      .where(eq(users.companyId, companyId))
      .groupBy(users.id, users.firstName, users.lastName);

    return {
      conversationStats: conversationStats.reduce((acc, stat) => {
        acc[stat.status || 'unknown'] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      channelStats: channelStats.map(stat => ({
        channel: stat.channel,
        count: stat.count,
        percentage: 0, // Will be calculated on frontend
      })),
      todayConversations: todayConversations[0]?.count || 0,
      teamPerformance: teamPerformance.map(member => ({
        userId: member.userId,
        name: `${member.firstName} ${member.lastName}`,
        conversationCount: member.conversationCount,
        avgResponseTime: Math.round(parseFloat(member.avgResponseTime || '0')),
      })),
    };
  }
}

export const storage = new DatabaseStorage();
