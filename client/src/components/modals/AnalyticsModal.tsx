import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  MessageSquare, 
  Clock, 
  Heart, 
  TrendingUp,
  Users,
  X,
} from "lucide-react";

interface AnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AnalyticsModal({ isOpen, onClose }: AnalyticsModalProps) {
  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/analytics'],
    enabled: isOpen,
  });

  const getInitials = (name: string) => {
    return name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";
  };

  const getChannelColor = (channel: string) => {
    const colors = {
      whatsapp: "bg-green-500",
      email: "bg-blue-500",
      instagram: "bg-pink-500",
      facebook: "bg-blue-600",
      phone: "bg-gray-500",
    };
    return colors[channel as keyof typeof colors] || "bg-gray-400";
  };

  const getChannelPercentage = (count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };

  if (!analytics && !isLoading) {
    return null;
  }

  const totalChannelMessages = analytics?.channelStats?.reduce((acc: number, stat: any) => acc + stat.count, 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader className="pb-6">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Dashboard Analytics
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Caricamento analytics...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Conversazioni Oggi</h3>
                    <MessageSquare className="h-8 w-8 opacity-80" />
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    {analytics?.todayConversations || 0}
                  </div>
                  <div className="text-sm opacity-80">
                    {analytics?.todayConversations > 0 ? "+12% rispetto a ieri" : "Nessuna conversazione oggi"}
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Tempo Risposta</h3>
                    <Clock className="h-8 w-8 opacity-80" />
                  </div>
                  <div className="text-4xl font-bold mb-2">
                    {analytics?.teamPerformance?.length > 0 
                      ? `${Math.round(analytics.teamPerformance.reduce((acc: number, member: any) => acc + member.avgResponseTime, 0) / analytics.teamPerformance.length)}s`
                      : '0s'
                    }
                  </div>
                  <div className="text-sm opacity-80">Tempo medio di risposta</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Soddisfazione</h3>
                    <Heart className="h-8 w-8 opacity-80" />
                  </div>
                  <div className="text-4xl font-bold mb-2">94.2%</div>
                  <div className="text-sm opacity-80">+2.1% questo mese</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Channel Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Distribuzione per Canale
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.channelStats?.map((stat: any) => (
                      <div key={stat.channel} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full ${getChannelColor(stat.channel)}`}></div>
                          <span className="text-gray-700 capitalize">
                            {stat.channel === 'whatsapp' && 'WhatsApp'}
                            {stat.channel === 'email' && 'Email'}
                            {stat.channel === 'instagram' && 'Instagram'}
                            {stat.channel === 'facebook' && 'Facebook'}
                            {stat.channel === 'phone' && 'Telefono'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress 
                            value={getChannelPercentage(stat.count, totalChannelMessages)} 
                            className="w-24 h-2"
                          />
                          <span className="text-sm font-medium text-gray-900 w-12 text-right">
                            {getChannelPercentage(stat.count, totalChannelMessages)}%
                          </span>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-4">Nessun dato disponibile</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Team Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Performance Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.teamPerformance?.length > 0 ? (
                      analytics.teamPerformance.map((member: any, index: number) => (
                        <div 
                          key={member.userId} 
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            index === 0 ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600">
                              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-purple-600 text-white font-semibold text-xs">
                                {getInitials(member.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">{member.name}</div>
                              <div className="text-sm text-gray-500">
                                {member.conversationCount} conversazioni
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-semibold ${index === 0 ? 'text-green-600' : 'text-gray-700'}`}>
                              {member.avgResponseTime}s
                            </div>
                            <div className="text-sm text-gray-500">tempo medio</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center py-4">Nessun dato team disponibile</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status Overview */}
            {analytics?.conversationStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Panoramica Stati Conversazioni</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600 mb-1">
                        {analytics.conversationStats.new || 0}
                      </div>
                      <div className="text-sm text-red-800">Nuove</div>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600 mb-1">
                        {analytics.conversationStats['in-progress'] || 0}
                      </div>
                      <div className="text-sm text-yellow-800">In corso</div>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {analytics.conversationStats.resolved || 0}
                      </div>
                      <div className="text-sm text-green-800">Risolte</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
