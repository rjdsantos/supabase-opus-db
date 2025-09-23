import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { AuthGuard } from "@/components/AuthGuard";
import Header from "@/components/Header";
import WhatsAppButton from "@/components/WhatsAppButton";
import { AISuggestions } from "@/components/AISuggestions";
import { LinkedBudgets } from "@/components/LinkedBudgets";
import { useOrcamentoBudget } from "@/hooks/useOrcamentoBudget";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

const tipoEventoOptions = [
  { value: "aniversario", label: "Aniversário" },
  { value: "cha_de_bebe", label: "Chá de Bebê" },
  { value: "mini_wedding", label: "Mini Wedding" },
  { value: "batizado", label: "Batizado" },
  { value: "festa_tematica", label: "Festa Temática" },
  { value: "evento_corporativo", label: "Evento Corporativo" },
  { value: "arvore_de_natal", label: "Árvore de Natal" },
];

const estiloOptions = [
  { key: "estilo_escalda_pe", label: "Escalda-pé" },
  { key: "estilo_vela_personalizada", label: "Vela personalizada" },
  { key: "estilo_pote_geleia_mel", label: "Pote de geleia/mel" },
  { key: "estilo_agua_benta", label: "Água benta" },
  { key: "estilo_oleo_perfumado", label: "Óleo perfumado" },
  { key: "estilo_chaveiro", label: "Chaveiro" },
  { key: "estilo_mandala", label: "Mandala" },
  { key: "estilo_doces_decorados", label: "Doces decorados" },
  { key: "estilo_sabonetes", label: "Sabonetes" },
  { key: "estilo_outra_opcao", label: "Outra opção" },
];

const OrcamentoLembrancinhas = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const budgetId = searchParams.get("id_orcamento");

  const {
    budget,
    details,
    loading,
    saving,
    error,
    
    finalizeBudget,
    saveDetail,
    deleteDetails,
  } = useOrcamentoBudget("lembrancinhas", budgetId || undefined);

  // Form state
  const [formData, setFormData] = useState({
    data_entrega: "",
    tipo_evento: "",
    quantidade: "",
    tema_cor_desejada: "",
    incluir_presentes_especiais: "",
    estilo_outra_opcao_texto: "",
  });

  const [selectedStyles, setSelectedStyles] = useState<Record<string, boolean>>({});
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  // Load form data from details
  useEffect(() => {
    if (details && Object.keys(details).length > 0) {
      setFormData({
        data_entrega: details.data_entrega || "",
        tipo_evento: details.tipo_evento || "",
        quantidade: details.quantidade || "",
        tema_cor_desejada: details.tema_cor_desejada || "",
        incluir_presentes_especiais: details.incluir_presentes_especiais || "",
        estilo_outra_opcao_texto: details.estilo_outra_opcao_texto || "",
      });

      // Load selected styles
      const styles: Record<string, boolean> = {};
      estiloOptions.forEach((style) => {
        styles[style.key] = details[style.key] === "true";
      });
      setSelectedStyles(styles);

      // Load selected date
      if (details.data_entrega) {
        setSelectedDate(new Date(details.data_entrega));
      }
    } else {
      // Initialize with empty values to avoid uncontrolled to controlled warning
      setFormData({
        data_entrega: "",
        tipo_evento: "",
        quantidade: "",
        tema_cor_desejada: "",
        incluir_presentes_especiais: "",
        estilo_outra_opcao_texto: "",
      });
      setSelectedStyles({});
      setSelectedDate(undefined);
    }
  }, [details]);

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleStyleChange = async (styleKey: string, checked: boolean) => {
    const newSelectedStyles = { ...selectedStyles, [styleKey]: checked };
    setSelectedStyles(newSelectedStyles);

    try {
      await saveDetail(styleKey, checked.toString());
      
      // If unchecking "outra opção", clear the text field
      if (styleKey === "estilo_outra_opcao" && !checked) {
        setFormData((prev) => ({ ...prev, estilo_outra_opcao_texto: "" }));
        await deleteDetails(["estilo_outra_opcao_texto"]);
      }
    } catch (error) {
      console.error("Error saving style:", error);
    }
  };

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date);
    setCalendarOpen(false);
    
    if (date) {
      const dateString = format(date, "yyyy-MM-dd");
      setFormData((prev) => ({ ...prev, data_entrega: dateString }));
      try {
        await saveDetail("data_entrega", dateString);
      } catch (error) {
        console.error("Error saving date:", error);
      }
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.data_entrega) errors.push("Data de entrega é obrigatória");
    if (!formData.tipo_evento) errors.push("Tipo de evento é obrigatório");
    if (!formData.quantidade || parseInt(formData.quantidade) <= 0) {
      errors.push("Quantidade deve ser maior que zero");
    }
    if (!Object.values(selectedStyles).some(Boolean)) {
      errors.push("Selecione pelo menos um estilo");
    }
    if (selectedStyles.estilo_outra_opcao && !formData.estilo_outra_opcao_texto) {
      errors.push("Descreva a outra opção de estilo");
    }
    if (!formData.tema_cor_desejada) errors.push("Tema/Cor desejada é obrigatório");
    if (!formData.incluir_presentes_especiais) {
      errors.push("Informe se deseja incluir presentes especiais");
    }

    return errors;
  };

  const handleSaveDraft = async () => {
    try {
      const currentFormData = { ...formData };
      // Add selected styles to form data
      Object.entries(selectedStyles).forEach(([key, value]) => {
        currentFormData[key] = value.toString();
      });

      await finalizeBudget(currentFormData);
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  };

  const handleAdvance = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    if (formData.incluir_presentes_especiais === "true") {
      // Save current data first
      await handleSaveDraft();
      navigate(`/orcamento/presentes?id_orcamento=${budget?.id_orcamento}`);
    }
  };

  const handleFinalize = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: errors.join(", "),
        variant: "destructive",
      });
      return;
    }

    if (formData.incluir_presentes_especiais === "true") {
      toast({
        title: "Opção inválida",
        description: "Use 'Avançar' para incluir presentes especiais",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentFormData = { ...formData };
      // Add selected styles to form data
      Object.entries(selectedStyles).forEach(([key, value]) => {
        currentFormData[key] = value.toString();
      });

      const budgetId = await finalizeBudget(currentFormData);
      if (budgetId) {
        navigate(`/orcamento/confirmacao?id_orcamento=${budgetId}`);
      }
    } catch (error) {
      console.error("Error finalizing budget:", error);
    }
  };

  const handleAISuggestionAccepted = (suggestion: string) => {
    setFormData((prev) => ({ ...prev, tema_cor_desejada: suggestion }));
  };

  const handleDiscard = () => {
    // Clear form data
    setFormData({
      data_entrega: "",
      tipo_evento: "",
      quantidade: "",
      tema_cor_desejada: "",
      incluir_presentes_especiais: "",
      estilo_outra_opcao_texto: "",
    });
    setSelectedStyles({});
    setSelectedDate(undefined);
    
    // Navigate back to client dashboard
    navigate('/cliente/dashboard');
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="client">
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requiredRole="client">
        <div className="min-h-screen bg-background">
          <Header />
          <main className="container mx-auto px-4 py-8 max-w-4xl">
            <Alert variant="destructive">
              <AlertDescription>
                Erro ao carregar orçamento: {error}
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="client">
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Orçamento de Lembrancinhas
              </h1>
              <p className="text-muted-foreground mt-2">
                Preencha os detalhes para seu orçamento de lembrancinhas
              </p>
            </div>

            {budget && (
              <LinkedBudgets 
                currentBudgetId={budget.id_orcamento} 
                currentCategory="lembrancinhas" 
              />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Informações do Evento</CardTitle>
                <CardDescription>
                  Detalhes básicos sobre seu evento
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Data de Entrega */}
                <div className="space-y-2">
                  <Label htmlFor="data_entrega">Data desejada de entrega *</Label>
                  <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? (
                          format(selectedDate, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={handleDateSelect}
                        disabled={(date) => date <= new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Tipo de Evento */}
                <div className="space-y-2">
                  <Label htmlFor="tipo_evento">Tipo de evento *</Label>
                  <Select
                    value={formData.tipo_evento}
                    onValueChange={(value) => {
                      handleInputChange("tipo_evento", value);
                      saveDetail("tipo_evento", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoEventoOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantidade */}
                <div className="space-y-2">
                  <Label htmlFor="quantidade">Quantidade *</Label>
                  <Input
                    id="quantidade"
                    type="number"
                    min="1"
                    placeholder="Ex: 50"
                    value={formData.quantidade}
                    onChange={(e) => {
                      handleInputChange("quantidade", e.target.value);
                      saveDetail("quantidade", e.target.value);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Estilo das Lembrancinhas</CardTitle>
                <CardDescription>
                  Selecione um ou mais estilos desejados *
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {estiloOptions.map((style) => (
                    <div key={style.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={style.key}
                        checked={selectedStyles[style.key] || false}
                        onCheckedChange={(checked) =>
                          handleStyleChange(style.key, checked as boolean)
                        }
                      />
                      <Label htmlFor={style.key}>{style.label}</Label>
                    </div>
                  ))}
                </div>

                {/* Campo condicional para "Outra opção" */}
                {selectedStyles.estilo_outra_opcao && (
                  <div className="space-y-2 mt-4">
                    <Label htmlFor="estilo_outra_opcao_texto">
                      Descreva a outra opção *
                    </Label>
                    <Textarea
                      id="estilo_outra_opcao_texto"
                      placeholder="Descreva o estilo desejado..."
                      value={formData.estilo_outra_opcao_texto}
                      onChange={(e) => {
                        handleInputChange("estilo_outra_opcao_texto", e.target.value);
                        saveDetail("estilo_outra_opcao_texto", e.target.value);
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tema e Personalização</CardTitle>
                <CardDescription>
                  Detalhes sobre o tema e cores desejadas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Tema/Cor com IA */}
                <div className="space-y-2">
                  <Label htmlFor="tema_cor_desejada">Tema/Cor desejada *</Label>
                  <div className="space-y-2">
                    <Textarea
                      id="tema_cor_desejada"
                      placeholder="Descreva o tema ou cores que gostaria..."
                      value={formData.tema_cor_desejada}
                      onChange={(e) => {
                        handleInputChange("tema_cor_desejada", e.target.value);
                        saveDetail("tema_cor_desejada", e.target.value);
                      }}
                    />
                    {budget && (
                      <AISuggestions
                        budgetId={budget.id_orcamento}
                        campo="tema_cor_desejada"
                        context={{
                          categoria: "lembrancinhas",
                          tipo_evento: formData.tipo_evento,
                          quantidade: formData.quantidade,
                          estilos_selecionados: Object.entries(selectedStyles)
                            .filter(([_, selected]) => selected)
                            .map(([key, _]) => key)
                            .join(", "),
                        }}
                        onSuggestionAccepted={handleAISuggestionAccepted}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Presentes Especiais</CardTitle>
                <CardDescription>
                  Deseja incluir presentes especiais no orçamento?
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={formData.incluir_presentes_especiais}
                  onValueChange={(value) => {
                    handleInputChange("incluir_presentes_especiais", value);
                    saveDetail("incluir_presentes_especiais", value);
                  }}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="true" id="presentes_sim" />
                    <Label htmlFor="presentes_sim">
                      Sim, quero incluir presentes especiais
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="false" id="presentes_nao" />
                    <Label htmlFor="presentes_nao">
                      Não, apenas lembrancinhas
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardFooter className="flex flex-col sm:flex-row gap-3 pt-6">
                <Button 
                  variant="outline" 
                  onClick={handleDiscard}
                  disabled={saving}
                >
                  Descartar
                </Button>

                {formData.incluir_presentes_especiais === "true" ? (
                  <Button
                    type="button"
                    onClick={handleAdvance}
                    disabled={saving}
                    className="w-full sm:flex-1"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Avançar para Presentes
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleFinalize}
                    disabled={saving}
                    className="w-full sm:flex-1"
                  >
                    {saving ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Finalizar Orçamento
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
        </main>
        <WhatsAppButton />
      </div>
    </AuthGuard>
  );
};

export default OrcamentoLembrancinhas;