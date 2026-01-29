import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BrokerSettings {
  id: string;
  name: string;
  identification: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export function useBrokerSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['broker-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broker_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as BrokerSettings | null;
    },
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<Omit<BrokerSettings, 'id' | 'created_at' | 'updated_at'>>) => {
      if (!settings?.id) {
        // Insert if no settings exist
        const { data, error } = await supabase
          .from('broker_settings')
          .insert(updates)
          .select()
          .single();

        if (error) throw error;
        return data;
      }

      // Update existing settings
      const { data, error } = await supabase
        .from('broker_settings')
        .update(updates)
        .eq('id', settings.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-settings'] });
      toast({
        title: 'Configuración guardada',
        description: 'Los datos del corretaje se han actualizado correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error updating broker settings:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la configuración.',
        variant: 'destructive',
      });
    },
  });

  const uploadLogo = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo.${fileExt}`;
      const filePath = fileName;

      // Delete existing logo if any
      if (settings?.logo_url) {
        const existingPath = settings.logo_url.split('/').pop();
        if (existingPath) {
          await supabase.storage.from('broker-assets').remove([existingPath]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from('broker-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('broker-assets')
        .getPublicUrl(filePath);

      // Update settings with new logo URL
      const { data, error: updateError } = await supabase
        .from('broker_settings')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', settings?.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broker-settings'] });
      toast({
        title: 'Logo actualizado',
        description: 'El logo del corretaje se ha subido correctamente.',
      });
    },
    onError: (error) => {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Error',
        description: 'No se pudo subir el logo.',
        variant: 'destructive',
      });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    uploadLogo,
  };
}

// Helper function to convert image URL to base64 for PDF generation
export async function getLogoBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting logo to base64:', error);
    return null;
  }
}
