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
    const [conversation] = await db
      .select({
        id: conversations.id,
        customerId: conversations.customerId,
        channel: conversations.channel,
        status: conversations.status,
        assignedTo: conversations.assignedTo,
        priority: conversations.priority,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt,
        customer: {
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          email: customers.email,
          whatsappNumber: customers.whatsappNumber,
          instagramHandle: customers.instagramHandle,
          facebookId: customers.facebookId,
          isVip: customers.isVip,
          createdAt: customers.createdAt,
        },
        assignedUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(conversations)
      .leftJoin(customers, eq(conversations.customerId, customers.id))
      .leftJoin(users, eq(conversations.assignedTo, users.id))
      .where(eq(conversations.id, id));
    return conversation;
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
