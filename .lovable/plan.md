
# Plan: Importación Unificada con Número de Póliza como Identificador Único

## Resumen

Rediseñar el sistema de importación masiva para usar una **sola hoja de Excel** donde el **número de póliza** actúa como identificador único. Cada fila del Excel representará una póliza completa con los datos del tomador y opcionalmente múltiples beneficiarios.

## Estructura Propuesta del Excel

```text
+----------------+------------------+------------------+------------------+
|   PÓLIZA       |    TOMADOR       |  BENEFICIARIO 1  |  BENEFICIARIO 2  |
|  (Columnas)    |   (Columnas)     |   (Columnas)     |   (Columnas)     |
+----------------+------------------+------------------+------------------+
| Número Póliza  | Cédula Tomador   | Nombre Ben. 1    | Nombre Ben. 2    |
| Aseguradora    | Nombres          | Apellido Ben. 1  | Apellido Ben. 2  |
| Producto       | Apellidos        | Parentesco 1     | Parentesco 2     |
| Fecha Inicio   | Email            | Cédula Ben. 1    | Cédula Ben. 2    |
| Fecha Fin      | Teléfono         | ...              | ...              |
| Prima          | Ciudad           |                  |                  |
| Estado         | Estado           |                  |                  |
+----------------+------------------+------------------+------------------+
```

## Lógica de Procesamiento

1. **Número de Póliza como clave principal**
   - Agrupa filas con el mismo número de póliza
   - Detecta automáticamente si la póliza ya existe en el sistema
   - Para pólizas existentes: solo agrega beneficiarios nuevos
   - Para pólizas nuevas: crea tomador (si no existe), póliza y beneficiarios

2. **Detección Inteligente de Tomadores**
   - Busca primero por cédula del tomador
   - Si ya existe: reutiliza el registro
   - Si no existe: crea uno nuevo

3. **Manejo de Beneficiarios**
   - Soporta múltiples columnas de beneficiarios (Beneficiario 1, 2, 3, etc.)
   - Cada fila con el mismo número de póliza puede agregar beneficiarios adicionales

## Implementación Técnica

### 1. Modificar Tipos (`import/types.ts`)

```typescript
// Nueva interfaz para fila unificada
interface UnifiedImportRow {
  policy_number: string;              // CLAVE ÚNICA
  
  // Datos del Tomador
  client_identification_type?: string;
  client_identification_number: string;
  client_first_name: string;
  client_last_name: string;
  client_email?: string;
  client_phone?: string;
  client_mobile?: string;
  client_address?: string;
  client_city?: string;
  client_province?: string;
  client_birth_date?: string;
  
  // Datos de la Póliza
  insurer_name?: string;
  product_name?: string;
  start_date: string;
  end_date: string;
  status?: string;
  premium?: string;
  payment_frequency?: string;
  coverage_amount?: string;
  deductible?: string;
  premium_payment_date?: string;
  policy_notes?: string;
  
  // Datos de Beneficiarios (dinámico)
  beneficiaries: Array<{
    first_name?: string;
    last_name?: string;
    identification_type?: string;
    identification_number?: string;
    relationship?: string;
    birth_date?: string;
    phone?: string;
    email?: string;
  }>;
}

// Nuevos campos para mapeo unificado
const UNIFIED_DB_FIELDS: DBField[] = [
  // Póliza
  { value: 'policy_number', label: 'Número de Póliza', required: true, group: 'policy' },
  { value: 'insurer_name', label: 'Aseguradora', required: false, group: 'policy' },
  { value: 'product_name', label: 'Producto', required: false, group: 'policy' },
  { value: 'start_date', label: 'Fecha Inicio', required: true, group: 'policy' },
  { value: 'end_date', label: 'Fecha Renovación', required: true, group: 'policy' },
  // ... más campos de póliza
  
  // Tomador
  { value: 'client_identification_number', label: 'Cédula Tomador', required: true, group: 'client' },
  { value: 'client_first_name', label: 'Nombres Tomador', required: true, group: 'client' },
  { value: 'client_last_name', label: 'Apellidos Tomador', required: true, group: 'client' },
  // ... más campos de tomador
  
  // Beneficiarios (se detectan por patrón)
  { value: 'beneficiary_first_name', label: 'Nombres Beneficiario', required: false, group: 'beneficiary' },
  { value: 'beneficiary_last_name', label: 'Apellidos Beneficiario', required: false, group: 'beneficiary' },
  { value: 'beneficiary_relationship', label: 'Parentesco', required: false, group: 'beneficiary' },
  // ... más campos de beneficiario
];
```

### 2. Nueva Función de Auto-Mapeo (`import/utils.ts`)

```typescript
function autoMapUnifiedColumns(headers: string[]): ColumnMapping[] {
  return headers.map((header) => {
    const h = header.toLowerCase().trim();
    
    // Detectar número de beneficiario en el header (ej: "Nombre Beneficiario 1")
    const beneficiaryMatch = h.match(/beneficiario\s*(\d+)/);
    const beneficiaryIndex = beneficiaryMatch ? parseInt(beneficiaryMatch[1]) : null;
    
    // Campos de Póliza
    if (h.includes('poliza') || h.includes('póliza')) return { dbField: 'policy_number', beneficiaryIndex: null };
    if (h.includes('aseguradora')) return { dbField: 'insurer_name', beneficiaryIndex: null };
    // ... más mapeos de póliza
    
    // Campos de Tomador (buscar "tomador" en el header)
    if (h.includes('tomador') || h.includes('cliente')) {
      if (h.includes('cedula') || h.includes('cédula')) return { dbField: 'client_identification_number' };
      if (h.includes('nombre')) return { dbField: 'client_first_name' };
      if (h.includes('apellido')) return { dbField: 'client_last_name' };
      // ...
    }
    
    // Campos de Beneficiario (detectar índice)
    if (beneficiaryIndex !== null) {
      if (h.includes('nombre')) return { dbField: 'beneficiary_first_name', beneficiaryIndex };
      if (h.includes('apellido')) return { dbField: 'beneficiary_last_name', beneficiaryIndex };
      if (h.includes('parentesco')) return { dbField: 'beneficiary_relationship', beneficiaryIndex };
      // ...
    }
    
    return { excelColumn: header, dbField: null, beneficiaryIndex: null };
  });
}
```

### 3. Proceso de Validación Unificado

```typescript
function validateUnifiedImport(
  rawData: ParsedRow[],
  columnMappings: ColumnMapping[],
  existingClients: Client[],
  existingPolicies: Policy[],
  insurers: Insurer[],
  products: Product[]
): ValidatedUnifiedRow[] {
  
  // Agrupar filas por número de póliza
  const groupedByPolicy = new Map<string, ParsedRow[]>();
  
  rawData.forEach(row => {
    const policyNumber = extractField(row, columnMappings, 'policy_number');
    if (policyNumber) {
      const existing = groupedByPolicy.get(policyNumber) || [];
      existing.push(row);
      groupedByPolicy.set(policyNumber, existing);
    }
  });
  
  // Validar cada grupo
  return Array.from(groupedByPolicy.entries()).map(([policyNumber, rows]) => {
    const errors: ValidationError[] = [];
    
    // Extraer datos del tomador (de la primera fila)
    const clientData = extractClientData(rows[0], columnMappings);
    
    // Verificar si el tomador existe
    const existingClient = existingClients.find(
      c => c.identification_number === clientData.identification_number
    );
    
    // Verificar si la póliza existe
    const existingPolicy = existingPolicies.find(
      p => p.policy_number === policyNumber
    );
    
    // Extraer todos los beneficiarios de todas las filas
    const beneficiaries = rows.flatMap(row => 
      extractBeneficiaries(row, columnMappings)
    ).filter(b => b.first_name && b.last_name);
    
    // Validaciones
    if (!clientData.identification_number) {
      errors.push({ field: 'client_identification_number', message: 'Cédula requerida' });
    }
    // ... más validaciones
    
    return {
      policyNumber,
      clientData,
      policyData: extractPolicyData(rows[0], columnMappings),
      beneficiaries,
      existingClientId: existingClient?.id,
      existingPolicyId: existingPolicy?.id,
      errors,
      isValid: errors.length === 0,
      isUpdate: !!existingPolicy
    };
  });
}
```

### 4. Proceso de Importación Secuencial

```typescript
async function executeUnifiedImport(validatedRows: ValidatedUnifiedRow[]) {
  const results = { created: 0, updated: 0, failed: 0 };
  
  for (const row of validatedRows) {
    try {
      // 1. Crear o encontrar Tomador
      let clientId = row.existingClientId;
      if (!clientId) {
        const { data } = await supabase.from('clients').insert(row.clientData).select('id').single();
        clientId = data.id;
      }
      
      // 2. Crear o actualizar Póliza
      let policyId = row.existingPolicyId;
      if (policyId) {
        // Actualizar póliza existente
        await supabase.from('policies').update(row.policyData).eq('id', policyId);
        results.updated++;
      } else {
        // Crear nueva póliza
        const { data } = await supabase.from('policies')
          .insert({ ...row.policyData, client_id: clientId })
          .select('id').single();
        policyId = data.id;
        results.created++;
      }
      
      // 3. Agregar Beneficiarios
      for (const beneficiary of row.beneficiaries) {
        await supabase.from('beneficiaries').insert({
          ...beneficiary,
          policy_id: policyId
        });
      }
      
    } catch (error) {
      results.failed++;
    }
  }
  
  return results;
}
```

### 5. Interfaz Simplificada del Wizard

- **Paso 1**: Subir archivo (una sola hoja)
- **Paso 2**: Mapear columnas (agrupadas por: Póliza, Tomador, Beneficiarios)
- **Paso 3**: Vista previa agrupada por número de póliza mostrando:
  - Pólizas nuevas vs. existentes
  - Tomadores nuevos vs. existentes
  - Beneficiarios a agregar
- **Paso 4**: Ejecutar importación con resumen

### 6. Nueva Plantilla de Ejemplo

```text
| Número Póliza | Aseguradora | Producto | Fecha Inicio | Fecha Fin | Prima | Estado | Cédula Tomador | Nombres Tomador | Apellidos Tomador | Email Tomador | Teléfono Tomador | Nombre Ben. 1 | Apellido Ben. 1 | Parentesco 1 | Cédula Ben. 1 | Nombre Ben. 2 | Apellido Ben. 2 | Parentesco 2 |
|---------------|-------------|----------|--------------|-----------|-------|--------|----------------|-----------------|-------------------|---------------|------------------|---------------|-----------------|--------------|---------------|---------------|-----------------|--------------|
| POL-2024-001  | Mercantil   | Global   | 2024-01-01   | 2025-01-01| 1500  | vigente| V-12345678     | Juan            | Pérez             | juan@mail.com | 0412-1234567     | María         | Pérez           | conyuge      | V-87654321    | Carlos        | Pérez           | hijo         |
| POL-2024-002  | Seguros XYZ | Premium  | 2024-02-01   | 2025-02-01| 2000  | vigente| V-11111111     | Ana             | García            | ana@mail.com  | 0414-9876543     | Pedro         | García          | conyuge      | V-22222222    |               |                 |              |
```

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `import/types.ts` | Agregar tipos unificados, nuevos campos de mapeo |
| `import/utils.ts` | Nueva lógica de auto-mapeo, validación unificada, agrupación por póliza |
| `import/ColumnMappingTable.tsx` | Mostrar campos agrupados (Póliza, Tomador, Beneficiarios) |
| `ClientImportWizard.tsx` | Simplificar flujo a una sola hoja, nueva UI de preview agrupada |

## Beneficios

1. **Experiencia simplificada**: Un solo archivo, una sola hoja
2. **Menos errores**: El número de póliza como identificador evita duplicados
3. **Flexible**: Soporta múltiples beneficiarios por fila
4. **Inteligente**: Detecta automáticamente registros existentes
5. **Actualizable**: Permite tanto crear nuevos registros como actualizar existentes
