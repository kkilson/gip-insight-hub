
CREATE OR REPLACE FUNCTION public.recalc_budget_spent()
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
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_recalc_budget_spent
AFTER INSERT OR UPDATE OR DELETE ON budget_lines
FOR EACH ROW EXECUTE FUNCTION public.recalc_budget_spent();

-- Sync existing data
UPDATE budgets b
SET total_spent_usd = COALESCE(
  (SELECT SUM(amount_usd) FROM budget_lines bl
   WHERE bl.budget_id = b.id AND bl.status = 'pagado'), 0);
