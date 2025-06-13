import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Users, BarChart3, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-3xl mb-6">
            <MessageSquare className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            ServiceHub
          </h1>
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Centro Assistenza Multi-Canale per PMI Italiane
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-3xl mx-auto">
            Unifica tutte le comunicazioni dei clienti da WhatsApp, Email, Instagram DM, 
            Facebook Messenger e chiamate telefoniche in un'unica dashboard professionale.
          </p>
          
          <Button 
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg rounded-xl"
            onClick={() => window.location.href = '/api/login'}
          >
            Accedi alla Piattaforma
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-2xl mb-4">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Inbox Unificata</h3>
              <p className="text-sm text-gray-600">
                Tutti i messaggi da diversi canali in un'unica dashboard
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-2xl mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Gestione Clienti</h3>
              <p className="text-sm text-gray-600">
                Profili clienti automatici con storico conversazioni
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-2xl mb-4">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Risposte Rapide</h3>
              <p className="text-sm text-gray-600">
                Template di risposta e assegnazione messaggi al team
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-orange-100 rounded-2xl mb-4">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
              <p className="text-sm text-gray-600">
                Metriche di performance e soddisfazione clienti
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Channels Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Supporta Tutti i Tuoi Canali
          </h2>
          <div className="flex flex-wrap justify-center items-center gap-8">
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-md">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">W</span>
              </div>
              <span className="font-medium text-gray-800">WhatsApp</span>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-md">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">@</span>
              </div>
              <span className="font-medium text-gray-800">Email</span>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-md">
              <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">IG</span>
              </div>
              <span className="font-medium text-gray-800">Instagram</span>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-md">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">f</span>
              </div>
              <span className="font-medium text-gray-800">Facebook</span>
            </div>
            
            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-md">
              <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">📞</span>
              </div>
              <span className="font-medium text-gray-800">Telefono</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-green-600 to-green-700">
          <CardContent className="p-12 text-center text-white">
            <h2 className="text-3xl font-bold mb-4">
              Pronto a Migliorare il Tuo Servizio Clienti?
            </h2>
            <p className="text-xl mb-8 text-green-100">
              Inizia subito con ServiceHub e centralizza tutte le tue comunicazioni
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-green-700 hover:bg-gray-100 px-8 py-4 text-lg rounded-xl"
              onClick={() => window.location.href = '/api/login'}
            >
              Accedi Ora
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
