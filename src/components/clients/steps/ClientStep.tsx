import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from 'lucide-react';
import { format } from 'date-fns';
import type { ClientFormData } from '../types';

interface ClientStepProps {
  data: ClientFormData | null;
  onChange: (data: ClientFormData) => void;
}

const provinces = [
  'Azuay', 'Bolívar', 'Cañar', 'Carchi', 'Chimborazo', 'Cotopaxi',
  'El Oro', 'Esmeraldas', 'Galápagos', 'Guayas', 'Imbabura', 'Loja',
  'Los Ríos', 'Manabí', 'Morona Santiago', 'Napo', 'Orellana', 'Pastaza',
  'Pichincha', 'Santa Elena', 'Santo Domingo', 'Sucumbíos', 'Tungurahua', 'Zamora Chinchipe',
];

export function ClientStep({ data, onChange }: ClientStepProps) {
  const formData: ClientFormData = data || {
    identification_type: 'cedula',
    identification_number: '',
    first_name: '',
    last_name: '',
  };

  const updateField = <K extends keyof ClientFormData>(
    field: K,
    value: ClientFormData[K]
  ) => {
    onChange({ ...formData, [field]: value });
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-primary mb-4">
        <User className="h-5 w-5" />
        <h3 className="font-semibold">Datos del Tomador</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Identification */}
        <div className="space-y-2">
          <Label htmlFor="identification_type">Tipo de identificación *</Label>
          <Select
            value={formData.identification_type}
            onValueChange={(v) => updateField('identification_type', v as ClientFormData['identification_type'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cedula">Cédula</SelectItem>
              <SelectItem value="pasaporte">Pasaporte</SelectItem>
              <SelectItem value="ruc">RUC</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="identification_number">Número de identificación *</Label>
          <Input
            id="identification_number"
            value={formData.identification_number}
            onChange={(e) => updateField('identification_number', e.target.value)}
            placeholder="Ej: 1712345678"
            maxLength={20}
          />
        </div>

        {/* Names */}
        <div className="space-y-2">
          <Label htmlFor="first_name">Nombres *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => updateField('first_name', e.target.value)}
            placeholder="Nombres completos"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Apellidos *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => updateField('last_name', e.target.value)}
            placeholder="Apellidos completos"
            maxLength={100}
          />
        </div>

        {/* Contact */}
        <div className="space-y-2">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            value={formData.email || ''}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="correo@ejemplo.com"
            maxLength={255}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono fijo</Label>
          <Input
            id="phone"
            value={formData.phone || ''}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="02-1234567"
            maxLength={20}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile">Celular</Label>
          <Input
            id="mobile"
            value={formData.mobile || ''}
            onChange={(e) => updateField('mobile', e.target.value)}
            placeholder="0991234567"
            maxLength={20}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="birth_date">Fecha de nacimiento</Label>
          <Input
            id="birth_date"
            type="date"
            value={formData.birth_date || ''}
            onChange={(e) => updateField('birth_date', e.target.value || undefined)}
            max={format(new Date(), 'yyyy-MM-dd')}
          />
        </div>

        {/* Address */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={formData.address || ''}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Calle principal y secundaria, número"
            maxLength={255}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">Ciudad</Label>
          <Input
            id="city"
            value={formData.city || ''}
            onChange={(e) => updateField('city', e.target.value)}
            placeholder="Ej: Quito"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="province">Provincia</Label>
          <Select
            value={formData.province || ''}
            onValueChange={(v) => updateField('province', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar provincia" />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Work info */}
        <div className="space-y-2">
          <Label htmlFor="occupation">Ocupación</Label>
          <Input
            id="occupation"
            value={formData.occupation || ''}
            onChange={(e) => updateField('occupation', e.target.value)}
            placeholder="Profesión u ocupación"
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="workplace">Lugar de trabajo</Label>
          <Input
            id="workplace"
            value={formData.workplace || ''}
            onChange={(e) => updateField('workplace', e.target.value)}
            placeholder="Empresa o institución"
            maxLength={150}
          />
        </div>

        {/* Notes */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Observaciones adicionales sobre el cliente"
            rows={3}
            maxLength={500}
          />
        </div>
      </div>
    </div>
  );
}
