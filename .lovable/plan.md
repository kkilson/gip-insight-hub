
# Plan: Prima Anual y Cálculo de Cuotas

## Resumen

Modificar la sección de Póliza en el módulo de Clientes para:
1. Cambiar la etiqueta "Prima (USD)" por "Prima Anual (USD)"
2. Añadir una nueva sección de "Cuotas" que muestre el cálculo automático basado en la frecuencia de pago

---

## Lógica de Cálculo de Cuotas

| Frecuencia de pago | Número de pagos | Ejemplo |
|-------------------|-----------------|---------|
| Anual | 1 | $1500 / 1 = $1500 |
| Semestral | 2 | $1500 / 2 = $750 |
| Trimestral | 4 | $1500 / 4 = $375 |
| Bimensual | 6 | $1500 / 6 = $250 |
| Mensual 10 cuotas | 10 | $1500 / 10 = $150 |
| Mensual 12 cuotas | 12 | $1500 / 12 = $125 |
| Mensual (legacy) | 12 | $1500 / 12 = $125 |

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/clients/steps/PolicyStep.tsx` | Cambiar label "Prima (USD)" → "Prima Anual (USD)" y añadir campo calculado de "Cuota" |
| `src/components/clients/steps/ReviewStep.tsx` | Mostrar "Prima Anual" y añadir línea de "Cuota" en la revisión |
| `src/components/clients/ClientDetailDialog.tsx` | Actualizar visualización de póliza para mostrar Prima Anual y Cuota |

---

## Cambios Específicos

### 1. PolicyStep.tsx - Formulario de Póliza

**Antes:**
```
Prima (USD): [input $1500]
Frecuencia de pago: [Mensual 12]
```

**Después:**
```
Prima Anual (USD): [input $1500]
Frecuencia de pago: [Mensual 12]
Cuota (USD): $125.00 (calculado automático, solo lectura)
```

Se añadirá:
- Cambio de label de "Prima (USD)" a "Prima Anual (USD)"
- Nuevo campo de solo lectura que muestre la cuota calculada
- Función helper para calcular el divisor según la frecuencia

### 2. ReviewStep.tsx - Paso de Revisión

**Antes:**
```
Prima: $1,500.00
Frecuencia: Mensual 12 cuotas
```

**Después:**
```
Prima Anual: $1,500.00
Frecuencia: Mensual 12 cuotas
Cuota: $125.00
```

### 3. ClientDetailDialog.tsx - Detalle del Cliente

En la pestaña "Pólizas", actualizar la visualización para mostrar:
- Prima Anual en lugar de solo Prima
- Nueva línea con el valor de la Cuota calculada

---

## Función de Cálculo

Se creará una función reutilizable:

```typescript
const getInstallmentDivisor = (frequency: string): number => {
  switch (frequency) {
    case 'anual': return 1;
    case 'semestral': return 2;
    case 'trimestral': return 4;
    case 'bimensual': return 6;
    case 'mensual_10_cuotas': return 10;
    case 'mensual_12_cuotas': return 12;
    case 'mensual': return 12; // Legacy
    default: return 1;
  }
};

const calculateInstallment = (annualPremium: number, frequency: string): number => {
  const divisor = getInstallmentDivisor(frequency);
  return annualPremium / divisor;
};
```

---

## Vista Previa del Resultado

### En el formulario de Póliza:
```
┌─────────────────────────────────────────────────────────┐
│  Prima Anual (USD)         Frecuencia de pago           │
│  [     1,500.00    ]       [  Mensual 12 cuotas  ▼]     │
│                                                         │
│  Cuota (USD)                                            │
│  $125.00                    (12 cuotas anuales)         │
└─────────────────────────────────────────────────────────┘
```

### En el detalle del cliente (Pólizas):
```
┌─────────────────────────────────────────────────────────┐
│  VUMI - ACCESS VIP                            Vigente   │
│  ───────────────────────────────────────────────────────│
│  📄 8000035927  📅 01/01/26 - 01/01/27                  │
│  💵 Prima Anual: $1,500.00   💰 Cuota: $125.00          │
│  📋 Suma: $100,000                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Notas Técnicas

- El campo de "Cuota" será de **solo lectura** y se calculará automáticamente
- Se actualiza en tiempo real cuando cambia la prima o la frecuencia
- Se muestra con formato de moneda consistente ($XXX.XX)
- No se modifica la base de datos; el campo `premium` sigue almacenando la prima anual
