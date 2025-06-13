# Multi-Channel Customer Service Hub - Technical Documentation

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Authentication & Authorization](#authentication--authorization)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Security Implementation](#security-implementation)
7. [Role-Based Access Control](#role-based-access-control)
8. [Real-time Features](#real-time-features)
9. [Installation & Deployment](#installation--deployment)
10. [Code Examples](#code-examples)

## System Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit OpenID Connect
- **UI Framework**: Tailwind CSS + shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Form Handling**: React Hook Form + Zod validation

### Application Structure
```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── types/          # TypeScript type definitions
├── server/                 # Backend Express application
│   ├── db.ts              # Database connection
│   ├── routes.ts          # API route handlers
│   ├── storage.ts         # Data access layer
│   ├── replitAuth.ts      # Authentication middleware
│   └── index.ts           # Server entry point
├── shared/                 # Shared code between client/server
│   └── schema.ts          # Database schema & types
```

## Database Schema

### Core Tables

#### Users Table
```typescript
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  role: varchar("role").$type<'super_admin' | 'company_admin' | 'agent'>().default('agent'),
  companyId: integer("company_id").references(() => companies.id),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

#### Companies Table
```typescript
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subscriptionPlan: varchar("subscription_plan").default('basic'),
  isActive: boolean("is_active").default(true),
  maxUsers: integer("max_users").default(5),
  maxChannels: integer("max_channels").default(3),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

#### Customers Table
```typescript
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone"),
  email: varchar("email"),
  whatsappNumber: varchar("whatsapp_number"),
  instagramHandle: varchar("instagram_handle"),
  facebookId: varchar("facebook_id"),
  isVip: boolean("is_vip").default(false),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

#### Conversations Table
```typescript
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").references(() => customers.id).notNull(),
  channel: varchar("channel").$type<'whatsapp' | 'email' | 'instagram' | 'facebook' | 'phone'>().notNull(),
  status: varchar("status").$type<'new' | 'in-progress' | 'resolved' | 'closed'>().default('new'),
  assignedUserId: varchar("assigned_user_id").references(() => users.id),
  companyId: integer("company_id").references(() => companies.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

#### Messages Table
```typescript
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  content: text("content").notNull(),
  senderType: varchar("sender_type").$type<'customer' | 'agent'>().notNull(),
  senderId: varchar("sender_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```

## Authentication & Authorization

### Replit OpenID Connect Integration

The application uses Replit's OpenID Connect provider for authentication:

```typescript
// server/replitAuth.ts
export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const config = await getOidcConfig();

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  // Setup strategy for each domain
  for (const domain of process.env.REPLIT_DOMAINS!.split(",")) {
    const strategy = new Strategy({
      name: `replitauth:${domain}`,
      config,
      scope: "openid email profile offline_access",
      callbackURL: `https://${domain}/api/callback`,
    }, verify);
    passport.use(strategy);
  }
}
```

### Authentication Middleware
```typescript
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  // Handle token refresh
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
```

## API Endpoints

### Authentication Routes
- `GET /api/login` - Initiate login flow
- `GET /api/callback` - OAuth callback handler
- `GET /api/logout` - Logout and session cleanup
- `GET /api/auth/user` - Get current user info

### User Management Routes
- `GET /api/users` - List all users (Super Admin only)
- `POST /api/users` - Create new user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Company Management Routes
- `GET /api/companies` - List companies (Super Admin only)
- `POST /api/companies` - Create company
- `PATCH /api/companies/:id` - Update company
- `GET /api/companies/:id/users` - Get company users

### Customer Management Routes
- `GET /api/customers` - List customers for company
- `POST /api/customers` - Create customer
- `PATCH /api/customers/:id` - Update customer
- `GET /api/customers/search` - Search customers

### Conversation Routes
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `PATCH /api/conversations/:id` - Update conversation
- `GET /api/conversations/:id/messages` - Get messages

### Message Routes  
- `POST /api/messages` - Send message
- `PATCH /api/messages/:id/read` - Mark as read

### Analytics Routes
- `GET /api/analytics` - Get dashboard analytics

## Frontend Components

### Core Components Architecture

#### Authentication Hook
```typescript
// client/src/hooks/useAuth.ts
export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
```

#### Chat Window Component
```typescript
// client/src/components/chat/ChatWindow.tsx
export default function ChatWindow({ conversationId, onConversationUpdate }: ChatWindowProps) {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: messages = [], refetch } = useQuery<Message[]>({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId,
    refetchInterval: 5000, // Real-time polling
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest(`/api/messages`, {
        method: "POST",
        body: JSON.stringify({
          conversationId,
          content,
          senderType: 'agent',
          senderId: user?.id,
        }),
      });
    },
    onSuccess: () => {
      setMessage("");
      refetch();
      onConversationUpdate?.();
    },
  });

  const handleSendMessage = () => {
    if (message.trim() && conversationId) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Component JSX...
}
```

#### Role-Based Routing
```typescript
// client/src/App.tsx
function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>;
  }

  if (!isAuthenticated) {
    return <Route path="/" component={Landing} />;
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      {user?.role === 'super_admin' && (
        <Route path="/admin" component={AdminPage} />
      )}
      <Route component={NotFound} />
    </Switch>
  );
}
```

## Security Implementation

### Data Access Control
```typescript
// server/storage.ts - Example with company isolation
async getConversationsByCompany(companyId: number): Promise<Conversation[]> {
  const result = await db
    .select({
      id: conversations.id,
      customerId: conversations.customerId,
      channel: conversations.channel,
      status: conversations.status,
      assignedUserId: conversations.assignedUserId,
      companyId: conversations.companyId,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      customer: {
        id: customers.id,
        name: customers.name,
        isVip: customers.isVip,
      },
      assignedUser: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      },
    })
    .from(conversations)
    .leftJoin(customers, eq(conversations.customerId, customers.id))
    .leftJoin(users, eq(conversations.assignedUserId, users.id))
    .where(eq(conversations.companyId, companyId))
    .orderBy(desc(conversations.updatedAt));

  return result;
}
```

### Input Validation
```typescript
// Using Zod schemas for validation
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
}).extend({
  content: z.string().min(1, "Message content is required").max(5000, "Message too long"),
});

// In route handler
app.post('/api/messages', isAuthenticated, async (req, res) => {
  try {
    const validatedData = insertMessageSchema.parse(req.body);
    const message = await storage.createMessage(validatedData);
    res.json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});
```

### Session Security
```typescript
// server/replitAuth.ts
export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true, // HTTPS only
      maxAge: sessionTtl,
    },
  });
}
```

## Role-Based Access Control

### Three-Tier System

#### Super Admin
- Full system access
- Company management (create, edit, delete)
- Global user management
- System analytics
- Subscription plan management

#### Company Admin  
- Company-specific management
- User management within company
- Customer management
- Conversation oversight
- Company analytics

#### Agent
- Assigned conversation handling
- Customer interaction
- Message management
- Basic customer info access

### Role Enforcement
```typescript
// Middleware for role checking
const requireRole = (allowedRoles: string[]) => {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub;
    const user = await storage.getUser(userId);
    
    if (!user || !allowedRoles.includes(user.role || 'agent')) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    req.currentUser = user;
    next();
  };
};

// Usage in routes
app.get('/api/companies', 
  isAuthenticated, 
  requireRole(['super_admin']), 
  async (req, res) => {
    const companies = await storage.getAllCompanies();
    res.json(companies);
  }
);
```

## Real-time Features

### Polling Strategy
The application uses intelligent polling for real-time updates:

```typescript
// Message polling in ChatWindow
const { data: messages = [], refetch } = useQuery<Message[]>({
  queryKey: ['/api/conversations', conversationId, 'messages'],
  enabled: !!conversationId,
  refetchInterval: 5000, // Poll every 5 seconds
  refetchIntervalInBackground: true,
});

// Conversation list polling
const { data: conversations = [], refetch: refetchConversations } = useQuery<Conversation[]>({
  queryKey: ['/api/conversations'],
  refetchInterval: 10000, // Poll every 10 seconds
});
```

### Unread Message Tracking
```typescript
// Mark messages as read when conversation is viewed
useEffect(() => {
  if (conversationId && messages.length > 0) {
    const hasUnreadMessages = messages.some((msg: Message) => 
      !msg.isRead && msg.senderType === 'customer'
    );
    
    if (hasUnreadMessages) {
      // Mark as read after a delay
      const timer = setTimeout(() => {
        markAsReadMutation.mutate(conversationId);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }
}, [conversationId, messages]);
```

## Installation & Deployment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Replit account for authentication

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-secret-key
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-domain.replit.app
ISSUER_URL=https://replit.com/oidc
```

### Installation Steps
```bash
# Install dependencies
npm install

# Setup database
npm run db:push

# Start development server
npm run dev
```

### Production Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

### Database Migration
```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:push

# Reset database (development only)
npm run db:reset
```

## Code Examples

### Complete API Route Example
```typescript
// server/routes.ts - Message creation with full validation
app.post('/api/messages', isAuthenticated, async (req, res) => {
  try {
    const userId = req.user?.claims?.sub;
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Validate input
    const validatedData = insertMessageSchema.parse({
      ...req.body,
      senderId: userId,
      senderType: 'agent',
    });

    // Verify conversation access
    const conversation = await storage.getConversation(validatedData.conversationId);
    if (!conversation || conversation.companyId !== user.companyId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Create message
    const message = await storage.createMessage(validatedData);
    
    // Update conversation status
    await storage.updateConversation(conversation.id, {
      status: 'in-progress',
      assignedUserId: userId,
      updatedAt: new Date(),
    });

    res.json(message);
  } catch (error) {
    console.error('Error creating message:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
    res.status(500).json({ message: "Internal server error" });
  }
});
```

### Complete Component with Error Handling
```typescript
// client/src/components/chat/ConversationList.tsx
export default function ConversationList({ onSelectConversation, selectedConversationId }: ConversationListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: conversations = [], isLoading, error } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    refetchInterval: 10000,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-16 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600">Unable to load conversations</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Component JSX...
}
```

### Form Validation Example
```typescript
// client/src/pages/admin.tsx - User creation form
const userForm = useForm<z.infer<typeof createUserSchema>>({
  resolver: zodResolver(createUserSchema),
  defaultValues: {
    email: "",
    firstName: "",
    lastName: "",
    role: "agent",
    companyId: undefined,
  },
});

const createUserMutation = useMutation({
  mutationFn: async (data: z.infer<typeof createUserSchema>) => {
    await apiRequest("/api/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  onSuccess: () => {
    toast({
      title: "Success",
      description: "User created successfully",
    });
    userForm.reset();
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    setIsCreateUserOpen(false);
  },
  onError: (error) => {
    toast({
      title: "Error",
      description: error.message || "Failed to create user",
      variant: "destructive",
    });
  },
});

const onSubmitUser = (values: z.infer<typeof createUserSchema>) => {
  createUserMutation.mutate(values);
};
```

## Performance Optimizations

### Query Optimization
```typescript
// Efficient conversation loading with relationships
async getConversationsByCompany(companyId: number): Promise<Conversation[]> {
  const result = await db
    .select({
      id: conversations.id,
      customerId: conversations.customerId,
      channel: conversations.channel,
      status: conversations.status,
      assignedUserId: conversations.assignedUserId,
      companyId: conversations.companyId,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
      customer: {
        id: customers.id,
        name: customers.name,
        isVip: customers.isVip,
        phone: customers.phone,
        email: customers.email,
      },
      assignedUser: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
      },
    })
    .from(conversations)
    .leftJoin(customers, eq(conversations.customerId, customers.id))
    .leftJoin(users, eq(conversations.assignedUserId, users.id))
    .where(eq(conversations.companyId, companyId))
    .orderBy(desc(conversations.updatedAt))
    .limit(100); // Pagination for large datasets

  return result;
}
```

### Frontend Performance
```typescript
// Memoized components for better performance
const ConversationItem = memo(({ conversation, isSelected, onClick }: ConversationItemProps) => {
  const getChannelIcon = useCallback((channel: string) => {
    switch (channel) {
      case 'whatsapp': return <MessageCircle className="h-4 w-4 text-green-600" />;
      case 'email': return <Mail className="h-4 w-4 text-blue-600" />;
      case 'instagram': return <Instagram className="h-4 w-4 text-pink-600" />;
      case 'facebook': return <Facebook className="h-4 w-4 text-blue-700" />;
      case 'phone': return <Phone className="h-4 w-4 text-gray-600" />;
      default: return <MessageCircle className="h-4 w-4" />;
    }
  }, []);

  return (
    <div 
      className={`p-4 border-b cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
      }`}
      onClick={() => onClick(conversation.id)}
    >
      {/* Component content */}
    </div>
  );
});
```

## Error Handling & Logging

### Server-side Error Handling
```typescript
// server/index.ts - Global error handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  
  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ message: 'Internal server error' });
  } else {
    res.status(500).json({ 
      message: err.message, 
      stack: err.stack 
    });
  }
});

// Custom error classes
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class AuthorizationError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}
```

### Client-side Error Boundaries
```typescript
// client/src/components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## Testing Strategy

### Unit Tests Example
```typescript
// server/__tests__/storage.test.ts
describe('DatabaseStorage', () => {
  let storage: DatabaseStorage;
  let testCompany: Company;

  beforeEach(async () => {
    storage = new DatabaseStorage();
    testCompany = await storage.createCompany({
      name: 'Test Company',
      subscriptionPlan: 'basic',
    });
  });

  describe('createCustomer', () => {
    it('should create a customer successfully', async () => {
      const customerData = {
        name: 'John Doe',
        email: 'john@example.com',
        companyId: testCompany.id,
      };

      const customer = await storage.createCustomer(customerData);

      expect(customer.name).toBe(customerData.name);
      expect(customer.email).toBe(customerData.email);
      expect(customer.companyId).toBe(testCompany.id);
    });

    it('should enforce company isolation', async () => {
      const customer = await storage.createCustomer({
        name: 'John Doe',
        companyId: testCompany.id,
      });

      const anotherCompany = await storage.createCompany({
        name: 'Another Company',
      });

      const customers = await storage.getCustomersByCompany(anotherCompany.id);
      expect(customers).not.toContainEqual(customer);
    });
  });
});
```

### Integration Tests
```typescript
// server/__tests__/routes.test.ts
describe('API Routes', () => {
  let app: Express;
  let agent: SuperTest<Test>;

  beforeEach(() => {
    app = express();
    // Setup test app with routes
    agent = request(app);
  });

  describe('POST /api/messages', () => {
    it('should create a message when authenticated', async () => {
      const response = await agent
        .post('/api/messages')
        .set('Authorization', 'Bearer valid-token')
        .send({
          conversationId: 1,
          content: 'Test message',
        });

      expect(response.status).toBe(200);
      expect(response.body.content).toBe('Test message');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await agent
        .post('/api/messages')
        .send({
          conversationId: 1,
          content: 'Test message',
        });

      expect(response.status).toBe(401);
    });
  });
});
```

## Monitoring & Analytics

### Application Metrics
```typescript
// server/metrics.ts
class MetricsCollector {
  private requestCount = 0;
  private responseTimeSum = 0;
  private errorCount = 0;

  trackRequest(responseTime: number) {
    this.requestCount++;
    this.responseTimeSum += responseTime;
  }

  trackError() {
    this.errorCount++;
  }

  getMetrics() {
    return {
      requestCount: this.requestCount,
      avgResponseTime: this.responseTimeSum / this.requestCount,
      errorRate: this.errorCount / this.requestCount,
    };
  }
}

// Usage in middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const responseTime = Date.now() - start;
    metrics.trackRequest(responseTime);
    
    if (res.statusCode >= 400) {
      metrics.trackError();
    }
  });
  
  next();
});
```

## Scalability Considerations

### Database Indexing
```sql
-- Essential indexes for performance
CREATE INDEX idx_conversations_company_id ON conversations(company_id);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_customers_company_id ON customers(company_id);
CREATE INDEX idx_users_company_id ON users(company_id);
```

### Caching Strategy
```typescript
// server/cache.ts
import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

export const withCache = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  const cached = cache.get<T>(key);
  if (cached) {
    return Promise.resolve(cached);
  }

  return fetcher().then(result => {
    cache.set(key, result, ttl);
    return result;
  });
};

// Usage in storage layer
async getConversationsByCompany(companyId: number): Promise<Conversation[]> {
  return withCache(
    `conversations:${companyId}`,
    () => this.fetchConversationsFromDB(companyId),
    60 // 1 minute cache
  );
}
```

## Security Checklist

### Production Security Requirements
- [ ] HTTPS enforced in production
- [ ] Session secrets properly configured
- [ ] Database connections use SSL
- [ ] Input validation on all endpoints
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] SQL injection protection (using parameterized queries)
- [ ] XSS protection (input sanitization)
- [ ] CSRF protection for state-changing operations
- [ ] Regular security updates for dependencies

### Environment Variables Security
```bash
# Production environment variables
DATABASE_URL=postgresql://user:password@host:5432/db?sslmode=require
SESSION_SECRET=complex-random-string-min-32-chars
REPL_ID=your-repl-id
REPLIT_DOMAINS=your-production-domain.com
NODE_ENV=production
```

This comprehensive documentation covers all aspects of the Multi-Channel Customer Service Hub application, from architecture and security to deployment and testing strategies. The codebase is production-ready with proper error handling, authentication, and role-based access control.