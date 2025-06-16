import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Building, Users, Plus, Edit, Trash2, Settings, UserCheck, UserX } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User, Company } from "@/types";

const companySchema = z.object({
  name: z.string().min(1, "Nome azienda è richiesto"),
  subscriptionPlan: z.string().default("basic"),
  maxUsers: z.number().min(1).default(5),
  maxChannels: z.number().min(1).default(3),
  isActive: z.boolean().default(true),
});

const userSchema = z.object({
  id: z.string().min(1, "ID utente è richiesto"),
  email: z.string().email("Email non valida"),
  firstName: z.string().min(1, "Nome è richiesto"),
  lastName: z.string().min(1, "Cognome è richiesto"),
  role: z.enum(["super_admin", "company_admin", "agent"]),
  companyId: z.number().optional(),
});

export default function AdminPage() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("companies");
  const [selectedCompany, setSelectedCompany] = useState<number | null>(null);
  const [showCreateCompany, setShowCreateCompany] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [editingUser, setEditingUser] = useState<any>(null);

  // Check if user has admin access
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Caricamento...</div>;
  }

  if (!user || !user.role || !["super_admin", "company_admin"].includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Accesso Negato</h1>
        <p className="text-gray-600">Non hai i permessi per accedere al pannello amministrativo.</p>
      </div>
    );
  }

  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/admin/companies"],
    enabled: user?.role === "super_admin",
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users", selectedCompany],
  });

  const companyForm = useForm({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: "",
      subscriptionPlan: "basic",
      maxUsers: 5,
      maxChannels: 3,
      isActive: true,
    },
  });

  const userForm = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "agent" as const,
      companyId: user.role === "company_admin" ? user.companyId : undefined,
    },
  });

  const createCompanyMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/companies", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      setShowCreateCompany(false);
      companyForm.reset();
      toast({ title: "Azienda creata con successo" });
    },
    onError: () => {
      toast({ title: "Errore nella creazione dell'azienda", variant: "destructive" });
    },
  });

  const updateCompanyMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => 
      apiRequest(`/api/admin/companies/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      setEditingCompany(null);
      toast({ title: "Azienda aggiornata con successo" });
    },
    onError: () => {
      toast({ title: "Errore nell'aggiornamento dell'azienda", variant: "destructive" });
    },
  });

  const createUserMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/admin/users", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setShowCreateUser(false);
      userForm.reset();
      toast({ title: "Utente creato con successo" });
    },
    onError: () => {
      toast({ title: "Errore nella creazione dell'utente", variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      apiRequest(`/api/admin/users/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditingUser(null);
      toast({ title: "Utente aggiornato con successo" });
    },
    onError: () => {
      toast({ title: "Errore nell'aggiornamento dell'utente", variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/admin/users/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Utente eliminato con successo" });
    },
    onError: () => {
      toast({ title: "Errore nell'eliminazione dell'utente", variant: "destructive" });
    },
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/companies/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/companies"] });
      toast({ title: "Azienda eliminata con successo" });
    },
    onError: () => {
      toast({ title: "Errore nell'eliminazione dell'azienda", variant: "destructive" });
    },
  });

  const onCreateCompany = (data: any) => {
    createCompanyMutation.mutate(data);
  };

  const onUpdateCompany = (data: any) => {
    if (editingCompany) {
      updateCompanyMutation.mutate({ id: editingCompany.id, data });
    }
  };

  const onCreateUser = (data: any) => {
    createUserMutation.mutate(data);
  };

  const onUpdateUser = (data: any) => {
    if (editingUser) {
      updateUserMutation.mutate({ id: editingUser.id, data });
    }
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      super_admin: "bg-red-100 text-red-800",
      company_admin: "bg-blue-100 text-blue-800",
      agent: "bg-green-100 text-green-800",
    };
    const labels = {
      super_admin: "Super Admin",
      company_admin: "Admin Azienda",
      agent: "Agente",
    };
    return (
      <Badge className={styles[role as keyof typeof styles]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pannello Amministrativo</h1>
            <p className="text-gray-600 mt-1">
              {user.role === "super_admin" ? "Gestisci tutte le aziende e utenti" : "Gestisci gli utenti della tua azienda"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-500">{getRoleBadge(user.role)}</span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            {user.role === "super_admin" && (
              <TabsTrigger value="companies">
                <Building className="h-4 w-4 mr-2" />
                Aziende
              </TabsTrigger>
            )}
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Utenti
            </TabsTrigger>
          </TabsList>

          {user.role === "super_admin" && (
            <TabsContent value="companies" className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Gestione Aziende</h2>
                <Dialog open={showCreateCompany} onOpenChange={setShowCreateCompany}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuova Azienda
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crea Nuova Azienda</DialogTitle>
                      <DialogDescription>
                        Aggiungi una nuova azienda al sistema con le configurazioni iniziali.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...companyForm}>
                      <form onSubmit={companyForm.handleSubmit(onCreateCompany)} className="space-y-4">
                        <FormField
                          control={companyForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome Azienda</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Es. Rossi & Associati" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={companyForm.control}
                          name="subscriptionPlan"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Piano Abbonamento</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona piano" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="basic">Basic</SelectItem>
                                  <SelectItem value="professional">Professional</SelectItem>
                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={companyForm.control}
                            name="maxUsers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Utenti</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={companyForm.control}
                            name="maxChannels"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Canali</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={createCompanyMutation.isPending}
                          >
                            {createCompanyMutation.isPending ? "Creazione..." : "Crea Azienda"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companies.map((company: any) => (
                  <Card key={company.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{company.name}</CardTitle>
                          <CardDescription>
                            Piano: {company.subscriptionPlan}
                          </CardDescription>
                        </div>
                        <Badge 
                          variant={company.isActive ? "default" : "secondary"}
                          className={cn(
                            company.isActive 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          )}
                        >
                          {company.isActive ? "Attiva" : "Inattiva"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Utenti:</span>
                          <span>{company.maxUsers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Max Canali:</span>
                          <span>{company.maxChannels}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Creata:</span>
                          <span>{new Date(company.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedCompany(company.id)}
                        >
                          <Users className="h-4 w-4 mr-1" />
                          Utenti
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setEditingCompany(company);
                            companyForm.reset(company);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            if (confirm(`Sei sicuro di voler eliminare l'azienda "${company.name}"?`)) {
                              deleteCompanyMutation.mutate(company.id);
                            }
                          }}
                          disabled={deleteCompanyMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Gestione Utenti</h2>
              <div className="flex gap-3">
                {user.role === "super_admin" && (
                  <Select onValueChange={(value) => setSelectedCompany(value ? parseInt(value) : null)}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filtra per azienda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tutte le aziende</SelectItem>
                      {companies.map((company: any) => (
                        <SelectItem key={company.id} value={company.id.toString()}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo Utente
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Crea Nuovo Utente</DialogTitle>
                      <DialogDescription>
                        Aggiungi un nuovo utente al sistema. L'utente riceverà un invito via email.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...userForm}>
                      <form onSubmit={userForm.handleSubmit(onCreateUser)} className="space-y-4">
                        <FormField
                          control={userForm.control}
                          name="id"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>ID Utente (da Replit Auth)</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Es. 123456789" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={userForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input {...field} type="email" placeholder="utente@example.com" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={userForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Nome</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Mario" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={userForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cognome</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Rossi" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <FormField
                          control={userForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ruolo</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleziona ruolo" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {user.role === "super_admin" && (
                                    <>
                                      <SelectItem value="super_admin">Super Admin</SelectItem>
                                      <SelectItem value="company_admin">Admin Azienda</SelectItem>
                                    </>
                                  )}
                                  <SelectItem value="agent">Agente</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {user.role === "super_admin" && (
                          <FormField
                            control={userForm.control}
                            name="companyId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Azienda</FormLabel>
                                <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleziona azienda" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {companies.map((company: any) => (
                                      <SelectItem key={company.id} value={company.id.toString()}>
                                        {company.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={createUserMutation.isPending}
                          >
                            {createUserMutation.isPending ? "Creazione..." : "Crea Utente"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="bg-white rounded-lg border">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-4 font-medium text-gray-900">Utente</th>
                      <th className="text-left p-4 font-medium text-gray-900">Email</th>
                      <th className="text-left p-4 font-medium text-gray-900">Ruolo</th>
                      {user.role === "super_admin" && (
                        <th className="text-left p-4 font-medium text-gray-900">Azienda</th>
                      )}
                      <th className="text-left p-4 font-medium text-gray-900">Registrato</th>
                      <th className="text-right p-4 font-medium text-gray-900">Azioni</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {Array.isArray(users) && users.map((userData: any) => (
                      <tr key={userData.id} className="hover:bg-gray-50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                              {userData.firstName?.[0]}{userData.lastName?.[0]}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {userData.firstName} {userData.lastName}
                              </div>
                              <div className="text-sm text-gray-500">ID: {userData.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-gray-900">{userData.email}</td>
                        <td className="p-4">{getRoleBadge(userData.role)}</td>
                        {user.role === "super_admin" && (
                          <td className="p-4 text-gray-900">
                            {companies.find((c: any) => c.id === userData.companyId)?.name || "Non assegnato"}
                          </td>
                        )}
                        <td className="p-4 text-gray-600">
                          {new Date(userData.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setEditingUser(userData);
                                userForm.reset({
                                  ...userData,
                                  companyId: userData.companyId || undefined,
                                });
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                if (confirm("Sei sicuro di voler eliminare questo utente?")) {
                                  deleteUserMutation.mutate(userData.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {Array.isArray(users) && users.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>Nessun utente trovato</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Edit Company Dialog */}
        <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Azienda</DialogTitle>
              <DialogDescription>
                Aggiorna le informazioni e configurazioni dell'azienda.
              </DialogDescription>
            </DialogHeader>
            <Form {...companyForm}>
              <form onSubmit={companyForm.handleSubmit(onUpdateCompany)} className="space-y-4">
                {/* Same form fields as create company */}
                <FormField
                  control={companyForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Azienda</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={updateCompanyMutation.isPending}
                  >
                    {updateCompanyMutation.isPending ? "Aggiornamento..." : "Aggiorna Azienda"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifica Utente</DialogTitle>
              <DialogDescription>
                Aggiorna le informazioni e i permessi dell'utente.
              </DialogDescription>
            </DialogHeader>
            <Form {...userForm}>
              <form onSubmit={userForm.handleSubmit(onUpdateUser)} className="space-y-4">
                {/* Same form fields as create user */}
                <FormField
                  control={userForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={updateUserMutation.isPending}
                  >
                    {updateUserMutation.isPending ? "Aggiornamento..." : "Aggiorna Utente"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}