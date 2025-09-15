import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";

const ClientDashboard = () => {
  return (
    <AuthGuard requiredRole="client">
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-4xl p-4">
          <h1 className="text-2xl font-bold mb-6">Meus Orçamentos</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Dashboard do Cliente</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Área do cliente será implementada em breve
              </p>
              <p className="text-sm text-muted-foreground">
                Aqui você poderá visualizar e gerenciar seus orçamentos.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
};

export default ClientDashboard;