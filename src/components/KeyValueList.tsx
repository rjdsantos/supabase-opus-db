import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface KeyValueItem {
  chave: string;
  valor: string;
}

interface KeyValueListProps {
  title: string;
  items: KeyValueItem[];
}

export const KeyValueList = ({ title, items }: KeyValueListProps) => {
  const getFieldLabel = (key: string): string => {
    const labels: Record<string, string> = {
      // Decoração
      tema_festa: "Tema da Festa",
      numero_convidados: "Número de Convidados", 
      faixa_etaria: "Faixa Etária",
      data_evento: "Data do Evento",
      horario_evento: "Horário do Evento",
      local_evento: "Local do Evento",
      orcamento_decoracao: "Orçamento para Decoração",
      cores_preferidas: "Cores Preferidas",
      decoracao_mesa: "Decoração de Mesa",
      decoracao_painel: "Decoração de Painel",
      baloes: "Balões",
      observacoes_decoracao: "Observações",

      // Lembrancinhas
      tipo_lembrancinha: "Tipo de Lembrancinha",
      quantidade_lembrancinhas: "Quantidade",
      orcamento_lembrancinhas: "Orçamento",
      personalizacao: "Personalização",
      embalagem: "Embalagem",
      prazo_entrega: "Prazo de Entrega",
      observacoes_lembrancinhas: "Observações",

      // Presentes
      ocasiao: "Ocasião",
      destinatario: "Destinatário",
      relacao_destinatario: "Relação com Destinatário",
      interesses_hobbies: "Interesses e Hobbies",
      orcamento_presente: "Orçamento",
      tipo_presente: "Tipo de Presente",
      observacoes_presentes: "Observações",

      // Campos gerais
      nome: "Nome",
      email: "E-mail", 
      telefone: "Telefone",
      whatsapp: "WhatsApp"
    };

    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
  };

  const formatFieldValue = (key: string, value: string): string => {
    // Se o campo contém "data" e o valor parece ser uma data ISO
    if (key.includes('data') && value.includes('-') && value.length >= 10) {
      try {
        return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
      } catch {
        return value;
      }
    }

    // Formatação especial para valores monetários
    if (key.includes('orcamento') && /^\d+$/.test(value)) {
      return `R$ ${parseInt(value).toLocaleString('pt-BR')}`;
    }

    return value;
  };

  if (items.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            Nenhum detalhe disponível
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={index}>
            <div className="grid grid-cols-1 gap-2">
              <dt className="text-sm font-medium text-muted-foreground">
                {getFieldLabel(item.chave)}
              </dt>
              <dd className="text-sm font-medium text-foreground">
                {formatFieldValue(item.chave, item.valor) || "Não informado"}
              </dd>
            </div>
            {index < items.length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};