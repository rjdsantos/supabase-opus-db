import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Users, Sparkles, Gift } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

interface DecoracaoDetailsProps {
  detalhes: Array<{ chave: string; valor: string }>;
}

const DecoracaoDetails = ({ detalhes }: DecoracaoDetailsProps) => {
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
  
  // Get number of guests
  const quantidadeConvidados = getDetalhe('quantidadeConvidados') || getDetalhe('quantidade_convidados');
  
  // Get event description
  const descricaoEvento = getDetalhe('descricaoEvento') || getDetalhe('descricao_evento') || getDetalhe('descricao');

  // Get lembrancinhas status
  const incluirLembrancinhas = getDetalhe('incluirLembrancinhas') || getDetalhe('incluir_lembrancinhas');

  // Get included decorations (filter out false values and exclude other fields)
  const decoracaoItems = detalhes.filter(d => 
    d.chave !== 'tipoEvento' && 
    d.chave !== 'tipo_evento' &&
    d.chave !== 'dataEvento' && 
    d.chave !== 'data_evento' &&
    d.chave !== 'quantidadeConvidados' && 
    d.chave !== 'quantidade_convidados' &&
    d.chave !== 'descricaoEvento' && 
    d.chave !== 'descricao_evento' &&
    d.chave !== 'descricao' &&
    d.chave !== 'incluirLembrancinhas' &&
    d.chave !== 'incluir_lembrancinhas' &&
    shouldShowDetail(d.chave)
  );

  // Parse date for calendar
  const eventDate = dataEvento ? new Date(dataEvento) : undefined;

  return (
    <div className="space-y-6">
      {/* Event Type Header */}
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            {tipoEvento}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Date and Guests Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Event Date with Calendar */}
        {dataEvento && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CalendarIcon className="h-5 w-5" />
                Data do Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  defaultMonth={eventDate}
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

        {/* Guests and Decorations */}
        <div className="space-y-6">
          {/* Number of Guests */}
          {quantidadeConvidados && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5" />
                  Convidados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {quantidadeConvidados}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    pessoas convidadas
                  </p>
                </div>
              </CardContent>
            </Card>
           )}

          {/* Lembrancinhas Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gift className="h-5 w-5" />
                Lembrancinhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  <span className="text-sm font-medium">
                    {incluirLembrancinhas && incluirLembrancinhas.toLowerCase() !== 'false' 
                      ? 'Incluído no orçamento' 
                      : 'Não incluído no orçamento'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Included Decorations */}
          {decoracaoItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Decorações Incluídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {decoracaoItems.map((item, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {item.chave.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Event Description */}
      {descricaoEvento && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Descrição do Evento</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{descricaoEvento}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DecoracaoDetails;