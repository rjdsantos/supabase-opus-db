import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';

import { AuthGuard } from '@/components/AuthGuard';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useOrcamentoBudget } from '@/hooks/useOrcamentoBudget';
import { useOrcamentoRelated } from '@/hooks/useOrcamentoRelated';
import { AISuggestions } from '@/components/AISuggestions';
import { LinkedBudgets } from '@/components/LinkedBudgets';
import { cn } from '@/lib/utils';

const eventoTipos = [
  { value: 'aniversario', label: 'Aniversário' },
  { value: 'cha_de_bebe', label: 'Chá de Bebê' },
  { value: 'mini_wedding', label: 'Mini Wedding' },
  { value: 'batizado', label: 'Batizado' },
  { value: 'festa_tematica', label: 'Festa Temática' },
  { value: 'evento_corporativo', label: 'Evento Corporativo' },
  { value: 'arvore_de_natal', label: 'Árvore de Natal' }
];

const arvoreTamanhos = [
  { value: 'ate_1m', label: 'Até 1 metro' },
  { value: 'ate_1_5m', label: 'Até 1,5 metros' },
  { value: 'ate_2m', label: 'Até 2 metros' },
  { value: 'acima_2m', label: 'Acima de 2 metros' }
];

const decorationItems = [
  { key: 'mesa_principal', label: 'Mesa principal' },
  { key: 'centro_mesa', label: 'Centro de mesa' },
  { key: 'mesa_buffet', label: 'Mesa buffet' },
  { key: 'painel_instagramavel', label: 'Painel instagramável' },
  { key: 'baloes', label: 'Balões' }
];

const formSchema = z.object({
  tipo_evento: z.string().min(1, 'Selecione um tipo de evento'),
  // Árvore de Natal
  arvore_montagem_apenas: z.string().optional(),
  arvore_tamanho: z.string().optional(),
  arvore_data_sugerida: z.date().optional(),
  // Outros eventos
  data_evento: z.date().optional(),
  n_convidados: z.string().optional(),
  mesa_principal: z.boolean().optional(),
  centro_mesa: z.boolean().optional(),
  mesa_buffet: z.boolean().optional(),
  painel_instagramavel: z.boolean().optional(),
  baloes: z.boolean().optional(),
  descricao_evento: z.string().optional(),
  // Encadeamento
  incluir_lembrancinhas: z.string().optional()
}).refine((data) => {
  if (data.tipo_evento === 'arvore_de_natal') {
    return data.arvore_montagem_apenas && data.arvore_tamanho && data.arvore_data_sugerida;
  } else {
    return data.data_evento && data.n_convidados && parseInt(data.n_convidados) > 0;
  }
}, {
  message: "Preencha todos os campos obrigatórios",
  path: ["tipo_evento"]
});

type FormData = z.infer<typeof formSchema>;

export const OrcamentoDecoracao = () => {
  const navigate = useNavigate();
  const { budget, details, loading, saving, error, saveDraft, finalizeBudget, deleteDetails } = useOrcamentoBudget('decoracao');
  const { finalizeAndCreateLinked } = useOrcamentoRelated();
  const [showContinueOptions, setShowContinueOptions] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_evento: '',
      arvore_montagem_apenas: '',
      arvore_tamanho: '',
      n_convidados: '',
      mesa_principal: false,
      centro_mesa: false,
      mesa_buffet: false,
      painel_instagramavel: false,
      baloes: false,
      descricao_evento: '',
      incluir_lembrancinhas: ''
    }
  });

  const tipoEvento = form.watch('tipo_evento');
  const incluirLembrancinhas = form.watch('incluir_lembrancinhas');

  // Load saved details into form
  useEffect(() => {
    if (details && Object.keys(details).length > 0) {
      const formData: any = {
        tipo_evento: details.tipo_evento || '',
        arvore_montagem_apenas: details.arvore_montagem_apenas || '',
        arvore_tamanho: details.arvore_tamanho || '',
        n_convidados: details.n_convidados || '',
        mesa_principal: details.mesa_principal === 'true',
        centro_mesa: details.centro_mesa === 'true',
        mesa_buffet: details.mesa_buffet === 'true',
        painel_instagramavel: details.painel_instagramavel === 'true',
        baloes: details.baloes === 'true',
        descricao_evento: details.descricao_evento || '',
        incluir_lembrancinhas: details.incluir_lembrancinhas || ''
      };
      
      // Handle dates
      if (details.arvore_data_sugerida) {
        formData.arvore_data_sugerida = new Date(details.arvore_data_sugerida);
      }
      if (details.data_evento) {
        formData.data_evento = new Date(details.data_evento);
      }

      form.reset(formData);
    }
  }, [details, form]);

  // Clean up irrelevant fields when switching event types
  useEffect(() => {
    if (tipoEvento === 'arvore_de_natal') {
      // Clear other event fields
      const keysToDelete = ['data_evento', 'n_convidados', 'mesa_principal', 'centro_mesa', 'mesa_buffet', 'painel_instagramavel', 'baloes', 'descricao_evento'];
      deleteDetails(keysToDelete);
      
      form.setValue('data_evento', undefined);
      form.setValue('n_convidados', '');
      decorationItems.forEach(item => {
        form.setValue(item.key as any, false);
      });
      form.setValue('descricao_evento', '');
    } else if (tipoEvento && tipoEvento !== 'arvore_de_natal') {
      // Clear árvore fields
      const keysToDelete = ['arvore_montagem_apenas', 'arvore_tamanho', 'arvore_data_sugerida'];
      deleteDetails(keysToDelete);
      
      form.setValue('arvore_montagem_apenas', '');
      form.setValue('arvore_tamanho', '');
      form.setValue('arvore_data_sugerida', undefined);
    }
  }, [tipoEvento, deleteDetails, form]);

  const getFormDataAsStrings = (data: FormData): Record<string, string> => {
    const result: Record<string, string> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (value instanceof Date) {
          result[key] = value.toISOString();
        } else if (typeof value === 'boolean') {
          result[key] = value.toString();
        } else {
          result[key] = value.toString();
        }
      }
    });
    
    return result;
  };

  const handleSaveDraft = async () => {
    const formData = form.getValues();
    const stringData = getFormDataAsStrings(formData);
    await saveDraft(stringData);
  };

  const handleAdvance = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    try {
      const formData = form.getValues();
      const stringData = getFormDataAsStrings(formData);

      if (incluirLembrancinhas === 'sim') {
        // Finalize current budget and create linked budget for lembrancinhas
        const newBudgetId = await finalizeAndCreateLinked(
          budget!.id_orcamento,
          stringData,
          'lembrancinhas'
        );
        navigate(`/orcamento/lembrancinhas?id_orcamento=${newBudgetId}`);
      } else {
        await saveDraft(stringData);
        setShowContinueOptions(true);
      }
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const handleFinalize = async () => {
    const isValid = await form.trigger();
    if (!isValid) return;

    try {
      const formData = form.getValues();
      const stringData = getFormDataAsStrings(formData);
      const budgetId = await finalizeBudget(stringData);
      navigate(`/orcamento/confirmacao?id_orcamento=${budgetId}`);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleContinueToPresents = async () => {
    try {
      const formData = form.getValues();
      const stringData = getFormDataAsStrings(formData);
      
      // Finalize current budget and create linked budget for presentes
      const newBudgetId = await finalizeAndCreateLinked(
        budget!.id_orcamento,
        stringData,
        'presentes'
      );
      navigate(`/orcamento/presentes?id_orcamento=${newBudgetId}`);
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  if (loading) {
    return (
      <AuthGuard requiredRole="client">
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="space-y-6">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard requiredRole="client">
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-8 max-w-4xl">
            <Alert variant="destructive">
              <AlertDescription>
                Erro ao carregar o orçamento: {error}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard requiredRole="client">
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Orçamento de Decoração</h1>
              <p className="text-muted-foreground">
                Preencha os detalhes do seu evento para recebermos um orçamento personalizado
              </p>
            </div>

            {budget && (
              <LinkedBudgets 
                currentBudgetId={budget.id_orcamento} 
                currentCategory="decoracao" 
              />
            )}

            <Form {...form}>
              <div className="space-y-6">
                {/* Tipo de Evento */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tipo de Evento</CardTitle>
                    <CardDescription>
                      Selecione o tipo de evento que deseja decorar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="tipo_evento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qual evento você está planejando?</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um tipo de evento" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {eventoTipos.map((tipo) => (
                                <SelectItem key={tipo.value} value={tipo.value}>
                                  {tipo.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Seção Árvore de Natal */}
                {tipoEvento === 'arvore_de_natal' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Detalhes da Árvore de Natal</CardTitle>
                      <CardDescription>
                        Informe os detalhes específicos para a decoração da árvore
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <FormField
                        control={form.control}
                        name="arvore_montagem_apenas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Apenas montagem da árvore?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="sim" id="montagem-sim" />
                                  <Label htmlFor="montagem-sim">Sim</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="nao" id="montagem-nao" />
                                  <Label htmlFor="montagem-nao">Não</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="arvore_tamanho"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tamanho da árvore</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tamanho" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {arvoreTamanhos.map((tamanho) => (
                                  <SelectItem key={tamanho.value} value={tamanho.value}>
                                    {tamanho.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="arvore_data_sugerida"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data sugerida para montagem</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-[240px] pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy")
                                    ) : (
                                      <span>Selecione uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                  className="p-3 pointer-events-auto"
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Seção Outros Eventos */}
                {tipoEvento && tipoEvento !== 'arvore_de_natal' && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Informações do Evento</CardTitle>
                        <CardDescription>
                          Detalhes básicos sobre o seu evento
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <FormField
                          control={form.control}
                          name="data_evento"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Data do evento</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-[240px] pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd/MM/yyyy")
                                      ) : (
                                        <span>Selecione uma data</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date < new Date()}
                                    initialFocus
                                    className="p-3 pointer-events-auto"
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="n_convidados"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Número de convidados</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Ex: 50"
                                  min="1"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Itens de Decoração</CardTitle>
                        <CardDescription>
                          Selecione os itens que deseja incluir na decoração
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {decorationItems.map((item) => (
                            <FormField
                              key={item.key}
                              control={form.control}
                              name={item.key as any}
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel className="font-normal">
                                      {item.label}
                                    </FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Descrição do Evento</CardTitle>
                        <CardDescription>
                          Conte-nos como você imagina seu evento
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <FormField
                          control={form.control}
                          name="descricao_evento"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Como você imagina seu evento?</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Descreva a atmosfera, cores, estilo, temas específicos..."
                                  className="min-h-[100px]"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {budget && (
                          <AISuggestions
                            budgetId={budget.id_orcamento}
                            campo="descricao_evento"
                            context={{
                              categoria: 'decoracao',
                              tipo_evento: tipoEvento,
                              n_convidados: form.getValues('n_convidados'),
                              data_evento: form.getValues('data_evento')
                            }}
                            onSuggestionAccepted={(text) => form.setValue('descricao_evento', text)}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* Encadeamento */}
                {tipoEvento && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Próximos Passos</CardTitle>
                      <CardDescription>
                        Deseja incluir outros serviços no seu orçamento?
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="incluir_lembrancinhas"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Incluir lembrancinhas no orçamento?</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="sim" id="lembrancinhas-sim" />
                                  <Label htmlFor="lembrancinhas-sim">Sim</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="nao" id="lembrancinhas-nao" />
                                  <Label htmlFor="lembrancinhas-nao">Não</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Continue Options */}
                {showContinueOptions && incluirLembrancinhas === 'nao' && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Escolha uma opção</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button onClick={handleFinalize} disabled={saving}>
                          {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                          Finalizar Orçamento
                        </Button>
                        <Button variant="outline" onClick={handleContinueToPresents}>
                          Continuar para Presentes Especiais
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={saving}
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Salvar Rascunho
                  </Button>

                  {incluirLembrancinhas === 'sim' && !showContinueOptions && (
                    <Button onClick={handleAdvance} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Avançar para Lembrancinhas
                    </Button>
                  )}

                  {(incluirLembrancinhas === 'nao' || !incluirLembrancinhas || showContinueOptions) && (
                    <Button onClick={handleFinalize} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Finalizar Orçamento
                    </Button>
                  )}
                </div>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
};

export default OrcamentoDecoracao;