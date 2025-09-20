import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Users, Gift } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

interface LembrancinhasDetailsProps {
  detalhes: Array<{ chave: string; valor: string }>;
}

const LembrancinhasDetails = ({ detalhes }: LembrancinhasDetailsProps) => {
  // Helper function to get detail value by key
  const getDetalhe = (chave: string) => {
    const detalhe = detalhes.find(d => d.chave === chave);
    return detalhe?.valor || '';
  };

  // Helper function to check if a detail should be shown (not false)
  const shouldShowDetail = (chave: string) => {
    const valor = getDetalhe(chave);
    return valor && valor.toLowerCase() !== 'false';
  };

  // Get event type
  const tipoEvento = getDetalhe('tipoEvento') || getDetalhe('tipo_evento') || 'Evento';
  
  // Get event date (supports multiple keys)
  const dataEvento = getDetalhe('data_entrega') || getDetalhe('dataEvento') || getDetalhe('data_evento');
  
  // Get quantity
  const quantidade = getDetalhe('quantidade') || getDetalhe('quantidadeLembrancinhas');
  
  // Get theme/decoration
  const tema = getDetalhe('tema_cor_desejada') || getDetalhe('tema') || getDetalhe('temaCor') || getDetalhe('tema_cor');

  // Parse date for calendar
  const eventDate = dataEvento ? new Date(dataEvento) : undefined;

  // Build selected styles from saved boolean flags and optional CSV fallback
  const styleKeyToLabel: Record<string, string> = {
    estilo_escalda_pe: 'Escalda-pé',
    estilo_vela_personalizada: 'Vela personalizada',
    estilo_pote_geleia_mel: 'Pote de geleia/mel',
    estilo_agua_benta: 'Água benta',
    estilo_oleo_perfumado: 'Óleo perfumado',
    estilo_chaveiro: 'Chaveiro',
    estilo_mandala: 'Mandala',
    estilo_doces_decorados: 'Doces decorados',
    estilo_sabonetes: 'Sabonetes',
    estilo_outra_opcao: 'Outra opção',
  };
  const estilosFromFlags = Object.keys(styleKeyToLabel)
    .filter((key) => getDetalhe(key)?.toLowerCase() === 'true')
    .map((key) => styleKeyToLabel[key]);
  const estilosCsv = getDetalhe('estilos_selecionados') || getDetalhe('estilosSelecionados') || '';
  const estilosFromCsv = estilosCsv
    ? estilosCsv.split(',').map((s) => s.trim()).filter(Boolean)
    : [];
  const outraOpcaoTexto = getDetalhe('estilo_outra_opcao_texto');
  const estilosArray = [
    ...estilosFromFlags,
    ...estilosFromCsv,
    ...(outraOpcaoTexto ? [outraOpcaoTexto] : []),
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Event Type Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <Gift className="h-5 w-5 text-blue-600" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{tipoEvento}</h1>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Event Date */}
        {dataEvento && (
          <Card className="p-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-medium">
                <CalendarIcon className="h-5 w-5" />
                Data Especial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={eventDate}
                defaultMonth={eventDate}
                className="rounded-lg border w-full"
                disabled={true}
              />
              {eventDate && (
                <p className="text-sm font-medium text-center text-foreground">
                  {eventDate.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                  }).replace(/^\w/, c => c.toUpperCase())}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Right Column - Stack */}
        <div className="space-y-6">
          {/* Quantity */}
          {quantidade && (
            <Card className="p-0">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-medium">
                  <Users className="h-5 w-5" />
                  Quantidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground mb-1">
                    {quantidade}
                  </div>
                  <p className="text-sm text-muted-foreground">unidade(s)</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special Gifts */}
          {shouldShowDetail('incluir_presentes_especiais') || shouldShowDetail('presentesEspeciais') || shouldShowDetail('presentes_especiais') ? (
            <Card className="bg-yellow-50 border-yellow-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg font-medium text-orange-700">
                  <Gift className="h-5 w-5 text-orange-600" />
                  Presentes Especiais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-orange-700">
                    Incluído no orçamento
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Selected Styles */}
          {estilosArray.length > 0 && (
            <Card className="p-0">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium">Estilos Selecionados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {estilosArray.map((estilo, index) => (
                    <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                      {estilo}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>


      {/* Theme Description */}
      {tema && (
        <Card className="p-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium">
              Tema ou Decorado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {tema}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LembrancinhasDetails;