import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCaseTypes, useCasePhases, useFollowUpPatterns, useCreateFollowUpPattern } from '@/hooks/useTracking';
import { Settings2, Plus, Clock, MessageSquare } from 'lucide-react';

export function ConfigPanel() {
  const { data: caseTypes } = useCaseTypes();
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const { data: phases } = useCasePhases(selectedTypeId || undefined);
  const { data: patterns } = useFollowUpPatterns(selectedTypeId || undefined);
  const createPattern = useCreateFollowUpPattern();

  const [showNewPattern, setShowNewPattern] = useState(false);
  const [newPattern, setNewPattern] = useState({
    phase_id: '',
    days_after_phase_start: 1,
    action_type: 'mensaje',
    channel: 'whatsapp',
    message_template: '',
    requires_approval: true,
  });

  const selectedType = caseTypes?.find((t) => t.id === selectedTypeId);

  const handleCreatePattern = async () => {
    if (!selectedTypeId) return;
    await createPattern.mutateAsync({
      case_type_id: selectedTypeId,
      phase_id: newPattern.phase_id || undefined,
      days_after_phase_start: newPattern.days_after_phase_start,
      action_type: newPattern.action_type,
      channel: newPattern.channel,
      message_template: newPattern.message_template || undefined,
      requires_approval: newPattern.requires_approval,
    });
    setShowNewPattern(false);
    setNewPattern({ phase_id: '', days_after_phase_start: 1, action_type: 'mensaje', channel: 'whatsapp', message_template: '', requires_approval: true });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Configuración de Patrones de Seguimiento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Caso</Label>
            <Select value={selectedTypeId} onValueChange={setSelectedTypeId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar tipo de caso" /></SelectTrigger>
              <SelectContent>
                {caseTypes?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedType && (
            <>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Duración por defecto</p>
                  <p className="font-medium">{selectedType.default_duration_days} días</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Afecta consumo</p>
                  <p className="font-medium">{selectedType.affects_consumption ? 'Sí' : 'No'}</p>
                </div>
              </div>

              <Separator />

              {/* Phases */}
              <div>
                <p className="text-sm font-medium mb-2">Fases configuradas</p>
                {phases && phases.length > 0 ? (
                  <div className="space-y-2">
                    {phases.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-2 p-2 border rounded-md">
                        <Badge variant="outline">{idx + 1}</Badge>
                        <span className="text-sm font-medium flex-1">{p.name}</span>
                        <span className="text-xs text-muted-foreground">{p.expected_duration_days} días</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin fases configuradas</p>
                )}
              </div>

              <Separator />

              {/* Follow-up Patterns */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">Patrones de Seguimiento Automático</p>
                  <Button size="sm" variant="outline" onClick={() => setShowNewPattern(!showNewPattern)}>
                    <Plus className="h-4 w-4 mr-1" /> Agregar
                  </Button>
                </div>

                {patterns && patterns.length > 0 ? (
                  <div className="space-y-2">
                    {patterns.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 border rounded-md text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>Día {p.days_after_phase_start}</span>
                        <Badge variant="outline">{p.channel}</Badge>
                        <Badge variant="outline">{p.action_type}</Badge>
                        {p.tracking_case_phases?.name && (
                          <span className="text-muted-foreground">en: {p.tracking_case_phases.name}</span>
                        )}
                        <Badge className={p.requires_approval ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}>
                          {p.requires_approval ? 'Requiere aprobación' : 'Automático'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin patrones configurados</p>
                )}

                {/* New Pattern Form */}
                {showNewPattern && (
                  <Card className="mt-3">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Fase</Label>
                          <Select value={newPattern.phase_id} onValueChange={(v) => setNewPattern({ ...newPattern, phase_id: v })}>
                            <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                            <SelectContent>
                              {phases?.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Días después</Label>
                          <Input
                            type="number"
                            min={1}
                            value={newPattern.days_after_phase_start}
                            onChange={(e) => setNewPattern({ ...newPattern, days_after_phase_start: parseInt(e.target.value) || 1 })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Canal</Label>
                          <Select value={newPattern.channel} onValueChange={(v) => setNewPattern({ ...newPattern, channel: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="whatsapp">WhatsApp</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="llamada">Llamada</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Tipo de acción</Label>
                          <Select value={newPattern.action_type} onValueChange={(v) => setNewPattern({ ...newPattern, action_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mensaje">Mensaje</SelectItem>
                              <SelectItem value="recordatorio">Recordatorio</SelectItem>
                              <SelectItem value="seguimiento">Seguimiento</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Plantilla del mensaje</Label>
                        <Textarea
                          value={newPattern.message_template}
                          onChange={(e) => setNewPattern({ ...newPattern, message_template: e.target.value })}
                          placeholder="Hola {nombre}, queremos saber cómo te encuentras..."
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={newPattern.requires_approval}
                          onCheckedChange={(v) => setNewPattern({ ...newPattern, requires_approval: v })}
                        />
                        <Label className="text-xs">Requiere aprobación antes de enviar</Label>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => setShowNewPattern(false)}>Cancelar</Button>
                        <Button size="sm" onClick={handleCreatePattern} disabled={createPattern.isPending}>Guardar</Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
