

## Diagnóstico del problema

El campo `total_spent_usd` en la tabla `budgets` se inicializa en `0` al crear el presupuesto y **nunca se actualiza**. Cuando cambias el estado de una línea a "pagado" en el diálogo de detalle, solo se actualiza el campo `status` en `budget_lines`, pero nadie recalcula el total ejecutado en la tabla padre `budgets`.

## Plan de solución

Hay dos enfoques posibles. Recomiendo el **Enfoque A** por ser más robusto:

### Enfoque A: Trigger en base de datos (recomendado)

Crear un trigger en PostgreSQL que, cada vez que se inserte, actualice o elimine una línea de presupuesto, recalcule automáticamente `total_spent_usd` sumando el `amount_usd` de todas las líneas con `status = 'pagado'`.

**Migración SQL:**
```sql
CREATE OR REPLACE FUNCTION recalc_budget_spent()
RETURNS trigger LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _budget_id uuid;
BEGIN
  _budget_id := COALESCE(NEW.budget_id, OLD.budget_id);
  UPDATE budgets
  SET total_spent_usd = COALESCE(
    (SELECT SUM(amount_usd) FROM budget_lines
     WHERE budget_id = _budget_id AND status = 'pagado'), 0),
    updated_at = now()
  WHERE id = _budget_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_recalc_budget_spent
AFTER INSERT OR UPDATE OR DELETE ON budget_lines
FOR EACH ROW EXECUTE FUNCTION recalc_budget_spent();
```

Esto garantiza que cualquier cambio de estado (desde el diálogo, importación masiva, o cualquier otro lugar) siempre mantenga el total sincronizado.

### Cambios en código

No se necesitan cambios en el frontend. El código ya lee `total_spent_usd` de la tabla `budgets` y calcula el porcentaje correctamente. Con el trigger, ese valor se actualizará automáticamente.

### Datos existentes

La migración también incluirá un `UPDATE` inicial para recalcular los presupuestos que ya tienen líneas marcadas como pagadas:

```sql
UPDATE budgets b
SET total_spent_usd = COALESCE(
  (SELECT SUM(amount_usd) FROM budget_lines bl
   WHERE bl.budget_id = b.id AND bl.status = 'pagado'), 0);
```

## Resumen de cambios

| Componente | Cambio |
|---|---|
| Nueva migración SQL | Función `recalc_budget_spent()` + trigger en `budget_lines` |
| Datos existentes | Recalcular `total_spent_usd` para presupuestos actuales |
| Frontend | Ninguno necesario |

