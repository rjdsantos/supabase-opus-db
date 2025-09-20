import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Users, Gift, Palette } from "lucide-react";
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
  
  // Get event date
  const dataEvento = getDetalhe('dataEvento') || getDetalhe('data_evento');
  
  // Get quantity
  const quantidade = getDetalhe('quantidade') || getDetalhe('quantidadeLembrancinhas');
  
  // Get special gifts info
  const presentesEspeciais = getDetalhe('presentesEspeciais') || getDetalhe('presentes_especiais');
  
  // Get selected styles
  const estilosSelecionados = getDetalhe('estilosSelecionados') || getDetalhe('estilos_selecionados') || getDetalhe('estilos');
  
  // Get theme/decoration
  const tema = getDetalhe('tema') || getDetalhe('temaCor') || getDetalhe('tema_cor');

  // Parse date for calendar
  const eventDate = dataEvento ? new Date(dataEvento) : undefined;

  // Parse selected styles (assuming they are comma-separated)
  const estilosArray = estilosSelecionados ? estilosSelecionados.split(',').map(s => s.trim()).filter(s => s) : [];

  return (
    <div className="space-y-6">
      {/* Event Type Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-primary">
            <Gift className="h-5 w-5" />
            {tipoEvento}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Date and Quantity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Date with Calendar */}
        {dataEvento && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5" />
                Data Especial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  className="rounded-md border"
                  disabled={true}
                />
                {eventDate && (
                  <p className="text-sm font-medium">
                    {eventDate.toLocaleDateString('pt-BR', {
                      weekday: 'long',
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quantity */}
        <div className="space-y-6">
          {quantidade && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Quantidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {quantidade}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    unidade(s)
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special Gifts */}
          {shouldShowDetail('presentesEspeciais') || shouldShowDetail('presentes_especiais') ? (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-yellow-700">
                  <Gift className="h-5 w-5" />
                  Presentes Especiais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium text-yellow-700">
                    Incluído no orçamento
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Selected Styles */}
      {estilosArray.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estilos Selecionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {estilosArray.map((estilo, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {estilo}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme or Decoration */}
      {tema && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="h-5 w-5" />
              Tema ou Decorado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{tema}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LembrancinhasDetails;