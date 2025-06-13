import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import TopNavigation from "@/components/layout/TopNavigation";
import ConversationList from "@/components/chat/ConversationList";
import ChatWindow from "@/components/chat/ChatWindow";
import CustomerInfo from "@/components/chat/CustomerInfo";
import AnalyticsModal from "@/components/modals/AnalyticsModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Users } from "lucide-react";

const customerSchema = z.object({
  name: z.string().min(1, "Nome è richiesto"),
  email: z.string().email("Email non valida").optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  instagramHandle: z.string().optional(),
  facebookId: z.string().optional(),
  isVip: z.boolean().default(false),
});

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showCreateCustomer, setShowCreateCustomer] = useState(false);

  const customerForm = useForm<z.infer<typeof customerSchema>>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      whatsappNumber: "",
      instagramHandle: "",
      facebookId: "",
      isVip: false,
    },
  });

  const createCustomerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof customerSchema>) => {
      return await apiRequest("/api/customers", "POST", data);
    },
    onSuccess: () => {
      toast({
        title: "Cliente creato",
        description: "Il cliente è stato aggiunto con successo.",
      });
      setShowCreateCustomer(false);
      customerForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Errore",
        description: "Impossibile creare il cliente. Riprova.",
        variant: "destructive",
      });
    },
  });

  const onCreateCustomer = (data: z.infer<typeof customerSchema>) => {
    createCustomerMutation.mutate(data);
  };

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
      
      {/* Quick Actions Bar */}
      <div className="bg-white border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
          <div className="flex items-center gap-3">
            <Dialog open={showCreateCustomer} onOpenChange={setShowCreateCustomer}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Crea Nuovo Cliente</DialogTitle>
                  <DialogDescription>
                    Aggiungi un nuovo cliente al sistema con i suoi dettagli di contatto.
                  </DialogDescription>
                </DialogHeader>
                <Form {...customerForm}>
                  <form onSubmit={customerForm.handleSubmit(onCreateCustomer)} className="space-y-4">
                    <FormField
                      control={customerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome del cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="cliente@esempio.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefono</FormLabel>
                          <FormControl>
                            <Input placeholder="+39 123 456 7890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="whatsappNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>WhatsApp</FormLabel>
                          <FormControl>
                            <Input placeholder="+39 123 456 7890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="instagramHandle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instagram</FormLabel>
                          <FormControl>
                            <Input placeholder="@username" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={customerForm.control}
                      name="facebookId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook ID</FormLabel>
                          <FormControl>
                            <Input placeholder="ID Facebook" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createCustomerMutation.isPending}
                        className="w-full"
                      >
                        {createCustomerMutation.isPending ? "Creazione..." : "Crea Cliente"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      
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
