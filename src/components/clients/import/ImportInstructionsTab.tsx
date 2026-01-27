import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Building2, 
  Package, 
  CreditCard, 
  Users, 
  FileSpreadsheet,
  CheckCircle2,
  Info
} from 'lucide-react';

interface InstructionsProps {
  insurers: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; insurer_id: string | null }>;
}

// Payment frequencies supported
const PAYMENT_FREQUENCIES = [
  { value: 'mensual', label: 'Mensual' },
  { value: 'mensual_10_cuotas', label: 'Mensual 10 cuotas' },
  { value: 'mensual_12_cuotas', label: 'Mensual 12 cuotas' },
  { value: 'bimensual', label: 'Bimensual' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
];

// Policy statuses
const POLICY_STATUSES = [
  { value: 'vigente', label: 'Vigente' },
  { value: 'en_tramite', label: 'En Trámite' },
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'cancelada', label: 'Cancelada' },
  { value: 'vencida', label: 'Vencida' },
];

// Relationship types
const RELATIONSHIPS = [
  { value: 'conyuge', label: 'Cónyuge' },
  { value: 'hijo', label: 'Hijo/a' },
  { value: 'padre', label: 'Padre' },
  { value: 'madre', label: 'Madre' },
  { value: 'hermano', label: 'Hermano/a' },
  { value: 'tomador_titular', label: 'Tomador/Titular' },
  { value: 'otro', label: 'Otro' },
];

// Identification types
const ID_TYPES = [
  { value: 'cedula', label: 'Cédula' },
  { value: 'pasaporte', label: 'Pasaporte' },
  { value: 'rif', label: 'RIF' },
  { value: 'otro', label: 'Otro' },
];

export function ImportInstructionsTab({ insurers, products }: InstructionsProps) {
  // Group products by insurer for display
  const productsByInsurer = insurers.map(insurer => ({
    insurer,
    products: products.filter(p => p.insurer_id === insurer.id)
  })).filter(group => group.products.length > 0);

  return (
    <ScrollArea className="h-[60vh] pr-4">
      <div className="space-y-6">
        {/* General instructions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Instrucciones Generales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p>El <strong>número de póliza</strong> es el identificador único. Cada fila debe tener uno.</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p>Las fechas deben estar en formato <code className="bg-muted px-1 rounded">AAAA-MM-DD</code> (ej: 2024-01-15) o <code className="bg-muted px-1 rounded">DD/MM/AAAA</code></p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p>Puedes incluir hasta <strong>7 beneficiarios</strong> por póliza con columnas numeradas (Ben. 1, Ben. 2, etc.)</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <p>Si el tomador (por cédula) o la póliza ya existen, se reutilizarán o actualizarán.</p>
            </div>
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-muted-foreground">Los valores deben coincidir exactamente con las opciones listadas abajo (mayúsculas/minúsculas no importan).</p>
            </div>
          </CardContent>
        </Card>

        {/* Insurers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Aseguradoras Disponibles ({insurers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {insurers.map(insurer => (
                <Badge key={insurer.id} variant="secondary" className="text-xs">
                  {insurer.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Products by Insurer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              Productos por Aseguradora
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {productsByInsurer.map(({ insurer, products: insurerProducts }) => (
              <div key={insurer.id}>
                <p className="text-sm font-medium mb-2">{insurer.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {insurerProducts.map(product => (
                    <Badge key={product.id} variant="outline" className="text-xs font-normal">
                      {product.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            {productsByInsurer.length === 0 && (
              <p className="text-sm text-muted-foreground">No hay productos configurados</p>
            )}
          </CardContent>
        </Card>

        {/* Payment Frequencies */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Frecuencias de Pago
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_FREQUENCIES.map(freq => (
                <div key={freq.value} className="flex items-center gap-2 text-sm">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{freq.value}</code>
                  <span className="text-muted-foreground">→</span>
                  <span>{freq.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Policy Statuses */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
              Estados de Póliza
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {POLICY_STATUSES.map(status => (
                <div key={status.value} className="flex items-center gap-1.5 text-sm bg-muted rounded-md px-2 py-1">
                  <code className="text-xs">{status.value}</code>
                  <span className="text-muted-foreground">({status.label})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Relationships */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Parentescos de Beneficiarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {RELATIONSHIPS.map(rel => (
                <div key={rel.value} className="flex items-center gap-2 text-sm">
                  <code className="bg-muted px-1.5 py-0.5 rounded text-xs">{rel.value}</code>
                  <span className="text-muted-foreground">→</span>
                  <span>{rel.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Identification Types */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Tipos de Identificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ID_TYPES.map(type => (
                <div key={type.value} className="flex items-center gap-1.5 text-sm bg-muted rounded-md px-2 py-1">
                  <code className="text-xs">{type.value}</code>
                  <span className="text-muted-foreground">({type.label})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Column naming tips */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              Nombres de Columnas Recomendados
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-3">
            <div>
              <p className="font-medium mb-1">Póliza:</p>
              <p className="text-muted-foreground text-xs">
                Número Póliza, Aseguradora, Producto, Fecha Inicio, Fecha Fin, Prima, Estado, Frecuencia Pago, Fecha Pago Prima
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Tomador:</p>
              <p className="text-muted-foreground text-xs">
                Cédula Tomador, Nombres Tomador, Apellidos Tomador, Email Tomador, Teléfono Tomador, F.Nac Tomador
              </p>
            </div>
            <div>
              <p className="font-medium mb-1">Beneficiarios (1-7):</p>
              <p className="text-muted-foreground text-xs">
                Nombre Ben. 1, Apellido Ben. 1, Parentesco 1, Cédula Ben. 1, F.Nac Ben. 1, Tel Ben. 1, Email Ben. 1
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
