import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCasePhases, useCaseUpdates, useUpdateCasePhase, useUpdateCaseStatus } from '@/hooks/useTracking';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight, Clock } from 'lucide-react';
import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface CaseDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  caseData: any;
}

const statusColors: Record<string, string> = {
  abierto: 'bg-blue-100 text-blue-800',
  en_progreso: 'bg-amber-100 text-amber-800',
  en_espera: 'bg-orange-100 text-orange-800',
  completado: 'bg-green-100 text-green-800',
  cancelado: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  abierto: 'Abierto',
  en_progreso: 'En Progreso',
  en_espera: 'En Espera',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

const priorityColors: Record<string, string> = {
  baja: 'bg-slate-100 text-slate-700',
  normal: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
};

export function CaseDetailDialog({ open, onOpenChange, caseData }: CaseDetailDialogProps) {
  const { data: phases } = useCasePhases(caseData?.case_type_id);
  const { data: updates } = useCaseUpdates(caseData?.id);
  const updatePhase = useUpdateCasePhase();
  const updateStatus = useUpdateCaseStatus();
  const [notes, setNotes] = useState('');

  if (!caseData) return null;

  const client = caseData.clients;
  const policy = caseData.policies;
  const caseType = caseData.tracking_case_types;
  const currentPhase = caseData.tracking_case_phases;

  const handlePhaseChange = async (newPhaseId: string) => {
    await updatePhase.mutateAsync({
      caseId: caseData.id,
      newPhaseId,
      previousPhaseId: caseData.current_phase_id || undefined,
      notes: notes || undefined,
    });
    setNotes('');
  };

  const handleStatusChange = async (newStatus: string) => {
    await updateStatus.mutateAsync({
      caseId: caseData.id,
      newStatus,
      previousStatus: caseData.status,
      notes: notes || undefined,
    });
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{caseData.title}</span>
            <Badge className={statusColors[caseData.status]}>{statusLabels[caseData.status]}</Badge>
            <Badge className={priorityColors[caseData.priority]}>{caseData.priority}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Tipo</p>
              <p className="font-medium">{caseType?.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cliente</p>
              <p className="font-medium">{client?.first_name} {client?.last_name}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Póliza</p>
              <p className="font-medium">{policy?.policy_number || 'N/A'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Fase Actual</p>
              <p className="font-medium">{currentPhase?.name || 'Sin fase'}</p>
            </div>
            {caseData.due_date && (
              <div>
                <p className="text-muted-foreground">Fecha Límite</p>
                <p className="font-medium">{format(new Date(caseData.due_date), 'dd/MM/yyyy')}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Apertura</p>
              <p className="font-medium">{format(new Date(caseData.opened_at), 'dd/MM/yyyy HH:mm', { locale: es })}</p>
            </div>
          </div>

          {caseData.description && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Descripción</p>
              <p className="text-sm">{caseData.description}</p>
            </div>
          )}

          <Separator />

          {/* Phase Progress */}
          {phases && phases.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-3">Progreso de Fases</p>
              <div className="flex items-center gap-2 flex-wrap">
                {phases.map((phase, idx) => {
                  const isCurrent = phase.id === caseData.current_phase_id;
                  const currentIdx = phases.findIndex((p) => p.id === caseData.current_phase_id);
                  const isPast = idx < currentIdx;
                  return (
                    <div key={phase.id} className="flex items-center gap-2">
                      <button
                        onClick={() => handlePhaseChange(phase.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          isCurrent
                            ? 'bg-primary text-primary-foreground'
                            : isPast
                            ? 'bg-green-100 text-green-800'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {phase.name}
                      </button>
                      {idx < phases.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status Change */}
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium">Cambiar Estado</p>
              <Select value={caseData.status} onValueChange={handleStatusChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Notas de actualización</p>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Agregar nota al cambio..." />
          </div>

          <Separator />

          {/* Updates Timeline */}
          <div>
            <p className="text-sm font-medium mb-3">Historial de Actualizaciones</p>
            {updates && updates.length > 0 ? (
              <div className="space-y-3">
                {updates.map((u: any) => (
                  <div key={u.id} className="flex gap-3 text-sm">
                    <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-muted-foreground">
                        {format(new Date(u.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </p>
                      {u.new_phase && (
                        <p>
                          Fase: {u.previous_phase?.name || '—'} → <span className="font-medium">{u.new_phase?.name}</span>
                        </p>
                      )}
                      {u.new_status && u.previous_status !== u.new_status && (
                        <p>
                          Estado: {statusLabels[u.previous_status] || '—'} → <span className="font-medium">{statusLabels[u.new_status]}</span>
                        </p>
                      )}
                      {u.notes && <p className="text-muted-foreground italic">{u.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin actualizaciones aún</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
