-- Add amount_ves column to budget_lines for dual-currency tracking
ALTER TABLE public.budget_lines ADD COLUMN IF NOT EXISTS amount_ves numeric NOT NULL DEFAULT 0;

-- Add day_of_month column for simplified "día del mes que se debe pagar"
ALTER TABLE public.budget_lines ADD COLUMN IF NOT EXISTS day_of_month integer;