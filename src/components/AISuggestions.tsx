import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Check, Edit, X, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AISuggestionsProps {
  budgetId: string;
  campo: string;
  context: Record<string, any>;
  onSuggestionAccepted: (text: string) => void;
  className?: string;
}

interface Suggestion {
  id: string;
  texto: string;
  editing: boolean;
  editedText: string;
}

export const AISuggestions: React.FC<AISuggestionsProps> = ({
  budgetId,
  campo,
  context,
  onSuggestionAccepted,
  className
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    try {
      setLoading(true);
      
      // Call AI edge function to generate suggestions
      const { data, error } = await supabase.functions.invoke('generate-suggestions', {
        body: {
          budgetId,
          campo,
          context
        }
      });

      if (error) throw error;

      const generatedSuggestions = data.suggestions.map((text: string, index: number) => ({
        id: `suggestion-${Date.now()}-${index}`,
        texto: text,
        editing: false,
        editedText: text
      }));

      setSuggestions(generatedSuggestions);
      setShowSuggestions(true);

      // Save suggestions to database
      const savePromises = data.suggestions.map((texto: string) =>
        supabase.from('ia_sugestoes').insert({
          id_orcamento: budgetId,
          campo,
          texto_sugerido: texto,
          status: 'rejeitado'
        })
      );

      await Promise.all(savePromises);

    } catch (error: any) {
      console.error('Error generating suggestions:', error);
      toast({
        title: "Erro na IA",
        description: "Não foi possível gerar sugestões. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUseSuggestion = async (suggestion: Suggestion) => {
    try {
      // Record interaction
      await supabase.from('ia_interacoes').insert({
        id_sugestao: suggestion.id,
        id_cliente: (await supabase.auth.getUser()).data.user?.id,
        acao: 'aceitar'
      });

      // Update suggestion status
      await supabase.from('ia_sugestoes')
        .update({ status: 'aceito' })
        .eq('texto_sugerido', suggestion.texto);

      onSuggestionAccepted(suggestion.texto);
      setShowSuggestions(false);
      
      toast({
        title: "Sugestão aplicada",
        description: "A sugestão foi adicionada ao seu formulário.",
      });
    } catch (error: any) {
      console.error('Error using suggestion:', error);
    }
  };

  const handleEditSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId ? { ...s, editing: true } : s
    ));
  };

  const handleSaveEdit = async (suggestion: Suggestion) => {
    try {
      // Record interaction as edited
      await supabase.from('ia_interacoes').insert({
        id_sugestao: suggestion.id,
        id_cliente: (await supabase.auth.getUser()).data.user?.id,
        acao: 'editar'
      });

      // Update suggestion status
      await supabase.from('ia_sugestoes')
        .update({ status: 'editado' })
        .eq('texto_sugerido', suggestion.texto);

      onSuggestionAccepted(suggestion.editedText);
      setShowSuggestions(false);
      
      toast({
        title: "Sugestão editada aplicada",
        description: "Sua versão editada foi adicionada ao formulário.",
      });
    } catch (error: any) {
      console.error('Error saving edited suggestion:', error);
    }
  };

  const handleRejectSuggestion = async (suggestion: Suggestion) => {
    try {
      // Record interaction as rejected
      await supabase.from('ia_interacoes').insert({
        id_sugestao: suggestion.id,
        id_cliente: (await supabase.auth.getUser()).data.user?.id,
        acao: 'rejeitar'
      });

      setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
    } catch (error: any) {
      console.error('Error rejecting suggestion:', error);
    }
  };

  const updateEditedText = (suggestionId: string, text: string) => {
    setSuggestions(prev => prev.map(s => 
      s.id === suggestionId ? { ...s, editedText: text } : s
    ));
  };

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={generateSuggestions}
        disabled={loading}
        className="mb-4"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        Peça ajuda à IA
      </Button>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              Sugestões da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestions.map((suggestion) => (
              <div key={suggestion.id} className="border rounded-lg p-4 space-y-3">
                {suggestion.editing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={suggestion.editedText}
                      onChange={(e) => updateEditedText(suggestion.id, e.target.value)}
                      className="min-h-[100px]"
                      placeholder="Edite a sugestão..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(suggestion)}
                        disabled={!suggestion.editedText.trim()}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Usar Editado
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSuggestions(prev => prev.map(s => 
                          s.id === suggestion.id ? { ...s, editing: false, editedText: s.texto } : s
                        ))}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {suggestion.texto}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleUseSuggestion(suggestion)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Usar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSuggestion(suggestion.id)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar & Usar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRejectSuggestion(suggestion)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Descartar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};