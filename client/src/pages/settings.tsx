import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import TopNavigation from "@/components/layout/TopNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Settings, Bell, Shield, Globe, Users, MessageSquare } from "lucide-react";
import type { User, Template } from "@/types";

const profileSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("Email non valida").optional(),
});

const templateSchema = z.object({
  name: z.string().min(1, "Nome template richiesto"),
  content: z.string().min(1, "Contenuto template richiesto"),
});

export default function SettingsPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState("profile");

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const templateForm = useForm<z.infer<typeof templateSchema>>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: "",
      content: "",
    },
  });

  const { data: templates = [] } = useQuery<Template[]>({
    queryKey: ['/api/templates'],
    enabled: isAuthenticated,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileSchema>) => {
      const response = await apiRequest("PUT", "/api/auth/user", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profilo aggiornato",
        description: "Le tue informazioni sono state salvate con successo.",
      });
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
        description: "Impossibile aggiornare il profilo. Riprova.",
        variant: "destructive",
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof templateSchema>) => {
      const response = await apiRequest("POST", "/api/templates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Template creato",
        description: "Il template è stato salvato con successo.",
      });
      templateForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
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
        description: "Impossibile creare il template. Riprova.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: number) => {
      await apiRequest("DELETE", `/api/templates/${templateId}`);
    },
    onSuccess: () => {
      toast({
        title: "Template eliminato",
        description: "Il template è stato rimosso con successo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/templates"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il template. Riprova.",
        variant: "destructive",
      });
    },
  });

  const onUpdateProfile = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate(data);
  };

  const onCreateTemplate = (data: z.infer<typeof templateSchema>) => {
    createTemplateMutation.mutate(data);
  };

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
      });
    }
  }, [user, profileForm]);

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
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopNavigation onShowAnalytics={() => {}} />
      
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Impostazioni</h1>
            <p className="text-gray-600">Gestisci le tue preferenze e configurazioni</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardContent className="p-0">
                  <nav className="space-y-1">
                    <button
                      onClick={() => setActiveSection("profile")}
                      className={`w-full text-left px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                        activeSection === "profile"
                          ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Users className="h-4 w-4 inline mr-3" />
                      Profilo
                    </button>
                    <button
                      onClick={() => setActiveSection("notifications")}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                        activeSection === "notifications"
                          ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Bell className="h-4 w-4 inline mr-3" />
                      Notifiche
                    </button>
                    <button
                      onClick={() => setActiveSection("templates")}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                        activeSection === "templates"
                          ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 inline mr-3" />
                      Template
                    </button>
                    <button
                      onClick={() => setActiveSection("security")}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors ${
                        activeSection === "security"
                          ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Shield className="h-4 w-4 inline mr-3" />
                      Sicurezza
                    </button>
                    <button
                      onClick={() => setActiveSection("general")}
                      className={`w-full text-left px-4 py-3 text-sm font-medium rounded-b-lg transition-colors ${
                        activeSection === "general"
                          ? "bg-green-50 text-green-700 border-r-2 border-green-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Globe className="h-4 w-4 inline mr-3" />
                      Generali
                    </button>
                  </nav>
                </CardContent>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {activeSection === "profile" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Informazioni Profilo</CardTitle>
                    <CardDescription>
                      Aggiorna le tue informazioni personali
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={profileForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl>
                                  <Input placeholder="Il tuo nome" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cognome</FormLabel>
                                <FormControl>
                                  <Input placeholder="Il tuo cognome" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="tua@email.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={updateProfileMutation.isPending}>
                          {updateProfileMutation.isPending ? "Salvando..." : "Salva Modifiche"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {activeSection === "notifications" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Preferenze Notifiche</CardTitle>
                    <CardDescription>
                      Configura come ricevere le notifiche
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Nuovi messaggi</div>
                        <div className="text-sm text-gray-500">Ricevi notifiche per nuovi messaggi dai clienti</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Notifiche email</div>
                        <div className="text-sm text-gray-500">Ricevi riassunti giornalieri via email</div>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Notifiche push</div>
                        <div className="text-sm text-gray-500">Ricevi notifiche push sul browser</div>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === "templates" && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Crea Nuovo Template</CardTitle>
                      <CardDescription>
                        Crea template per risposte rapide
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...templateForm}>
                        <form onSubmit={templateForm.handleSubmit(onCreateTemplate)} className="space-y-4">
                          <FormField
                            control={templateForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome Template</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nome del template" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={templateForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Contenuto</FormLabel>
                                <FormControl>
                                  <textarea
                                    {...field}
                                    placeholder="Contenuto del messaggio template..."
                                    className="w-full min-h-[100px] p-3 border rounded-md"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button type="submit" disabled={createTemplateMutation.isPending}>
                            {createTemplateMutation.isPending ? "Creando..." : "Crea Template"}
                          </Button>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Template Salvati</CardTitle>
                      <CardDescription>
                        Gestisci i tuoi template esistenti
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {templates.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          Nessun template salvato
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {templates.map((template: Template) => (
                            <div key={template.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium">{template.name}</h4>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => deleteTemplateMutation.mutate(template.id)}
                                  disabled={deleteTemplateMutation.isPending}
                                >
                                  Elimina
                                </Button>
                              </div>
                              <p className="text-sm text-gray-600">{template.content}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {activeSection === "security" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sicurezza</CardTitle>
                    <CardDescription>
                      Gestisci le impostazioni di sicurezza del tuo account
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Autenticazione a due fattori</div>
                        <div className="text-sm text-gray-500">Aggiungi un livello extra di sicurezza</div>
                      </div>
                      <Button variant="outline">Configura</Button>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Sessioni attive</div>
                        <div className="text-sm text-gray-500">Gestisci le sessioni di accesso</div>
                      </div>
                      <Button variant="outline">Visualizza</Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeSection === "general" && (
                <Card>
                  <CardHeader>
                    <CardTitle>Impostazioni Generali</CardTitle>
                    <CardDescription>
                      Configura le preferenze generali dell'applicazione
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Lingua</div>
                        <div className="text-sm text-gray-500">Seleziona la lingua dell'interfaccia</div>
                      </div>
                      <select className="border rounded-md px-3 py-2">
                        <option value="it">Italiano</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Fuso orario</div>
                        <div className="text-sm text-gray-500">Imposta il tuo fuso orario</div>
                      </div>
                      <select className="border rounded-md px-3 py-2">
                        <option value="Europe/Rome">Europa/Roma</option>
                        <option value="Europe/London">Europa/Londra</option>
                      </select>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Tema scuro</div>
                        <div className="text-sm text-gray-500">Attiva il tema scuro</div>
                      </div>
                      <Switch />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}