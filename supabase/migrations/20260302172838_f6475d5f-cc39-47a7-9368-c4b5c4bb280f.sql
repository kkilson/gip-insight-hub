
-- Add amount fields to tracking_cases for reembolsos, cartas avales, emergencias
ALTER TABLE public.tracking_cases
  ADD COLUMN claimed_amount_usd numeric DEFAULT 0,
  ADD COLUMN claimed_amount_bs numeric DEFAULT 0,
  ADD COLUMN approved_amount_usd numeric DEFAULT 0,
  ADD COLUMN approved_amount_bs numeric DEFAULT 0;
