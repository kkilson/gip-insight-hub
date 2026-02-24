import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreatableComboboxProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  onCreateOption?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CreatableCombobox({ value, onChange, options, onCreateOption, placeholder = 'Escribir o seleccionar...', className }: CreatableComboboxProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [confirmNew, setConfirmNew] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setInputValue(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmNew(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter(o => o.toLowerCase().includes(inputValue.toLowerCase()));
  const exactMatch = options.some(o => o.toLowerCase() === inputValue.toLowerCase());
  const isDuplicate = exactMatch && inputValue.toLowerCase() !== value.toLowerCase();
  const showCreateOption = inputValue.trim() && !exactMatch;

  const selectOption = (opt: string) => {
    onChange(opt);
    setInputValue(opt);
    setOpen(false);
    setConfirmNew(false);
  };

  const handleCreateConfirm = () => {
    onCreateOption?.(inputValue.trim());
    onChange(inputValue.trim());
    setOpen(false);
    setConfirmNew(false);
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <Input
        value={inputValue}
        onChange={e => {
          setInputValue(e.target.value);
          setOpen(true);
          setConfirmNew(false);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        className="h-8"
      />
      {open && (filtered.length > 0 || showCreateOption) && (
        <div className="absolute z-50 mt-1 w-full bg-popover border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
          {filtered.map(opt => (
            <button
              key={opt}
              type="button"
              className={cn(
                'w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2',
                opt === value && 'bg-accent'
              )}
              onClick={() => selectOption(opt)}
            >
              {opt === value && <Check className="h-3 w-3" />}
              <span className={opt === value ? '' : 'ml-5'}>{opt}</span>
            </button>
          ))}
          {isDuplicate && (
            <div className="px-3 py-2 text-xs text-destructive">Ya existe esta opción</div>
          )}
          {showCreateOption && !confirmNew && (
            <button
              type="button"
              className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 text-primary border-t"
              onClick={() => setConfirmNew(true)}
            >
              <Plus className="h-3 w-3" />
              Crear "{inputValue.trim()}"
            </button>
          )}
          {showCreateOption && confirmNew && (
            <div className="px-3 py-2 border-t space-y-2">
              <p className="text-xs text-muted-foreground">¿Crear "{inputValue.trim()}" como nueva opción?</p>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" className="h-6 text-xs" onClick={() => setConfirmNew(false)}>Cancelar</Button>
                <Button type="button" size="sm" className="h-6 text-xs" onClick={handleCreateConfirm}>Confirmar</Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
