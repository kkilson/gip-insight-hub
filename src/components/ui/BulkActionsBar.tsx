import { Button } from '@/components/ui/button';
import { Trash2, X, Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export interface BulkAction {
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
  onClick: () => void;
  /** If true, will show confirmation dialog */
  confirm?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
}

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  actions: BulkAction[];
}

export function BulkActionsBar({ selectedCount, onClear, actions }: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-50 flex justify-center">
      <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-lg px-4 py-3 shadow-lg border">
        <span className="text-sm font-medium whitespace-nowrap">
          {selectedCount} seleccionado{selectedCount !== 1 ? 's' : ''}
        </span>
        <div className="h-4 w-px bg-primary-foreground/30" />
        <div className="flex items-center gap-2">
          {actions.map((action, i) =>
            action.confirm ? (
              <AlertDialog key={i}>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
                    className="gap-1.5"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{action.confirmTitle || '¿Confirmar acción?'}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {action.confirmDescription || `Esta acción afectará ${selectedCount} registro${selectedCount !== 1 ? 's' : ''}. No se puede deshacer.`}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={action.onClick}>Confirmar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                key={i}
                size="sm"
                variant={action.variant === 'destructive' ? 'destructive' : 'secondary'}
                className="gap-1.5"
                onClick={action.onClick}
              >
                {action.icon}
                {action.label}
              </Button>
            )
          )}
        </div>
        <div className="h-4 w-px bg-primary-foreground/30" />
        <Button
          size="sm"
          variant="ghost"
          className="text-primary-foreground hover:text-primary-foreground/80 hover:bg-primary-foreground/10 gap-1"
          onClick={onClear}
        >
          <X className="h-3.5 w-3.5" />
          Limpiar
        </Button>
      </div>
    </div>
  );
}
