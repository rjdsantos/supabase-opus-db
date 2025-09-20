import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Bot, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";
import { useOrcamentoBudget } from "@/hooks/useOrcamentoBudget";
import { AISuggestions } from "@/components/AISuggestions";
import { LinkedBudgets } from "@/components/LinkedBudgets";
import WhatsAppButton from "@/components/WhatsAppButton";

interface FormData {
  data_entrega: Date | undefined;
  tipo_presente: string;
  tipo_presente_outra_opcao_texto: string;
  orientacoes_adicionais: string;
}

const OrcamentoPresentes = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const id_orcamento = searchParams.get('id_orcamento');

  const [formData, setFormData] = useState<FormData>({
    data_entrega: undefined,
    tipo_presente: "",
    tipo_presente_outra_opcao_texto: "",
    orientacoes_adicionais: ""
  });

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);

  const {
    budget,
    details,
    loading,
    saving,
    error,
    saveDraft,
    finalizeBudget,
    reload
  } = useOrcamentoBudget('presentes', id_orcamento);

  // Carregar dados do orçamento ao montar o componente
  useEffect(() => {
    if (details && Object.keys(details).length > 0) {
      setFormData({
        data_entrega: details.data_entrega ? new Date(details.data_entrega) : undefined,
        tipo_presente: details.tipo_presente || "",
        tipo_presente_outra_opcao_texto: details.tipo_presente_outra_opcao_texto || "",
        orientacoes_adicionais: details.orientacoes_adicionais || ""
      });
    } else {
      // Initialize with default values to avoid uncontrolled to controlled warning
      setFormData({
        data_entrega: undefined,
        tipo_presente: "",
        tipo_presente_outra_opcao_texto: "",
        orientacoes_adicionais: ""
      });
    }
  }, [details]);

  const tiposPresenteOptions = [
    { value: "caixa_personalizada", label: "Caixa Personalizada" },
    { value: "cesta", label: "Cesta" },
    { value: "box", label: "Box" },
    { value: "tabua_de_frios", label: "Tábua de Frios" },
    { value: "kit_criativo_infantil", label: "Kit Criativo Infantil" },
    { value: "outra_opcao", label: "Outra Opção" }
  ];

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar campo "outra opção" se não for selecionado
    if (field === 'tipo_presente' && value !== 'outra_opcao') {
      setFormData(prev => ({
        ...prev,
        tipo_presente_outra_opcao_texto: ""
      }));
    }
  };

  const isFormValid = () => {
    const requiredFields = [
      formData.data_entrega,
      formData.tipo_presente,
      formData.orientacoes_adicionais
    ];

    if (formData.tipo_presente === 'outra_opcao' && !formData.tipo_presente_outra_opcao_texto.trim()) {
      return false;
    }

    return requiredFields.every(field => field !== undefined && field !== "");
  };

  const handleSaveDraft = async () => {
    if (!budget?.id_orcamento) return;

    const detailsToSave: Record<string, string> = {};
    
    if (formData.data_entrega) {
      detailsToSave.data_entrega = format(formData.data_entrega, 'yyyy-MM-dd');
    }
    if (formData.tipo_presente) {
      detailsToSave.tipo_presente = formData.tipo_presente;
    }
    if (formData.tipo_presente_outra_opcao_texto) {
      detailsToSave.tipo_presente_outra_opcao_texto = formData.tipo_presente_outra_opcao_texto;
    }
    if (formData.orientacoes_adicionais) {
      detailsToSave.orientacoes_adicionais = formData.orientacoes_adicionais;
    }

    await saveDraft(detailsToSave);
  };

  const handleFinalizeBudget = async () => {
    if (!isFormValid() || !budget?.id_orcamento) return;

    const detailsToSave: Record<string, string> = {
      data_entrega: format(formData.data_entrega!, 'yyyy-MM-dd'),
      tipo_presente: formData.tipo_presente,
      orientacoes_adicionais: formData.orientacoes_adicionais
    };

    if (formData.tipo_presente === 'outra_opcao') {
      detailsToSave.tipo_presente_outra_opcao_texto = formData.tipo_presente_outra_opcao_texto;
    }

    try {
      const budgetId = await finalizeBudget(detailsToSave);
      if (budgetId) {
        navigate(`/orcamento/confirmacao?id_orcamento=${budgetId}`);
      }
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleAISuggestionSelect = (suggestion: string) => {
    setFormData(prev => ({
      ...prev,
      orientacoes_adicionais: suggestion
    }));
    setShowAISuggestions(false);
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="client">
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto max-w-4xl p-4 py-8">
            <div className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="rounded-2xl">
                  <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="client">
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto max-w-4xl p-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Orçamento - Presentes Especiais</h1>
            <p className="text-muted-foreground">
              Conte-nos sobre o presente especial que você gostaria de criar
            </p>
          </div>

          {error && (
            <Alert className="mb-6" variant="destructive">
              <AlertDescription>
                {error}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-4"
                  onClick={reload}
                >
                  Tentar novamente
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {budget && (
            <LinkedBudgets 
              currentBudgetId={budget.id_orcamento} 
              currentCategory="presentes" 
            />
          )}

          <div className="space-y-6">
            {/* Data de Entrega */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Data Desejada de Entrega
                </CardTitle>
                <CardDescription>
                  Quando você precisa do presente? *
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {formData.data_entrega ? (
                        format(formData.data_entrega, "dd/MM/yyyy", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={formData.data_entrega}
                      onSelect={(date) => {
                        handleInputChange('data_entrega', date);
                        setIsCalendarOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </CardContent>
            </Card>

            {/* Tipo de Presente */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Tipo de Presente</CardTitle>
                <CardDescription>
                  Que tipo de presente você tem em mente? *
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select 
                  value={formData.tipo_presente} 
                  onValueChange={(value) => handleInputChange('tipo_presente', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo de presente" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposPresenteOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {formData.tipo_presente === 'outra_opcao' && (
                  <div className="space-y-2">
                    <Label htmlFor="outra_opcao_texto">Descreva sua ideia *</Label>
                    <Input
                      id="outra_opcao_texto"
                      value={formData.tipo_presente_outra_opcao_texto}
                      onChange={(e) => handleInputChange('tipo_presente_outra_opcao_texto', e.target.value)}
                      placeholder="Conte-nos sobre sua ideia de presente"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Orientações Adicionais */}
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Orientações Adicionais
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAISuggestions(true)}
                    className="flex items-center gap-2"
                  >
                    <Bot className="w-4 h-4" />
                    Peça ajuda à IA
                  </Button>
                </CardTitle>
                <CardDescription>
                  Descreva detalhes específicos, preferências, cores, temas ou qualquer informação importante *
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={formData.orientacoes_adicionais}
                  onChange={(e) => handleInputChange('orientacoes_adicionais', e.target.value)}
                  placeholder="Ex: Presente para aniversário de 30 anos, tema vintage, cores pastéis, pessoa que adora café e livros..."
                  rows={4}
                />

                {showAISuggestions && budget?.id_orcamento && (
                  <AISuggestions
                    budgetId={budget.id_orcamento}
                    campo="orientacoes_adicionais"
                    context={{
                      tipo_presente: formData.tipo_presente,
                      data_entrega: formData.data_entrega ? format(formData.data_entrega, 'yyyy-MM-dd') : undefined
                    }}
                    onSuggestionAccepted={handleAISuggestionSelect}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Footer com ações */}
          <div className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t mt-8 pt-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-between">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={!budget?.id_orcamento || saving}
                className="flex-1 sm:flex-none"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Salvar Rascunho
              </Button>
              
              <Button
                onClick={handleFinalizeBudget}
                disabled={!isFormValid() || !budget?.id_orcamento || saving}
                className="flex-1 sm:flex-none"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Finalizar Orçamento
              </Button>
            </div>
            
            {!isFormValid() && (
              <p className="text-sm text-muted-foreground mt-2 text-center">
                Preencha todos os campos obrigatórios (*) para finalizar o orçamento
              </p>
            )}
          </div>
        </div>

        <WhatsAppButton />
      </div>
    </AuthGuard>
  );
};

export default OrcamentoPresentes;