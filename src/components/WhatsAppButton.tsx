import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const WhatsAppButton = () => {
  const [whatsappNumber, setWhatsappNumber] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to get WhatsApp number from environment variable
    const envNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
    if (envNumber) {
      setWhatsappNumber(envNumber);
    } else {
      // Fallback to a default number for demonstration
      setWhatsappNumber("+5511912345678"); // Placeholder - should be configured in production
    }
    setIsLoading(false);
  }, []);

  const handleWhatsAppClick = () => {
    if (!whatsappNumber) return;

    const message = "Olá, Jaqueline! Gostaria de um orçamento.";
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber.replace('+', '')}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        onClick={handleWhatsAppClick}
        disabled={!whatsappNumber}
        size="lg"
        className="rounded-full h-14 w-14 bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-200 text-white"
        aria-label={whatsappNumber ? "Fale comigo no WhatsApp" : "Número indisponível no momento"}
        title={whatsappNumber ? "Fale comigo no WhatsApp" : "Número indisponível no momento"}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default WhatsAppButton;