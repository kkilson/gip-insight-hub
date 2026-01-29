import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Mail, Phone, User, Calendar, CheckCircle, Clock, XCircle } from 'lucide-react';
import type { BirthdayClient } from '@/hooks/useBirthdays';
import { useBirthdayHistory, formatBirthdayDate } from '@/hooks/useBirthdays';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BirthdayDetailDialogProps {
  birthday: BirthdayClient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: (birthday: BirthdayClient) => void;
}

export function BirthdayDetailDialog({
  birthday,
  open,
  onOpenChange,
  onSend,
}: BirthdayDetailDialogProps) {
  const { data: history, isLoading: historyLoading } = useBirthdayHistory(birthday?.clientId || '');

  if (!birthday) return null;

  const birthDate = new Date(birthday.birthDate);
  const age = new Date().getFullYear() - birthDate.getFullYear();
  const hasContact = birthday.email || birthday.phone || birthday.mobile;
  const canSend = birthday.status !== 'enviado';

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case 'enviado':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pendiente':
        return <Clock className="h-4 w-4 text-amber-600" />;
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>🎂</span> Detalle de Cumpleaños
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">{birthday.fullName}</h3>
                <p className="text-sm text-muted-foreground">
                  {formatBirthdayDate(birthday.birthDay, birthday.birthMonth)} ({age} años)
                </p>
              </div>
            </div>

            {birthday.advisorName && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Asesor:</span>
                <span className="font-medium">{birthday.advisorName}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Contact info */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Contacto</h4>
            <div className="space-y-2">
              {birthday.email ? (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{birthday.email}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">Sin email</span>
                </div>
              )}
              
              {(birthday.mobile || birthday.phone) ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{birthday.mobile || birthday.phone}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">Sin teléfono</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Send history */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Historial de Envíos</h4>
            {historyLoading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : history && history.length > 0 ? (
              <div className="space-y-2">
                {history.map((send) => (
                  <div
                    key={send.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{send.send_year}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {send.status_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {getStatusIcon(send.status_email)}
                        </div>
                      )}
                      {send.status_whatsapp && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {getStatusIcon(send.status_whatsapp)}
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(send.sent_at), "d MMM yyyy", { locale: es })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin envíos registrados</p>
            )}
          </div>

          {/* Actions */}
          {canSend && hasContact && (
            <>
              <Separator />
              <Button
                className="w-full"
                onClick={() => {
                  onSend(birthday);
                  onOpenChange(false);
                }}
              >
                Enviar Felicitación
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
