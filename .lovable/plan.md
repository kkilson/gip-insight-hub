

## Plan: Calculadora de Nomina con tasas BCV/Binance

### Contexto

Crear una pestaña "Nomina" en Finanzas que permita registrar empleados con su salario base en USD, ingresar las tasas BCV y Binance del dia, y calcular automaticamente:
- **Tasa promedio** = (BCV + Binance) / 2
- **Si paga en USD**: el salario base tal cual (sin ajuste)
- **Si paga en bolivares**: VES = salario_base * tasa_binance, luego USD_ajustado = VES / tasa_promedio (esto es mas que el base porque compensa el spread cambiario)

### 1. Migracion de base de datos

Crear tabla `payroll_employees`:

```sql
CREATE TABLE public.payroll_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  base_salary_usd numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payroll_employees ENABLE ROW LEVEL SECURITY;
-- RLS: acceso_total ALL, revision_edicion_1 SELECT (mismo patron que finance_debts)
```

Trigger `update_updated_at_column` reutilizado.

### 2. Hook `usePayroll.ts`

- `usePayrollEmployees()` - lista empleados activos
- `useSaveEmployee()` - crear/editar empleado
- `useDeleteEmployee()` - eliminar empleado

### 3. Componente `PayrollTab.tsx`

**Panel de tasas (parte superior):**
- Input "Tasa BCV" (pre-llenado desde `useLatestExchangeRates` si hay dato USD_BCV)
- Input "Tasa Binance" (pre-llenado desde USD_Binance)
- Tarjeta calculada: "Tasa Promedio" = (BCV + Binance) / 2

**Tabla de calculo en tiempo real:**

| Empleado | Salario Base USD | Pago en USD | VES (x Binance) | USD Ajustado (VES / Promedio) | Diferencia |
|----------|-----------------|-------------|------------------|-------------------------------|------------|
| Kevin Kilson | 700.00 | 700.00 | 431,116.00 | 842.22 | +142.22 |
| Eduer Castilla | 400.00 | 400.00 | 246,352.00 | 481.27 | +81.27 |

Donde:
- **Pago en USD**: es simplemente el salario base (lo que pagas si tienes dolares)
- **VES (x Binance)**: salario_base * tasa_binance (lo que recibiria el empleado en bolivares)
- **USD Ajustado**: VES / tasa_promedio (el costo real en USD si pagas en bolivares)
- **Diferencia**: USD_ajustado - salario_base (el sobrecosto por pagar en VES)

**Fila de totales** al final de la tabla.

**Tarjetas resumen:**
- "Total nomina si pago en USD: $X"
- "Total nomina si pago en VES: $X (USD ajustado)"
- "Sobrecosto por tasa: $X (+Y%)"

**CRUD de empleados:** boton para agregar/editar/eliminar empleados con nombre y salario base.

### 4. Integracion en `Finances.tsx`

Agregar pestaña "Nomina" entre "Prestamos" y "Tasas de Cambio".

### 5. Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| Nueva migracion SQL | Tabla `payroll_employees` + RLS + trigger updated_at |
| `src/hooks/usePayroll.ts` | Nuevo - CRUD empleados |
| `src/components/finances/PayrollTab.tsx` | Nuevo - calculadora completa |
| `src/pages/Finances.tsx` | Agregar tab "Nomina" |

