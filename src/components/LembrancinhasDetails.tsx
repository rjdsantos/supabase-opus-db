import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Users, Gift, Palette, Star, CheckCircle } from "lucide-react";
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
    <div className="space-y-8">
      {/* Event Type Header - Elegant Hero Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border-none shadow-lg">
        <CardHeader className="text-center py-8">
          <div className="inline-flex items-center gap-3 justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Gift className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">
              {tipoEvento}
            </CardTitle>
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Event Date */}
        {dataEvento && (
          <Card className="h-fit shadow-md border-l-4 border-l-primary">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-xl">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                </div>
                Data do Evento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                <Calendar
                  mode="single"
                  selected={eventDate}
                  className="rounded-lg border-2 border-primary/10"
                  disabled={true}
                />
                {eventDate && (
                  <div className="text-center p-4 bg-primary/5 rounded-lg w-full">
                    <p className="text-lg font-semibold text-primary capitalize">
                      {eventDate.toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Right Column - Quantity and Features */}
        <div className="space-y-6">
          {/* Quantity Section */}
          {quantidade && (
            <Card className="shadow-md border-l-4 border-l-secondary">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="p-2 bg-secondary/10 rounded-lg">
                    <Users className="h-5 w-5 text-secondary" />
                  </div>
                  Quantidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center p-6 bg-secondary/5 rounded-lg">
                  <div className="text-4xl font-bold text-secondary mb-2">
                    {quantidade}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    unidades
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Special Gifts Premium Card */}
          {shouldShowDetail('presentesEspeciais') || shouldShowDetail('presentes_especiais') ? (
            <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-lg">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-xl text-amber-700">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                  Presentes Especiais
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-4 bg-amber-100/50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <span className="font-medium text-amber-800">
                    Incluído no orçamento
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Selected Styles - Modern Grid Layout */}
      {estilosArray.length > 0 && (
        <Card className="shadow-md">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-accent/50 rounded-lg">
                <Palette className="h-5 w-5 text-accent-foreground" />
              </div>
              Estilos Selecionados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {estilosArray.map((estilo, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="text-sm py-2 px-4 justify-center font-medium hover:bg-secondary/80 transition-colors"
                >
                  {estilo}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Description - Rich Content Card */}
      {tema && (
        <Card className="shadow-md">
          <CardHeader className="border-b border-border/50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Palette className="h-5 w-5 text-primary" />
              </div>
              Tema & Decoração
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="p-6 bg-muted/30 rounded-lg border-l-4 border-l-primary">
              <p className="text-base leading-relaxed text-foreground">
                {tema}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LembrancinhasDetails;