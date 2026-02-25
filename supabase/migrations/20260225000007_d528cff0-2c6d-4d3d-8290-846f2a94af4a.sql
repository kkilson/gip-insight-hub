
-- Add beneficiary (payee) field to finance_expenses
ALTER TABLE public.finance_expenses ADD COLUMN beneficiary text NULL;
