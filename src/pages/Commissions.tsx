import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CommissionDashboard } from '@/components/commissions/CommissionDashboard';
import { BatchLoadTab } from '@/components/commissions/BatchLoadTab';
import { VerifyTab } from '@/components/commissions/VerifyTab';
import { AssignTab } from '@/components/commissions/AssignTab';
import { BreakdownTab } from '@/components/commissions/BreakdownTab';
import { RulesTab } from '@/components/commissions/RulesTab';

export default function Commissions() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comisiones</h1>
        <p className="text-muted-foreground">Carga, verifica, asigna y desglosa comisiones por asesor</p>
      </div>

      <CommissionDashboard />

      <Tabs defaultValue="load" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="load">Cargar Lote</TabsTrigger>
          <TabsTrigger value="verify">Verificar</TabsTrigger>
          <TabsTrigger value="assign">Asignar</TabsTrigger>
          <TabsTrigger value="breakdown">Desglose</TabsTrigger>
          <TabsTrigger value="rules">Reglas</TabsTrigger>
        </TabsList>

        <TabsContent value="load"><BatchLoadTab /></TabsContent>
        <TabsContent value="verify"><VerifyTab /></TabsContent>
        <TabsContent value="assign"><AssignTab /></TabsContent>
        <TabsContent value="breakdown"><BreakdownTab /></TabsContent>
        <TabsContent value="rules"><RulesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
