import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageSquare, Bell, ChevronDown, BarChart3, Settings, Users, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface TopNavigationProps {
  onShowAnalytics: () => void;
}

export default function TopNavigation({ onShowAnalytics }: TopNavigationProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Fetch analytics for summary display
  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics'],
    refetchInterval: 60000, // Refresh every minute
  });

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase() || 'U';
  };

  const handleLogout = () => {
    window.location.href = '/api/logout';
  };

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900 text-lg">ServiceHub</span>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Button
              variant={activeTab === "dashboard" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "dashboard" ? "bg-green-600 text-white hover:bg-green-700" : ""}
              onClick={() => setActiveTab("dashboard")}
            >
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            
            <Button
              variant={activeTab === "analytics" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "analytics" ? "bg-green-600 text-white hover:bg-green-700" : ""}
              onClick={() => {
                setActiveTab("analytics");
                onShowAnalytics();
              }}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Button>
            
            <Button
              variant={activeTab === "customers" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "customers" ? "bg-green-600 text-white hover:bg-green-700" : ""}
              onClick={() => setActiveTab("customers")}
            >
              <Users className="w-4 h-4 mr-2" />
              Clienti
            </Button>
            
            <Button
              variant={activeTab === "settings" ? "default" : "ghost"}
              size="sm"
              className={activeTab === "settings" ? "bg-green-600 text-white hover:bg-green-700" : ""}
              onClick={() => setActiveTab("settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              Impostazioni
            </Button>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Analytics Summary */}
          {analytics && (
            <div className="hidden lg:flex items-center gap-6 text-sm">
              <div className="text-center">
                <div className="font-semibold text-gray-900">
                  {analytics.todayConversations || 0}
                </div>
                <div className="text-gray-500 text-xs">Conversazioni</div>
              </div>
              
              <div className="text-center">
                <div className="font-semibold text-green-600">
                  {analytics.teamPerformance?.length > 0 
                    ? `${Math.round(analytics.teamPerformance.reduce((acc: number, member: any) => acc + member.avgResponseTime, 0) / analytics.teamPerformance.length)}s`
                    : '0s'
                  }
                </div>
                <div className="text-gray-500 text-xs">Tempo medio</div>
              </div>
              
              <div className="text-center">
                <div className="font-semibold text-blue-600">94%</div>
                <div className="text-gray-500 text-xs">Soddisfazione</div>
              </div>
            </div>
          )}
          
          {/* Notifications */}
          <Button size="sm" variant="ghost" className="p-2 relative">
            <Bell className="h-5 w-5 text-gray-600" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
              3
            </Badge>
          </Button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3">
                <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold text-sm">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium text-gray-900">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-xs text-gray-500">{user?.role || 'Agente'}</div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b">
                <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Impostazioni Account
              </DropdownMenuItem>
              
              <DropdownMenuItem>
                <Users className="w-4 h-4 mr-2" />
                Gestione Team
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={onShowAnalytics}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics Avanzate
              </DropdownMenuItem>
              
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                Esci
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
