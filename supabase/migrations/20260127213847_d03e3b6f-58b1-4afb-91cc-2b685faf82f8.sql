-- Add new payment frequency values to the enum
ALTER TYPE payment_frequency ADD VALUE IF NOT EXISTS 'mensual_10_cuotas';
ALTER TYPE payment_frequency ADD VALUE IF NOT EXISTS 'mensual_12_cuotas';
ALTER TYPE payment_frequency ADD VALUE IF NOT EXISTS 'bimensual';

-- Add premium_payment_date column to policies table
ALTER TABLE public.policies 
ADD COLUMN IF NOT EXISTS premium_payment_date date;