import { Card, CardContent } from '@/components/ui/card';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Templates() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Plantillas</h1>
          <p className="text-muted-foreground">Gestiona las plantillas de mensajes para WhatsApp y correo</p>
        </div>
        <Button size="sm" className="bg-accent hover:bg-accent/90">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {/* Empty state */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No hay plantillas creadas</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-4">
            Crea plantillas personalizadas para tus comunicaciones con clientes.
          </p>
          <Button className="bg-accent hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            Crear Primera Plantilla
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
