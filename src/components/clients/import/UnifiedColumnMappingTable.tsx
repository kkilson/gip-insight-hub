import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { ParsedRow } from './types';
import type { UnifiedColumnMapping, FieldGroup } from './unifiedTypes';
import { UNIFIED_DB_FIELDS, getFieldsByGroup } from './unifiedTypes';
import { FileText, User, Users } from 'lucide-react';

interface UnifiedColumnMappingTableProps {
  headers: string[];
  rawData: ParsedRow[];
  columnMappings: UnifiedColumnMapping[];
  onUpdateMapping: (excelColumn: string, dbField: string | null, beneficiaryIndex: number | null) => void;
}

const GROUP_LABELS: Record<FieldGroup, { label: string; icon: React.ReactNode }> = {
  policy: { label: 'Póliza', icon: <FileText className="h-3 w-3" /> },
  client: { label: 'Tomador', icon: <User className="h-3 w-3" /> },
  beneficiary: { label: 'Beneficiario', icon: <Users className="h-3 w-3" /> },
};

export function UnifiedColumnMappingTable({
  headers,
  rawData,
  columnMappings,
  onUpdateMapping,
}: UnifiedColumnMappingTableProps) {
  const handleSelectChange = (excelColumn: string, value: string) => {
    if (value === 'none') {
      onUpdateMapping(excelColumn, null, null);
      return;
    }
    
    // Parse the value - format: "field" or "field:index" for beneficiary fields
    const [field, indexStr] = value.split(':');
    const beneficiaryIndex = indexStr ? parseInt(indexStr) : null;
    
    onUpdateMapping(excelColumn, field, beneficiaryIndex);
  };

  const getCurrentValue = (mapping: UnifiedColumnMapping | undefined): string => {
    if (!mapping?.dbField) return 'none';
    if (mapping.beneficiaryIndex !== null) {
      return `${mapping.dbField}:${mapping.beneficiaryIndex}`;
    }
    return mapping.dbField;
  };

  const getMappingBadge = (mapping: UnifiedColumnMapping | undefined) => {
    if (!mapping?.dbField) return null;
    
    const field = UNIFIED_DB_FIELDS.find(f => f.value === mapping.dbField);
    if (!field) return null;
    
    const groupInfo = GROUP_LABELS[field.group];
    const variant = field.group === 'policy' ? 'default' : field.group === 'client' ? 'secondary' : 'outline';
    
    return (
      <Badge variant={variant} className="ml-2 text-xs flex items-center gap-1">
        {groupInfo.icon}
        {groupInfo.label}
        {mapping.beneficiaryIndex !== null && ` ${mapping.beneficiaryIndex}`}
      </Badge>
    );
  };

  // Generate beneficiary options for indices 1-5
  const beneficiaryIndices = [1, 2, 3, 4, 5];
  const beneficiaryFields = getFieldsByGroup('beneficiary');

  return (
    <ScrollArea className="h-[350px] rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Columna Excel</TableHead>
            <TableHead className="w-[150px]">Ejemplo</TableHead>
            <TableHead>Campo del sistema</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {headers.map((header) => {
            const mapping = columnMappings.find((m) => m.excelColumn === header);
            const sampleValue = rawData[0]?.[header];

            return (
              <TableRow key={header}>
                <TableCell className="font-medium">
                  {header}
                  {getMappingBadge(mapping)}
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[150px] truncate">
                  {sampleValue !== null && sampleValue !== undefined ? String(sampleValue) : '-'}
                </TableCell>
                <TableCell>
                  <Select
                    value={getCurrentValue(mapping)}
                    onValueChange={(value) => handleSelectChange(header, value)}
                  >
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="No importar" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      <SelectItem value="none">No importar</SelectItem>
                      
                      {/* Policy fields */}
                      <SelectGroup>
                        <SelectLabel className="flex items-center gap-2">
                          <FileText className="h-3 w-3" />
                          Póliza
                        </SelectLabel>
                        {getFieldsByGroup('policy').map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label} {field.required && '*'}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      
                      {/* Client fields */}
                      <SelectGroup>
                        <SelectLabel className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          Tomador
                        </SelectLabel>
                        {getFieldsByGroup('client').map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label} {field.required && '*'}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                      
                      {/* Beneficiary fields - with index */}
                      {beneficiaryIndices.map((index) => (
                        <SelectGroup key={`ben-${index}`}>
                          <SelectLabel className="flex items-center gap-2">
                            <Users className="h-3 w-3" />
                            Beneficiario {index}
                          </SelectLabel>
                          {beneficiaryFields.map((field) => (
                            <SelectItem 
                              key={`${field.value}:${index}`} 
                              value={`${field.value}:${index}`}
                            >
                              {field.label} {index}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
