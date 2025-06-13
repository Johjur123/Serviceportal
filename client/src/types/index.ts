// Core application types
export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'super_admin' | 'company_admin' | 'agent';
  companyId?: number;
  profileImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Company {
  id: number;
  name: string;
  subscriptionPlan: string;
  isActive: boolean;
  maxUsers: number;
  maxChannels: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
  instagramHandle?: string;
  facebookId?: string;
  isVip: boolean;
  companyId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: number;
  customerId: number;
  channel: 'whatsapp' | 'email' | 'instagram' | 'facebook' | 'phone';
  status: 'new' | 'in-progress' | 'resolved' | 'closed';
  assignedUserId?: string;
  companyId: number;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  assignedUser?: User;
}

export interface Message {
  id: number;
  conversationId: number;
  content: string;
  senderType: 'customer' | 'agent';
  senderId: string;
  timestamp: string;
  isRead: boolean;
  createdAt: string;
}

export interface InternalNote {
  id: number;
  customerId: number;
  content: string;
  createdBy: string;
  createdAt: string;
  createdByName: string;
}

export interface Template {
  id: number;
  name: string;
  content: string;
  companyId: number;
  createdAt: string;
}

export interface Analytics {
  conversationStats: {
    new: number;
    'in-progress': number;
    resolved: number;
    closed: number;
  };
  todayConversations: number;
  teamPerformance: Array<{
    userId: string;
    name: string;
    avgResponseTime: number;
    conversationsHandled: number;
  }>;
}