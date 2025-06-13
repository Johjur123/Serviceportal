import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import url from 'url';
import { storage } from './storage';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  companyId?: number;
  isAlive?: boolean;
}

class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<string, AuthenticatedWebSocket[]> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', this.handleConnection.bind(this));
    this.setupHeartbeat();
  }

  private async handleConnection(ws: AuthenticatedWebSocket, req: any) {
    try {
      // Parse query parameters for authentication
      const query = url.parse(req.url || '', true).query;
      const token = query.token as string;
      
      if (!token) {
        ws.close(1008, 'Authentication required');
        return;
      }

      // Validate token and get user info
      const userId = await this.validateToken(token);
      if (!userId) {
        ws.close(1008, 'Invalid token');
        return;
      }

      const user = await storage.getUser(userId);
      if (!user) {
        ws.close(1008, 'User not found');
        return;
      }

      ws.userId = userId;
      ws.companyId = user.companyId || undefined;
      ws.isAlive = true;

      // Add to company group
      const companyKey = `company_${user.companyId}`;
      if (!this.clients.has(companyKey)) {
        this.clients.set(companyKey, []);
      }
      this.clients.get(companyKey)?.push(ws);

      console.log(`WebSocket connected: User ${userId} in company ${user.companyId}`);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
        }
      });

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('close', () => {
        this.removeClient(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.removeClient(ws);
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Server error');
    }
  }

  private async validateToken(token: string): Promise<string | null> {
    // In a real implementation, you'd validate the JWT token
    // For now, we'll use a simple approach
    try {
      // This is a simplified token validation
      // In production, properly validate JWT tokens
      return token; // Return user ID from token
    } catch (error) {
      return null;
    }
  }

  private handleMessage(ws: AuthenticatedWebSocket, message: any) {
    switch (message.type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      case 'join_conversation':
        // Handle joining a specific conversation
        break;
      case 'leave_conversation':
        // Handle leaving a conversation
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  private removeClient(ws: AuthenticatedWebSocket) {
    if (ws.companyId) {
      const companyKey = `company_${ws.companyId}`;
      const clients = this.clients.get(companyKey);
      if (clients) {
        const index = clients.indexOf(ws);
        if (index > -1) {
          clients.splice(index, 1);
        }
        if (clients.length === 0) {
          this.clients.delete(companyKey);
        }
      }
    }
  }

  private setupHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (ws.isAlive === false) {
          this.removeClient(ws);
          return ws.terminate();
        }
        
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  // Broadcast to all clients in a company
  public broadcastToCompany(companyId: number, message: any) {
    const companyKey = `company_${companyId}`;
    const clients = this.clients.get(companyKey);
    
    if (clients) {
      const messageStr = JSON.stringify(message);
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(messageStr);
        }
      });
    }
  }

  // Broadcast new message notification
  public notifyNewMessage(companyId: number, conversationId: number, message: any) {
    this.broadcastToCompany(companyId, {
      type: 'new_message',
      conversationId,
      message,
      timestamp: Date.now()
    });
  }

  // Broadcast conversation status update
  public notifyConversationUpdate(companyId: number, conversationId: number, status: string) {
    this.broadcastToCompany(companyId, {
      type: 'conversation_update',
      conversationId,
      status,
      timestamp: Date.now()
    });
  }
}

export default WebSocketManager;