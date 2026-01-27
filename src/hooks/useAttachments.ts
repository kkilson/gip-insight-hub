import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  entity_type: 'client' | 'policy' | 'beneficiary';
  entity_id: string;
  created_at: string;
}

interface UseAttachmentsOptions {
  entityType: 'client' | 'policy' | 'beneficiary';
  entityId?: string;
}

export function useAttachments({ entityType, entityId }: UseAttachmentsOptions) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['attachments', entityType, entityId],
    queryFn: async () => {
      if (!entityId) return [];
      
      const { data, error } = await supabase
        .from('attachments')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Attachment[];
    },
    enabled: !!entityId,
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, entityId: targetEntityId }: { file: File; entityId: string }) => {
      setUploading(true);
      
      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${entityType}/${targetEntityId}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Save to attachments table
      const { data, error: insertError } = await supabase
        .from('attachments')
        .insert({
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          file_type: file.type,
          entity_type: entityType,
          entity_id: targetEntityId,
          uploaded_by: user?.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: 'Archivo subido',
        description: 'El archivo se ha subido correctamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al subir archivo',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (attachment: Attachment) => {
      // Delete from storage
      const { error: deleteStorageError } = await supabase.storage
        .from('attachments')
        .remove([attachment.file_path]);

      if (deleteStorageError) throw deleteStorageError;

      // Delete from database
      const { error: deleteDbError } = await supabase
        .from('attachments')
        .delete()
        .eq('id', attachment.id);

      if (deleteDbError) throw deleteDbError;
    },
    onSuccess: () => {
      toast({
        title: 'Archivo eliminado',
        description: 'El archivo se ha eliminado correctamente.',
      });
      queryClient.invalidateQueries({ queryKey: ['attachments', entityType, entityId] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al eliminar archivo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const downloadFile = useCallback(async (attachment: Attachment) => {
    try {
      const { data, error } = await supabase.storage
        .from('attachments')
        .download(attachment.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      toast({
        title: 'Error al descargar',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  const getPreviewUrl = useCallback(async (attachment: Attachment) => {
    const { data } = await supabase.storage
      .from('attachments')
      .createSignedUrl(attachment.file_path, 3600); // 1 hour expiry
    
    return data?.signedUrl;
  }, []);

  return {
    attachments,
    isLoading,
    uploading,
    uploadFile: uploadMutation.mutate,
    deleteFile: deleteMutation.mutate,
    downloadFile,
    getPreviewUrl,
    isDeleting: deleteMutation.isPending,
  };
}
