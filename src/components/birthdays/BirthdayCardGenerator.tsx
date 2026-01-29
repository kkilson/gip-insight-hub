import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Download, RefreshCw, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { BirthdayCard } from './BirthdayCard';
import { toast } from 'sonner';
import type { BirthdayClient } from '@/hooks/useBirthdays';

interface BirthdayCardGeneratorProps {
  birthday: BirthdayClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BirthdayCardGenerator({
  birthday,
  open,
  onOpenChange,
}: BirthdayCardGeneratorProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!birthday) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;

    setIsGenerating(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
      });

      // Create download link
      const link = document.createElement('a');
      link.download = `cumpleanos-${birthday.fullName.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Tarjeta descargada exitosamente');
    } catch (error) {
      console.error('Error generating card:', error);
      toast.error('Error al generar la tarjeta');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Vista previa de tarjeta
          </DialogTitle>
          <DialogDescription>
            Previsualiza y descarga la tarjeta de cumpleaños personalizada
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* Card preview with scroll for small screens */}
          <div className="overflow-auto max-w-full">
            <BirthdayCard
              ref={cardRef}
              clientName={birthday.fullName}
              advisorName={birthday.advisorName}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cerrar
            </Button>
            <Button
              onClick={handleDownload}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Descargar PNG
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
