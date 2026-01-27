import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function Renewals() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Renovaciones</h1>
          <p className="text-muted-foreground">Gestiona las pólizas próximas a vencer</p>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por cliente o póliza..." className="pl-10" />
      </div>

      {/* Empty state */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-info/10 rounded-full flex items-center justify-center mb-4">
            <RefreshCw className="h-8 w-8 text-info" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No hay renovaciones próximas</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            Las renovaciones aparecerán aquí 30 días antes del vencimiento de cada póliza.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
