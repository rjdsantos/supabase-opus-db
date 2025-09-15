import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";

const AdminDashboard = () => {
  return (
    <AuthGuard requiredRole="admin">
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-6xl p-4">
          <h1 className="text-2xl font-bold mb-6">Painel Administrativo</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Dashboard da Administração</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Área administrativa será implementada em breve
              </p>
              <p className="text-sm text-muted-foreground">
                Aqui você poderá gerenciar todos os orçamentos e clientes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
};

export default AdminDashboard;