import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Phone, Mail, MessageSquare, User, History, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import type { Conversation, InternalNote } from "@/types";

interface CustomerInfoProps {
  conversationId: number | null;
}

// Types imported from @/types

export default function CustomerInfo({ conversationId }: CustomerInfoProps) {
  const [newNote, setNewNote] = useState("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch conversation details
  const { data: conversation } = useQuery<Conversation>({
    queryKey: ['/api/conversations', conversationId],
    enabled: !!conversationId,
  });

  // Fetch internal notes
  const { data: notes = [] } = useQuery<InternalNote[]>({
    queryKey: ['/api/customers', conversation?.customer?.id, 'notes'],
    enabled: !!conversation?.customer?.id,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest('POST', '/api/internal-notes', {
        customerId: conversation?.customer?.id,
        content,
      });
    },
    onSuccess: () => {
      setNewNote("");
      queryClient.invalidateQueries({ 
        queryKey: ['/api/customers', conversation?.customer?.id, 'notes'] 
      });
      toast({
        title: "Nota aggiunta",
        description: "La nota interna è stata salvata con successo",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile salvare la nota",
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `${diffHours}h fa`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} giorni fa`;
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate(newNote.trim());
  };

  if (!conversationId || !conversation) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Seleziona una conversazione<br />
          per vedere le informazioni cliente
        </p>
      </div>
    );
  }

  const { customer } = conversation;

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Customer Profile */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-center mb-4">
          <Avatar className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 mx-auto mb-3">
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-semibold text-lg">
              {getInitials(customer?.name || "Unknown")}
            </AvatarFallback>
          </Avatar>
          <h3 className="font-semibold text-lg text-gray-900">{customer?.name || "Unknown Customer"}</h3>
          <p className="text-sm text-gray-500">
            Cliente dal {customer?.createdAt ? formatDate(customer.createdAt) : "Data sconosciuta"}
          </p>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          {customer?.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{customer.phone}</span>
            </div>
          )}
          
          {customer?.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-700">{customer.email}</span>
            </div>
          )}
          
          {customer?.whatsappNumber && (
            <div className="flex items-center gap-3 text-sm">
              <MessageSquare className="h-4 w-4 text-green-500" />
              <span className="text-gray-700">WhatsApp collegato</span>
            </div>
          )}
          
          {customer?.instagramHandle && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-4 h-4 text-pink-500">📷</span>
              <span className="text-gray-700">@{customer.instagramHandle}</span>
            </div>
          )}
          
          {customer?.facebookId && (
            <div className="flex items-center gap-3 text-sm">
              <span className="w-4 h-4 text-blue-600">f</span>
              <span className="text-gray-700">Facebook collegato</span>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="mt-4">
          <Badge 
            variant="secondary" 
            className={cn(
              "text-sm",
              customer?.isVip 
                ? "bg-yellow-100 text-yellow-800" 
                : "bg-green-100 text-green-800"
            )}
          >
            <span className={cn(
              "w-2 h-2 rounded-full mr-2",
              customer?.isVip ? "bg-yellow-500" : "bg-green-500"
            )}></span>
            {customer?.isVip ? "Cliente VIP" : "Cliente Standard"}
          </Badge>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Azioni Rapide</h4>
        <div className="grid grid-cols-2 gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="p-3 h-auto flex flex-col items-center gap-1"
            onClick={() => customer?.phone && window.open(`tel:${customer.phone}`)}
          >
            <Phone className="h-4 w-4" />
            <span className="text-xs">Chiama</span>
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="p-3 h-auto flex flex-col items-center gap-1"
            onClick={() => customer?.email && window.open(`mailto:${customer.email}`)}
          >
            <Mail className="h-4 w-4" />
            <span className="text-xs">Email</span>
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="p-3 h-auto flex flex-col items-center gap-1"
          >
            <Edit className="h-4 w-4" />
            <span className="text-xs">Modifica</span>
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="p-3 h-auto flex flex-col items-center gap-1"
          >
            <History className="h-4 w-4" />
            <span className="text-xs">Storico</span>
          </Button>
        </div>
      </div>

      {/* Internal Notes */}
      <div className="flex-1 p-4 flex flex-col">
        <h4 className="font-medium text-gray-900 mb-3">Note Interne</h4>
        
        {/* Notes List */}
        <div className="flex-1 space-y-3 mb-4 overflow-y-auto">
          {notes.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nessuna nota interna
            </p>
          ) : (
            notes.map((note: InternalNote) => (
              <div 
                key={note.id} 
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
              >
                <div className="flex items-start justify-between mb-1">
                  <span className="text-xs font-medium text-yellow-800">
                    {note.createdByName}
                  </span>
                  <span className="text-xs text-yellow-600">
                    {formatDateTime(note.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-yellow-800">{note.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Add Note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Aggiungi una nota interna..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="resize-none text-sm"
            rows={3}
          />
          <Button 
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleAddNote}
            disabled={!newNote.trim() || addNoteMutation.isPending}
          >
            {addNoteMutation.isPending ? "Salvando..." : "Aggiungi Nota"}
          </Button>
        </div>
      </div>

      {/* Conversation Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-3">Statistiche Conversazione</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Canale:</span>
            <span className="font-medium text-gray-900 capitalize">
              {conversation.channel === 'whatsapp' && 'WhatsApp'}
              {conversation.channel === 'email' && 'Email'}
              {conversation.channel === 'instagram' && 'Instagram'}
              {conversation.channel === 'facebook' && 'Facebook'}
              {conversation.channel === 'phone' && 'Telefono'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Stato:</span>
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs",
                conversation.status === 'new' && "bg-red-100 text-red-800",
                conversation.status === 'in-progress' && "bg-yellow-100 text-yellow-800", 
                conversation.status === 'resolved' && "bg-green-100 text-green-800"
              )}
            >
              <span className={cn(
                "w-2 h-2 rounded-full mr-1",
                conversation.status === 'new' && "bg-red-500",
                conversation.status === 'in-progress' && "bg-yellow-500",
                conversation.status === 'resolved' && "bg-green-500"
              )}></span>
              {conversation.status === 'new' && 'Nuovo'}
              {conversation.status === 'in-progress' && 'In corso'}
              {conversation.status === 'resolved' && 'Risolto'}
            </Badge>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Assegnato a:</span>
            <span className="font-medium text-gray-900">
              {conversation.assignedUser 
                ? `${conversation.assignedUser.firstName} ${conversation.assignedUser.lastName}`
                : 'Non assegnato'
              }
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Creata:</span>
            <span className="font-medium text-gray-900">
              {formatDate(conversation.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
