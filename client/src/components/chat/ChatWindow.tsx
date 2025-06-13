import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, Paperclip, Search, Phone, MoreVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface ChatWindowProps {
  conversationId: number | null;
  onConversationUpdate?: () => void;
}

interface Message {
  id: number;
  content: string;
  senderType: 'customer' | 'agent';
  senderId: string;
  timestamp: string;
  isRead: boolean;
}

interface Conversation {
  id: number;
  channel: string;
  status: string;
  customer: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    isVip: boolean;
  };
  assignedUser?: {
    firstName: string;
    lastName: string;
  };
}

const CHANNEL_COLORS = {
  whatsapp: "bg-green-500",
  email: "bg-blue-500",
  instagram: "bg-pink-500", 
  facebook: "bg-blue-600",
  phone: "bg-gray-500",
};

const CHANNEL_ICONS = {
  whatsapp: "fab fa-whatsapp",
  email: "fas fa-envelope",
  instagram: "fab fa-instagram",
  facebook: "fab fa-facebook",
  phone: "fas fa-phone",
};

const QUICK_TEMPLATES = [
  "Grazie per averci contattato",
  "Ti aiuto subito", 
  "Problema risolto?",
  "Contatta il supporto tecnico",
  "Perfetto, grazie mille!",
  "Ti invio subito i dettagli",
];

export default function ChatWindow({ conversationId, onConversationUpdate }: ChatWindowProps) {
  const [messageContent, setMessageContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch conversation details
  const { data: conversation } = useQuery({
    queryKey: ['/api/conversations', conversationId],
    enabled: !!conversationId,
  });

  // Fetch messages
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', conversationId, 'messages'],
    enabled: !!conversationId,
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest('POST', '/api/messages', {
        conversationId,
        content,
        senderType: 'agent',
      });
    },
    onSuccess: () => {
      setMessageContent("");
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversationId, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      onConversationUpdate?.();
    },
    onError: (error) => {
      toast({
        title: "Errore",
        description: "Impossibile inviare il messaggio",
        variant: "destructive",
      });
    },
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PUT', `/api/conversations/${conversationId}/mark-read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (conversationId && Array.isArray(messages) && messages.length > 0) {
      const hasUnreadMessages = messages.some((msg: Message) => 
        !msg.isRead && msg.senderType === 'customer'
      );
      if (hasUnreadMessages) {
        markAsReadMutation.mutate();
      }
    }
  }, [conversationId, messages]);

  const handleSendMessage = () => {
    if (!messageContent.trim() || !conversationId) return;
    sendMessageMutation.mutate(messageContent.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return "Oggi";
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return "Ieri";
    }
    
    return date.toLocaleDateString('it-IT', { 
      day: 'numeric', 
      month: 'long' 
    });
  };

  if (!conversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8" />
          </div>
          <p className="text-lg">Seleziona una conversazione</p>
          <p className="text-sm">Scegli una conversazione dalla lista per iniziare</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600">
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                  {getInitials(conversation?.customer?.name || "Unknown")}
                </AvatarFallback>
              </Avatar>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center",
                CHANNEL_COLORS[conversation?.channel as keyof typeof CHANNEL_COLORS]
              )}>
                <i className={cn(
                  "text-white text-xs",
                  CHANNEL_ICONS[conversation?.channel as keyof typeof CHANNEL_ICONS]
                )}></i>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">{conversation?.customer?.name || "Unknown Customer"}</h3>
                {conversation?.customer?.isVip && (
                  <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                    VIP
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {conversation?.channel === 'whatsapp' && 'WhatsApp'}
                {conversation?.channel === 'email' && 'Email'}
                {conversation?.channel === 'instagram' && 'Instagram'}
                {conversation?.channel === 'facebook' && 'Facebook'}
                {conversation?.channel === 'phone' && 'Telefono'}
                • Online ora
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="p-2">
              <Search className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-2">
              <Phone className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="p-2">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messagesLoading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            {/* Date Separator */}
            {Array.isArray(messages) && messages.length > 0 && (
              <div className="text-center">
                <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                  {formatDate(messages[0].timestamp)}
                </Badge>
              </div>
            )}

            {Array.isArray(messages) && messages.map((message: Message) => (
              <div 
                key={message.id}
                className={cn(
                  "flex items-start gap-2",
                  message.senderType === 'agent' && "justify-end"
                )}
              >
                {message.senderType === 'customer' && (
                  <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-xs">
                      {getInitials(conversation?.customer?.name || "Unknown")}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={cn(
                  "p-3 rounded-2xl max-w-md shadow-sm",
                  message.senderType === 'customer' 
                    ? "bg-white rounded-tl-sm" 
                    : "bg-green-600 text-white rounded-tr-sm"
                )}>
                  <p className={message.senderType === 'customer' ? "text-gray-900" : "text-white"}>
                    {message.content}
                  </p>
                  <span className={cn(
                    "text-xs mt-2 block",
                    message.senderType === 'customer' 
                      ? "text-gray-500" 
                      : "text-green-100"
                  )}>
                    {formatTime(message.timestamp)}
                    {message.senderType === 'agent' && " ✓✓"}
                  </span>
                </div>

                {message.senderType === 'agent' && (
                  <Avatar className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-700 text-white font-semibold text-xs">
                      {user?.firstName ? getInitials(`${user.firstName} ${user.lastName}`) : 'A'}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Typing Indicator (could be enhanced with real-time typing status) */}
            {sendMessageMutation.isPending && (
              <div className="flex items-start gap-2">
                <Avatar className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-gray-600 to-gray-700 text-white font-semibold text-xs">
                    {user?.firstName ? getInitials(`${user.firstName} ${user.lastName}`) : 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        {/* Quick Templates */}
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2">
          {QUICK_TEMPLATES.map((template, index) => (
            <Button
              key={index}
              size="sm"
              variant="outline"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-full whitespace-nowrap"
              onClick={() => setMessageContent(template)}
            >
              {template}
            </Button>
          ))}
        </div>

        <div className="flex items-end gap-3">
          <Button size="sm" variant="ghost" className="p-3">
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1 bg-gray-100 rounded-2xl">
            <Textarea
              placeholder="Scrivi un messaggio..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full p-3 bg-transparent resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={1}
            />
          </div>
          
          <Button 
            size="sm" 
            className="p-3 bg-green-600 hover:bg-green-700 rounded-full"
            onClick={handleSendMessage}
            disabled={!messageContent.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
