
# Plan: Correcciones en el Módulo de Cobranzas

## Problemas Identificados

### Problema 1: Monto muestra Prima Anual en lugar de Cuota
El sistema actualmente almacena y muestra el monto de la prima anual completa (`policies.premium`) en la tabla de cobranzas, en lugar de la cuota calculada según la frecuencia de pago.

**Ejemplo con la póliza 1-71-131626:**
- Prima anual: $962.79
- Frecuencia: Trimestral (4 cuotas/año)
- **Cuota correcta:** $962.79 ÷ 4 = **$240.70**
- **Actualmente muestra:** $962.79 (incorrecto)

### Problema 2: Fecha de Pago de Prima con valor inválido
La póliza 1-71-131626 tiene almacenada la fecha `1902-08-19` en el campo `premium_payment_date`, lo cual es claramente un error de datos.

**Datos de la póliza:**
- Fecha inicio: 14/01/2022
- Fecha renovación: 14/01/2027  
- Fecha pago prima: 19/08/1902 (ERROR)

Además, encontré que el campo `premium_payment_date` **no se guarda** al editar una póliza (falta en el UPDATE de `ClientEditWizard.tsx`, líneas 304-318).

---

## Solución Propuesta

### Cambio 1: Calcular cuota en sincronización y creación de cobranzas

**Archivo:** `src/hooks/useSyncCollections.ts`
- Importar `calculateInstallment` de `@/lib/premiumCalculations`
- En lugar de usar `p.premium` directamente, calcular la cuota:

```typescript
import { calculateInstallment } from '@/lib/premiumCalculations';

// Al crear nueva cobranza:
const installment = calculateInstallment(p.premium, p.payment_frequency);
const amount = installment || p.premium || 0;

// Al actualizar montos existentes, comparar con la cuota calculada
```

### Cambio 2: Calcular cuota al marcar como cobrada (próxima cobranza)

**Archivo:** `src/hooks/useCollections.ts` (función `useMarkAsPaid`)
- Cuando se crea la siguiente cobranza al marcar como "cobrada", calcular la cuota:

```typescript
import { calculateInstallment } from '@/lib/premiumCalculations';

// En lugar de usar collection.amount para la nueva cobranza:
const { data: policy } = await supabase
  .from('policies')
  .select('premium, payment_frequency')
  .eq('id', collection.policy_id)
  .single();

const installment = calculateInstallment(policy.premium, policy.payment_frequency);
```

### Cambio 3: Mostrar cuota calculada en Aviso de Prima PDF

**Archivo:** `src/components/collections/generatePremiumNoticePdf.ts`
- El monto que muestra ya viene del `collection.amount`, por lo que se corregirá automáticamente cuando la cobranza tenga el monto correcto
- No requiere cambios adicionales si los datos son correctos

### Cambio 4: Agregar premium_payment_date al UPDATE de póliza

**Archivo:** `src/components/clients/ClientEditWizard.tsx`
- En el mutation de update (línea ~304-318), agregar el campo faltante:

```typescript
.update({
  // ... otros campos ...
  notes: policyData.notes || null,
  premium_payment_date: policyData.premium_payment_date || null, // AGREGAR
})
```

### Cambio 5: Validar fechas en el formulario de póliza

**Archivo:** `src/components/clients/steps/PolicyStep.tsx`
- Agregar validación para prevenir fechas inválidas:
  - La fecha de pago de prima no puede ser anterior a la fecha de inicio
  - Si la fecha cargada es inválida (ej: año < 1950), recalcular automáticamente

---

## Corrección de Datos Existentes

Una vez aplicados los cambios, el usuario deberá:
1. Ir a la sección de Clientes
2. Editar la póliza de Mariana Rey (1-71-131626)
3. La fecha de pago de prima se recalculará automáticamente o podrá editarla manualmente
4. Guardar cambios
5. En Cobranzas, hacer clic en "Sincronizar pólizas" para actualizar los montos

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useSyncCollections.ts` | Calcular cuota en vez de prima anual |
| `src/hooks/useCollections.ts` | Calcular cuota al crear siguiente cobranza |
| `src/components/clients/ClientEditWizard.tsx` | Agregar premium_payment_date al update |
| `src/components/clients/steps/PolicyStep.tsx` | Validar fechas inválidas |

---

## Resultado Final

Después de implementar:

1. **El monto en cobranzas** mostrará la cuota correcta (ej: $240.70 trimestral en vez de $962.79 anual)
2. **El Aviso de Prima** mostrará el monto de la cuota correctamente
3. **La fecha de pago de prima** podrá editarse correctamente
4. **Fechas inválidas** serán detectadas y recalculadas automáticamente
