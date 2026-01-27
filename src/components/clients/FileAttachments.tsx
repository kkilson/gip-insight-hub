import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  Download, 
  Trash2, 
  Eye, 
  Loader2,
  Paperclip
} from 'lucide-react';
import { useAttachments, type Attachment } from '@/hooks/useAttachments';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface FileAttachmentsProps {
  entityType: 'client' | 'policy' | 'beneficiary';
  entityId?: string;
  title?: string;
  disabled?: boolean;
}

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return Image;
  if (fileType.includes('pdf')) return FileText;
  return File;
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function FileAttachments({ 
  entityType, 
  entityId, 
  title = 'Archivos adjuntos',
  disabled = false 
}: FileAttachmentsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');
  const [previewType, setPreviewType] = useState<string>('');

  const {
    attachments,
    isLoading,
    uploading,
    uploadFile,
    deleteFile,
    downloadFile,
    getPreviewUrl,
    isDeleting,
  } = useAttachments({ entityType, entityId });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !entityId) return;

    for (const file of Array.from(files)) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        continue;
      }
      uploadFile({ file, entityId });
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePreview = async (attachment: Attachment) => {
    const url = await getPreviewUrl(attachment);
    if (url) {
      setPreviewUrl(url);
      setPreviewName(attachment.file_name);
      setPreviewType(attachment.file_type);
    }
  };

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      deleteFile(deleteTarget);
      setDeleteTarget(null);
    }
  };

  if (!entityId) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <Paperclip className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            Los archivos adjuntos estarán disponibles después de guardar el registro.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="h-4 w-4" />
          {title}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Upload className="h-4 w-4 mr-1" />
          )}
          Subir archivo
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : attachments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-6 text-center">
            <File className="h-8 w-8 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No hay archivos adjuntos
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => {
            const FileIcon = getFileIcon(attachment.file_type);
            const isImage = attachment.file_type.startsWith('image/');
            const isPdf = attachment.file_type.includes('pdf');

            return (
              <Card key={attachment.id} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    <FileIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {attachment.file_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.file_size)} • {formatDistanceToNow(new Date(attachment.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {(isImage || isPdf) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handlePreview(attachment)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => downloadFile(attachment)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(attachment)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar archivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El archivo "{deleteTarget?.file_name}" será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center overflow-auto max-h-[70vh]">
            {previewType.startsWith('image/') ? (
              <img
                src={previewUrl || ''}
                alt={previewName}
                className="max-w-full max-h-full object-contain"
              />
            ) : previewType.includes('pdf') ? (
              <iframe
                src={previewUrl || ''}
                className="w-full h-[70vh]"
                title={previewName}
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
