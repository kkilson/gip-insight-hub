import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mail, MessageCircle, Send, AlertTriangle, Info } from 'lucide-react';
import type { BirthdayClient } from '@/hooks/useBirthdays';
import { useBirthdaySend, formatBirthdayDate } from '@/hooks/useBirthdays';
import { useToast } from '@/hooks/use-toast';

interface BirthdaySendDialogProps {
  birthday: BirthdayClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BirthdaySendDialog({
  birthday,
  open,
  onOpenChange,
}: BirthdaySendDialogProps) {
  const [selectedChannels, setSelectedChannels] = useState<{
    email: boolean;
    whatsapp: boolean;
  }>({
    email: true,
    whatsapp: true,
  });

  const { mutate: sendBirthday, isPending } = useBirthdaySend();
  const { toast } = useToast();

  if (!birthday) return null;

  const hasEmail = !!birthday.email;
  const hasPhone = !!(birthday.mobile || birthday.phone);
  const canSendEmail = hasEmail && selectedChannels.email;
  const canSendWhatsapp = hasPhone && selectedChannels.whatsapp;
  const canSend = canSendEmail || canSendWhatsapp;

  const handleSend = () => {
    const channels: ('email' | 'whatsapp')[] = [];
    if (canSendEmail) channels.push('email');
    if (canSendWhatsapp) channels.push('whatsapp');

    if (channels.length === 0) {
      toast({
        title: 'Error',
        description: 'Seleccione al menos un canal de envío',
        variant: 'destructive',
      });
      return;
    }

    sendBirthday(
      {
        clientId: birthday.clientId,
        channels,
        year: new Date().getFullYear(),
        clientName: birthday.fullName,
        clientEmail: birthday.email || undefined,
      },
      {
        onSuccess: () => {
          toast({
            title: 'Felicitación registrada',
            description: 'La felicitación ha sido programada para envío.',
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'No se pudo registrar la felicitación',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Enviar Felicitación
          </DialogTitle>
          <DialogDescription>
            Seleccione los canales para enviar la felicitación de cumpleaños
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Client info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="font-semibold">{birthday.fullName}</p>
            <p className="text-sm text-muted-foreground">
              🎂 {formatBirthdayDate(birthday.birthDay, birthday.birthMonth)}
            </p>
            {birthday.advisorName && (
              <p className="text-sm text-muted-foreground">
                Asesor: {birthday.advisorName}
              </p>
            )}
          </div>

          <Separator />

          {/* Channel selection */}
          <div className="space-y-4">
            <h4 className="font-medium">Canales de envío</h4>

            {/* Email */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="email"
                checked={selectedChannels.email}
                onCheckedChange={(checked) =>
                  setSelectedChannels((prev) => ({ ...prev, email: !!checked }))
                }
                disabled={!hasEmail}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="email"
                  className={`flex items-center gap-2 ${!hasEmail ? 'opacity-50' : ''}`}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                {hasEmail ? (
                  <p className="text-sm text-muted-foreground">{birthday.email}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No disponible</p>
                )}
              </div>
            </div>

            {/* WhatsApp */}
            <div className="flex items-start space-x-3">
              <Checkbox
                id="whatsapp"
                checked={selectedChannels.whatsapp}
                onCheckedChange={(checked) =>
                  setSelectedChannels((prev) => ({ ...prev, whatsapp: !!checked }))
                }
                disabled={!hasPhone}
              />
              <div className="space-y-1">
                <Label
                  htmlFor="whatsapp"
                  className={`flex items-center gap-2 ${!hasPhone ? 'opacity-50' : ''}`}
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </Label>
                {hasPhone ? (
                  <p className="text-sm text-muted-foreground">
                    {birthday.mobile || birthday.phone}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No disponible</p>
                )}
              </div>
            </div>
          </div>

          {/* Info alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              El envío de felicitaciones está en modo preparación. 
              Se registrará el envío pero los servicios de Email y WhatsApp 
              serán configurados próximamente.
            </AlertDescription>
          </Alert>

          {!canSend && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No hay canales disponibles para enviar la felicitación.
                Verifique los datos de contacto del cliente.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={!canSend || isPending}>
            {isPending ? 'Registrando...' : 'Registrar Envío'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
