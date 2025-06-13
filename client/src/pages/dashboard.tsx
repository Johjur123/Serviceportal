import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import TopNavigation from "@/components/layout/TopNavigation";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import CustomerInfo from "@/components/chat/CustomerInfo";
import AnalyticsModal from "@/components/modals/AnalyticsModal";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorizzato",
        description: "Stai per essere reindirizzato alla pagina di login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopNavigation onShowAnalytics={() => setShowAnalytics(true)} />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Conversations */}
        <ConversationList 
          onSelectConversation={setSelectedConversationId}
          selectedConversationId={selectedConversationId}
        />

        {/* Center - Chat Window */}
        <ChatWindow 
          conversationId={selectedConversationId}
          onConversationUpdate={() => {
            // Trigger refresh of conversation list
          }}
        />

        {/* Right Sidebar - Customer Info */}
        <CustomerInfo 
          conversationId={selectedConversationId}
        />
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <AnalyticsModal 
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />
      )}
    </div>
  );
}
