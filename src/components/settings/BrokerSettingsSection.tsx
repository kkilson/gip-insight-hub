import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useBrokerSettings } from '@/hooks/useBrokerSettings';
import { Building2, Upload, Loader2, Save, ImageIcon } from 'lucide-react';

export function BrokerSettingsSection() {
  const { settings, isLoading, updateSettings, uploadLogo } = useBrokerSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    identification: '',
    phone: '',
    email: '',
    address: '',
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Update form when settings load
  useEffect(() => {
    if (settings) {
      setFormData({
        name: settings.name || '',
        identification: settings.identification || '',
        phone: settings.phone || '',
        email: settings.email || '',
        address: settings.address || '',
      });
    }
  }, [settings]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateSettings.mutate({
      name: formData.name,
      identification: formData.identification || null,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
    }, {
      onSuccess: () => setHasChanges(false),
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('El logo no puede superar 2MB');
        return;
      }
      uploadLogo.mutate(file);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-accent" />
          <CardTitle>Datos del Corretaje</CardTitle>
        </div>
        <CardDescription>
          Configura la información que aparecerá en los documentos generados (Aviso de Prima, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Section */}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center gap-3">
            <div className="w-32 h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Logo del corretaje"
                  className="w-full h-full object-contain"
                />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadLogo.isPending}
            >
              {uploadLogo.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {settings?.logo_url ? 'Cambiar logo' : 'Subir logo'}
            </Button>
            <p className="text-xs text-muted-foreground">PNG, JPG o WEBP. Máx 2MB</p>
          </div>

          {/* Form Fields */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="broker-name">Nombre del Corretaje *</Label>
              <Input
                id="broker-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Ej: GIP Asesores Integrales"
              />
            </div>
            <div>
              <Label htmlFor="broker-identification">RIF / Identificación</Label>
              <Input
                id="broker-identification"
                value={formData.identification}
                onChange={(e) => handleInputChange('identification', e.target.value)}
                placeholder="Ej: J-12345678-9"
              />
            </div>
            <div>
              <Label htmlFor="broker-phone">Teléfono</Label>
              <Input
                id="broker-phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Ej: +58 212 123 4567"
              />
            </div>
            <div>
              <Label htmlFor="broker-email">Correo Electrónico</Label>
              <Input
                id="broker-email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Ej: info@gip.com"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="broker-address">Dirección</Label>
              <Textarea
                id="broker-address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Dirección completa del corretaje"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateSettings.isPending || !formData.name}
          >
            {updateSettings.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Guardar cambios
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
