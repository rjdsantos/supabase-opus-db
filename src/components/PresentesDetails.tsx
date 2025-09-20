import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Gift, FileText } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";

interface PresentesDetailsProps {
  detalhes: Array<{ chave: string; valor: string }>;
}

const PresentesDetails = ({ detalhes }: PresentesDetailsProps) => {
  // Helper function to get detail value by key
  const getDetalhe = (chave: string) => {
    const detalhe = detalhes.find(d => d.chave === chave);
    return detalhe?.valor || '';
  };

  // Get delivery date
  const dataEntrega = getDetalhe('data_entrega') || getDetalhe('dataEntrega');
  
  // Get gift type  
  const tipoPresente = getDetalhe('tipo_presente') || getDetalhe('tipoPresente');
  
  // Get additional instructions
  const instrucoes = getDetalhe('instrucoes_adicionais') || getDetalhe('instrucoesAdicionais') || getDetalhe('observacoes_presentes');

  // Parse date for calendar
  const deliveryDate = dataEntrega ? new Date(dataEntrega) : undefined;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <Gift className="h-5 w-5 text-purple-600" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Detalhes do Seu Orçamento</h1>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Delivery Date */}
        {dataEntrega && (
          <Card className="p-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-medium">
                <CalendarIcon className="h-5 w-5" />
                Data Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Calendar
                mode="single"
                selected={deliveryDate}
                className="rounded-lg border w-full"
                disabled={true}
              />
              {deliveryDate && (
                <p className="text-sm font-medium text-center text-foreground">
                  {deliveryDate.toLocaleDateString('pt-BR', {
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

        {/* Right Column - Gift Type */}
        {tipoPresente && (
          <Card className="p-0">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-3 text-lg font-medium">
                <Gift className="h-5 w-5" />
                Tipo de Presente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Badge variant="secondary" className="text-lg py-2 px-4 font-medium">
                  {tipoPresente}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Additional Instructions */}
      {instrucoes && (
        <Card className="p-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-medium">
              <FileText className="h-5 w-5" />
              Observações Adicionais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground leading-relaxed">
              {instrucoes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PresentesDetails;