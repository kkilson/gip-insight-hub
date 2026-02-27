import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Settings2, Save, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BatchConfig {
  selectedInsurers: string[];
  selectedAdvisors: string[];
  defaultCurrency: 'USD' | 'BS';
}

const STORAGE_KEY = 'kover-batch-config';

function loadConfig(): BatchConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { selectedInsurers: [], selectedAdvisors: [], defaultCurrency: 'USD' };
}

function saveConfig(config: BatchConfig) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

interface Props {
  onConfigChange?: (config: BatchConfig) => void;
}

export function BatchConfigPanel({ onConfigChange }: Props) {
  const [config, setConfig] = useState<BatchConfig>(loadConfig);
  const { toast } = useToast();

  const { data: insurers } = useQuery({
    queryKey: ['insurers-list'],
    queryFn: async () => {
      const { data } = await supabase.from('insurers').select('id, name').eq('is_active', true).order('name');
      return data || [];
    },
  });

  const { data: advisors } = useQuery({
    queryKey: ['advisors-list'],
    queryFn: async () => {
      const { data } = await supabase.from('advisors').select('id, full_name').eq('is_active', true).order('full_name');
      return data || [];
    },
  });

  useEffect(() => {
    onConfigChange?.(config);
  }, [config, onConfigChange]);

  const toggleInsurer = (id: string) => {
    setConfig(prev => ({
      ...prev,
      selectedInsurers: prev.selectedInsurers.includes(id)
        ? prev.selectedInsurers.filter(x => x !== id)
        : [...prev.selectedInsurers, id],
    }));
  };

  const toggleAdvisor = (id: string) => {
    setConfig(prev => ({
      ...prev,
      selectedAdvisors: prev.selectedAdvisors.includes(id)
        ? prev.selectedAdvisors.filter(x => x !== id)
        : [...prev.selectedAdvisors, id],
    }));
  };

  const handleSave = () => {
    saveConfig(config);
    toast({ title: 'Configuración guardada' });
  };

  const selectAllInsurers = () => {
    setConfig(prev => ({ ...prev, selectedInsurers: insurers?.map(i => i.id) || [] }));
  };

  const selectAllAdvisors = () => {
    setConfig(prev => ({ ...prev, selectedAdvisors: advisors?.map(a => a.id) || [] }));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Configuración de Carga
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currency */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Moneda predeterminada</Label>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={config.defaultCurrency === 'USD' ? 'default' : 'outline'}
              onClick={() => setConfig(prev => ({ ...prev, defaultCurrency: 'USD' }))}
            >
              USD — Dólares
            </Button>
            <Button
              size="sm"
              variant={config.defaultCurrency === 'BS' ? 'default' : 'outline'}
              onClick={() => setConfig(prev => ({ ...prev, defaultCurrency: 'BS' }))}
            >
              BS — Bolívares
            </Button>
          </div>
        </div>

        {/* Insurers */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Aseguradoras</Label>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={selectAllInsurers}>
              Seleccionar todas
            </Button>
          </div>
          <ScrollArea className="h-32 border rounded-md p-2">
            <div className="space-y-1.5">
              {insurers?.map(ins => (
                <label key={ins.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                  <Checkbox
                    checked={config.selectedInsurers.includes(ins.id)}
                    onCheckedChange={() => toggleInsurer(ins.id)}
                  />
                  {ins.name}
                </label>
              ))}
            </div>
          </ScrollArea>
          {config.selectedInsurers.length > 0 && (
            <p className="text-xs text-muted-foreground">{config.selectedInsurers.length} seleccionadas</p>
          )}
        </div>

        {/* Advisors */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Asesores</Label>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={selectAllAdvisors}>
              Seleccionar todos
            </Button>
          </div>
          <ScrollArea className="h-32 border rounded-md p-2">
            <div className="space-y-1.5">
              {advisors?.map(adv => (
                <label key={adv.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 rounded px-1 py-0.5">
                  <Checkbox
                    checked={config.selectedAdvisors.includes(adv.id)}
                    onCheckedChange={() => toggleAdvisor(adv.id)}
                  />
                  {adv.full_name}
                </label>
              ))}
            </div>
          </ScrollArea>
          {config.selectedAdvisors.length > 0 && (
            <p className="text-xs text-muted-foreground">{config.selectedAdvisors.length} seleccionados</p>
          )}
        </div>

        <Button onClick={handleSave} className="w-full">
          <Save className="h-4 w-4 mr-2" />
          Guardar Configuración
        </Button>
      </CardContent>
    </Card>
  );
}

export { loadConfig };
