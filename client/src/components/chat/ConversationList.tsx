import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Conversation } from "@/types";

interface ConversationListProps {
  onSelectConversation: (id: number) => void;
  selectedConversationId: number | null;
}

// Using Conversation type from @/types

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

const STATUS_COLORS = {
  new: "bg-red-100 text-red-800",
  "in-progress": "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
};

const STATUS_ICONS = {
  new: "fas fa-circle text-red-500",
  "in-progress": "fas fa-clock text-yellow-500", 
  resolved: "fas fa-check-circle text-green-500",
};

export default function ConversationList({ onSelectConversation, selectedConversationId }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: conversations = [], isLoading, refetch } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Auto-select first conversation if none selected
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      onSelectConversation(conversations[0].id);
    }
  }, [conversations, selectedConversationId, onSelectConversation]);

  const filteredConversations = Array.isArray(conversations) ? conversations.filter((conv: any) => {
    const customerName = conv.customer?.name || "Unknown";
    const matchesSearch = customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "all" || conv.status === filterStatus;
    return matchesSearch && matchesFilter;
  }) : [];

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
    }
  };

  if (isLoading) {
    return (
      <div className="w-80 bg-white border-r border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Caricamento conversazioni...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-green-600 text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Conversazioni</h2>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-2 hover:bg-green-700 text-white"
              onClick={() => refetch()}
            >
              <Search className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              className="p-2 hover:bg-green-700 text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Input
            type="text"
            placeholder="Cerca conversazioni..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 bg-white/20 border-white/30 placeholder:text-white/70 text-white focus:bg-white focus:text-gray-900 focus:placeholder:text-gray-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/70" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2 text-sm">
          <Button
            size="sm"
            variant={filterStatus === "all" ? "default" : "outline"}
            className={cn(
              "px-3 py-1 rounded-full",
              filterStatus === "all" && "bg-green-600 text-white"
            )}
            onClick={() => setFilterStatus("all")}
          >
            Tutte ({conversations.length})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === "new" ? "default" : "outline"}
            className={cn(
              "px-3 py-1 rounded-full",
              filterStatus === "new" && "bg-green-600 text-white"
            )}
            onClick={() => setFilterStatus("new")}
          >
            Nuove ({conversations.filter((c: Conversation) => c.status === 'new').length})
          </Button>
          <Button
            size="sm"
            variant={filterStatus === "in-progress" ? "default" : "outline"}
            className={cn(
              "px-3 py-1 rounded-full",
              filterStatus === "in-progress" && "bg-green-600 text-white"
            )}
            onClick={() => setFilterStatus("in-progress")}
          >
            In corso ({conversations.filter((c: Conversation) => c.status === 'in-progress').length})
          </Button>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>Nessuna conversazione trovata</p>
          </div>
        ) : (
          filteredConversations.map((conversation: Conversation) => (
            <div
              key={conversation.id}
              className={cn(
                "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                selectedConversationId === conversation.id && "bg-blue-50 border-l-4 border-l-green-600"
              )}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold">
                      {getInitials(conversation.customer?.name || "Unknown")}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center",
                    CHANNEL_COLORS[conversation.channel as keyof typeof CHANNEL_COLORS]
                  )}>
                    <i className={cn(
                      "text-white text-xs",
                      CHANNEL_ICONS[conversation.channel as keyof typeof CHANNEL_ICONS]
                    )}></i>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-gray-900 truncate flex items-center gap-2">
                      {conversation.customer?.name || "Unknown"}
                      {conversation.customer?.isVip && (
                        <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                          VIP
                        </Badge>
                      )}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatTime(conversation.updatedAt)}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 truncate mb-2">
                    Nessun messaggio
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs",
                        STATUS_COLORS[conversation.status as keyof typeof STATUS_COLORS]
                      )}
                    >
                      <i className={cn(
                        "mr-1 text-xs",
                        STATUS_ICONS[conversation.status as keyof typeof STATUS_ICONS]
                      )}></i>
                      {conversation.status === 'new' && 'Nuovo'}
                      {conversation.status === 'in-progress' && 'In corso'}
                      {conversation.status === 'resolved' && 'Risolto'}
                    </Badge>
                    
                    {/* Unread count would be calculated from messages */}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
