import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Login = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp, signIn, profile, loading: authLoading, error: authError } = useAuth();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ 
    full_name: '', 
    email: '', 
    phone: '', 
    password: '' 
  });

  // Redirect if already logged in
  useEffect(() => {
    if (profile && !authLoading) {
      navigate(profile.role === 'admin' ? '/admin/orcamentos' : '/orcamentos');
    }
  }, [profile, authLoading, navigate]);

  // Update tab based on URL params
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['signin', 'signup'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Update URL when tab changes
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams({ tab });
    setError(null);
  };

  const formatPhone = (phone: string) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Apply Brazilian phone mask
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
    } else {
      return digits.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trim();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validation
    if (!signUpData.full_name.trim()) {
      setError('Nome completo é obrigatório');
      setLoading(false);
      return;
    }

    if (!signUpData.email.trim()) {
      setError('E-mail é obrigatório');
      setLoading(false);
      return;
    }

    if (!signUpData.password.trim()) {
      setError('Senha é obrigatória');
      setLoading(false);
      return;
    }

    // Clean phone number (digits only)
    const cleanPhone = signUpData.phone.replace(/\D/g, '');
    
    const { error } = await signUp(
      signUpData.email,
      signUpData.password,
      signUpData.full_name,
      cleanPhone || undefined
    );

    if (error) {
      if (typeof error === 'string' && error.includes('already registered')) {
        setError('Este e-mail já está cadastrado. Tente fazer login.');
      } else {
        setError(typeof error === 'string' ? error : error.message);
      }
    } else {
      // Success will be handled by useAuth redirect
    }
    
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!signInData.email.trim() || !signInData.password.trim()) {
      setError('E-mail e senha são obrigatórios');
      setLoading(false);
      return;
    }

    const { error } = await signIn(signInData.email, signInData.password);

    if (error) {
      setError(error);
    }
    // Success will be handled by useAuth redirect
    
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

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
            <CardTitle className="text-center">Acesso Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Entrar</TabsTrigger>
                <TabsTrigger value="signup">Cadastrar</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">E-mail</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      value={signInData.email}
                      onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Senha</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInData.password}
                      onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Sua senha"
                      required
                      disabled={loading}
                    />
                  </div>

                  {(error || authError) && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {error || authError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Nome Completo</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      value={signUpData.full_name}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Seu nome completo"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Telefone (opcional)</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      value={signUpData.phone}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, phone: formatPhone(e.target.value) }))}
                      placeholder="(11) 99999-9999"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Escolha uma senha"
                      required
                      disabled={loading}
                    />
                  </div>

                  {(error || authError) && (
                    <Alert variant="destructive">
                      <AlertDescription>
                        {error || authError}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
                      </>
                    ) : (
                      'Cadastrar'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;