import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
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
import type { ColumnMapping, DBField, ParsedRow } from './types';

interface ColumnMappingTableProps {
  headers: string[];
  rawData: ParsedRow[];
  columnMappings: ColumnMapping[];
  dbFields: DBField[];
  onUpdateMapping: (excelColumn: string, dbField: string | null) => void;
}

export function ColumnMappingTable({
  headers,
  rawData,
  columnMappings,
  dbFields,
  onUpdateMapping,
}: ColumnMappingTableProps) {
  return (
    <ScrollArea className="h-[300px] rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Columna Excel</TableHead>
            <TableHead>Ejemplo</TableHead>
            <TableHead>Campo del sistema</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {headers.map((header) => {
            const mapping = columnMappings.find((m) => m.excelColumn === header);
            const sampleValue = rawData[0]?.[header];

            return (
              <TableRow key={header}>
                <TableCell className="font-medium">{header}</TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {sampleValue !== null && sampleValue !== undefined ? String(sampleValue) : '-'}
                </TableCell>
                <TableCell>
                  <Select
                    value={mapping?.dbField || 'none'}
                    onValueChange={(value) => onUpdateMapping(header, value === 'none' ? null : value)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="No importar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No importar</SelectItem>
                      {dbFields.map((field) => (
                        <SelectItem key={field.value} value={field.value}>
                          {field.label} {field.required && '*'}
                        </SelectItem>
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
