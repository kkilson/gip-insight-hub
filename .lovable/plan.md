
# Plan: Mejoras al Sistema de Importación Masiva de Clientes

## Resumen del Problema

Tras revisar el código, encontré las siguientes brechas en la plantilla de importación:

### Campos faltantes en la plantilla actual:

| Campo | Disponible en BD | En Plantilla | Estado |
|-------|------------------|--------------|--------|
| **Asesor Principal** | `policy_advisors.advisor_id` | No | Faltante |
| **Asesor Secundario** | `policy_advisors.advisor_id` | No | Faltante |
| **Tipo ID Tomador** | `clients.identification_type` | No | Faltante |
| **Móvil Tomador** | `clients.mobile` | No | Faltante |
| **Dirección Tomador** | `clients.address` | No | Faltante |
| **Ciudad Tomador** | `clients.city` | No | Faltante |
| **Estado Tomador** | `clients.province` | No | Faltante |
| **F. Nacimiento Tomador** | `clients.birth_date` | No | Faltante |
| **Ocupación Tomador** | `clients.occupation` | No | Faltante |
| **Lugar Trabajo Tomador** | `clients.workplace` | No | Faltante |
| **Suma Asegurada** | `policies.coverage_amount` | No | Faltante |
| **Deducible** | `policies.deductible` | No | Faltante |
| **Notas Póliza** | `policies.notes` | No | Faltante |

### La pestaña "Instrucciones" ya existe pero le faltan:
- Lista de **Asesores** disponibles para copiar/pegar
- Formato de campos adicionales como Suma Asegurada, Deducible

---

## Solución Propuesta

### 1. Agregar campo de Asesores al sistema de importación

**Archivos a modificar:**

**`src/components/clients/import/unifiedTypes.ts`**
- Agregar campos `primary_advisor_name` y `secondary_advisor_name` a los tipos
- Agregar las definiciones de campo en `UNIFIED_DB_FIELDS`

**`src/components/clients/import/unifiedUtils.ts`**
- Agregar lógica de auto-mapeo para detectar columnas de asesor
- Agregar función para resolver asesor por nombre
- Modificar `extractPolicyData` para incluir asesores
- Actualizar `downloadUnifiedTemplate` para incluir columna de Asesor

**`src/components/clients/ClientImportWizard.tsx`**
- Agregar query para obtener lista de asesores activos
- Pasar asesores a la validación
- Agregar lógica para insertar en `policy_advisors` después de crear póliza

### 2. Expandir la plantilla con todos los campos

**`src/components/clients/import/unifiedUtils.ts`**
- Actualizar `downloadUnifiedTemplate` para incluir todos los campos:
  - Tipo ID Tomador
  - Móvil Tomador  
  - Dirección, Ciudad, Estado Tomador
  - F. Nacimiento Tomador
  - Ocupación, Trabajo Tomador
  - Suma Asegurada, Deducible
  - Notas Póliza
  - **Asesor Principal, Asesor Secundario**

### 3. Mejorar la pestaña "Instrucciones" como "Recursos"

**`src/components/clients/import/ImportInstructionsTab.tsx`**
- Agregar nueva sección para **Asesores Disponibles** con lista copiable
- Agregar botón "Copiar al portapapeles" para cada sección de recursos
- Organizar mejor las secciones para facilitar el copy/paste

---

## Detalle Técnico de Implementación

### Paso 1: Actualizar tipos (unifiedTypes.ts)

Agregar nuevos campos:
```typescript
// En UNIFIED_DB_FIELDS, agregar después de policy_notes:
{ value: 'primary_advisor_name', label: 'Asesor Principal', required: false, group: 'policy' },
{ value: 'secondary_advisor_name', label: 'Asesor Secundario', required: false, group: 'policy' },
```

### Paso 2: Actualizar auto-mapeo (unifiedUtils.ts)

Agregar detección de columnas de asesor:
```typescript
// En autoMapUnifiedColumns, agregar:
else if (h.includes('asesor') && (h.includes('principal') || h.includes('1'))) {
  dbField = 'primary_advisor_name';
} else if (h.includes('asesor') && (h.includes('secundario') || h.includes('2'))) {
  dbField = 'secondary_advisor_name';
}
```

### Paso 3: Resolver asesores en validación

Agregar parámetro `advisors` a `validateUnifiedImport`:
```typescript
// Resolver asesor por nombre (fuzzy match)
const primaryAdvisorName = extractField(row, mappings, 'primary_advisor_name');
const primaryAdvisor = advisors.find(a => 
  a.full_name.toLowerCase().includes(primaryAdvisorName?.toLowerCase() || '')
);
```

### Paso 4: Insertar en policy_advisors

En el mutation de importación, después de crear/actualizar póliza:
```typescript
// Si hay asesor principal
if (row.resolvedPrimaryAdvisorId) {
  await supabase.from('policy_advisors').insert({
    policy_id: policyId,
    advisor_id: row.resolvedPrimaryAdvisorId,
    advisor_role: 'principal'
  });
}
// Similar para asesor secundario
```

### Paso 5: Actualizar plantilla descargable

Expandir headers de la plantilla:
```typescript
const baseHeaders = [
  'Número Póliza', 'Aseguradora', 'Producto', 'Fecha Inicio', 'Fecha Fin', 
  'Prima', 'Suma Asegurada', 'Deducible', 'Estado', 'Frecuencia Pago', 'Fecha Pago Prima',
  'Asesor Principal', 'Asesor Secundario', 'Notas Póliza',
  'Tipo ID Tomador', 'Cédula Tomador', 'Nombres Tomador', 'Apellidos Tomador', 
  'Email Tomador', 'Teléfono Tomador', 'Móvil Tomador',
  'Dirección Tomador', 'Ciudad Tomador', 'Estado Tomador',
  'F. Nacimiento Tomador', 'Ocupación Tomador', 'Trabajo Tomador',
];
```

### Paso 6: Mejorar ImportInstructionsTab con Asesores

Agregar nueva sección de asesores:
```tsx
<Card>
  <CardHeader className="pb-3">
    <CardTitle className="text-base flex items-center gap-2">
      <UserCog className="h-4 w-4 text-primary" />
      Asesores Disponibles ({advisors.length})
    </CardTitle>
  </CardHeader>
  <CardContent>
    <div className="flex flex-wrap gap-2">
      {advisors.filter(a => a.is_active).map(advisor => (
        <Badge key={advisor.id} variant="secondary" className="text-xs cursor-pointer"
          onClick={() => navigator.clipboard.writeText(advisor.full_name)}>
          {advisor.full_name}
        </Badge>
      ))}
    </div>
    <Button variant="outline" size="sm" className="mt-2"
      onClick={() => copyAllAdvisors()}>
      <Copy className="h-3 w-3 mr-1" /> Copiar todos
    </Button>
  </CardContent>
</Card>
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/clients/import/unifiedTypes.ts` | Agregar campos de asesor |
| `src/components/clients/import/unifiedUtils.ts` | Auto-mapeo de asesores, plantilla expandida |
| `src/components/clients/ClientImportWizard.tsx` | Query asesores, insertar policy_advisors |
| `src/components/clients/import/ImportInstructionsTab.tsx` | Sección de asesores con copy |

---

## Asesores Disponibles (para referencia)

Los 19 asesores activos en el sistema son:
- ALICIA DUBEN
- ANA CAMPELO
- ANTONIO HERNANDEZ
- AXEL GODOY
- CAROLINA MAYORCA
- DAYANITH BARRETO
- EDUER CASTILLA
- GUILLERMO SERRA
- JULIETA MARISCAL
- KEVIN KILSON
- LORENE BARANI
- MARIA GABRIELA ESTABA
- MARIA GABRIELA VELAZQUEZ
- MARIA ISABEL CURIE
- MARIANA ARAQUE
- MICHELLE BONELLI
- MIRIAN VILLARROEL
- PAOLA BARANI
- SEIR ROJAS

---

## Resultado Final

Después de implementar:

1. La **plantilla descargable** incluirá TODOS los campos de la base de datos
2. Los **asesores** podrán asignarse durante la importación masiva
3. La pestaña **Instrucciones** mostrará:
   - Lista de asesores (con botón copiar)
   - Lista de aseguradoras (con botón copiar)  
   - Productos por aseguradora
   - Frecuencias de pago válidas
   - Estados de póliza válidos
   - Tipos de identificación
   - Parentescos de beneficiarios
4. Cada sección tendrá **botón de copiar** para facilitar el llenado del Excel
