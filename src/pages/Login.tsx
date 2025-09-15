import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tab = searchParams.get('tab') || 'signin';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao início
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {tab === 'signup' ? 'Criar Conta' : 'Entrar'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              {tab === 'signup' 
                ? 'Página de cadastro será implementada em breve'
                : 'Página de login será implementada em breve'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              Aguarde a implementação da estrutura completa do banco de dados.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;