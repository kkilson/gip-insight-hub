import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BirthdayCardGenerator } from './BirthdayCardGenerator';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Eye, Mail, Phone, Send, PartyPopper, Clock, CheckCircle, AlertTriangle, Calendar, Image } from 'lucide-react';
import type { BirthdayClient, BirthdayStatus } from '@/hooks/useBirthdays';
import { formatBirthdayDate } from '@/hooks/useBirthdays';

interface BirthdayTableProps {
  birthdays: BirthdayClient[];
  onViewDetails: (birthday: BirthdayClient) => void;
  onSend: (birthday: BirthdayClient) => void;
  onGenerateCard: (birthday: BirthdayClient) => void;
}

const statusConfig: Record<BirthdayStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType; className?: string }> = {
  hoy: {
    label: 'Hoy 🎉',
    variant: 'default',
    icon: PartyPopper,
    className: 'bg-green-500 hover:bg-green-600',
  },
  pendiente: {
    label: 'Pendiente',
    variant: 'secondary',
    icon: Clock,
    className: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  enviado: {
    label: 'Enviado',
    variant: 'default',
    icon: CheckCircle,
    className: 'bg-emerald-500 hover:bg-emerald-600',
  },
  proximo: {
    label: 'Próximo',
    variant: 'outline',
    icon: Calendar,
  },
  pasado: {
    label: 'No enviado',
    variant: 'destructive',
    icon: AlertTriangle,
  },
};

export function BirthdayTable({ birthdays, onViewDetails, onSend, onGenerateCard }: BirthdayTableProps) {
  if (birthdays.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <PartyPopper className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No hay cumpleaños en este mes</p>
        <p className="text-sm">Los clientes sin fecha de nacimiento no aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Fecha</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="hidden md:table-cell">Asesor</TableHead>
            <TableHead className="hidden sm:table-cell">Contacto</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {birthdays.map((birthday) => {
            const config = statusConfig[birthday.status];
            const StatusIcon = config.icon;
            const canSend = birthday.status !== 'enviado';
            const hasContact = birthday.email || birthday.phone || birthday.mobile;

            return (
              <TableRow key={birthday.id} className={birthday.status === 'hoy' ? 'bg-green-50' : ''}>
                <TableCell className="font-medium">
                  {String(birthday.birthDay).padStart(2, '0')}/{String(birthday.birthMonth).padStart(2, '0')}
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{birthday.fullName}</p>
                    <p className="text-sm text-muted-foreground md:hidden">
                      {birthday.advisorName || 'Sin asesor'}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {birthday.advisorName || <span className="text-muted-foreground">Sin asesor</span>}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div className="flex items-center gap-2">
                    {birthday.email && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>{birthday.email}</TooltipContent>
                      </Tooltip>
                    )}
                    {(birthday.phone || birthday.mobile) && (
                      <Tooltip>
                        <TooltipTrigger>
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>{birthday.mobile || birthday.phone}</TooltipContent>
                      </Tooltip>
                    )}
                    {!hasContact && (
                      <span className="text-xs text-muted-foreground">Sin contacto</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={config.variant} className={config.className}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onViewDetails(birthday)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver detalle</TooltipContent>
                    </Tooltip>
                    
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onGenerateCard(birthday)}
                        >
                          <Image className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Generar tarjeta</TooltipContent>
                    </Tooltip>
                    
                    {canSend && hasContact && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onSend(birthday)}
                            className="text-primary hover:text-primary"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Enviar felicitación</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
