/**
 * Utility functions for calculating premium installments based on payment frequency
 */

/**
 * Returns the number of installments per year based on payment frequency
 */
export const getInstallmentDivisor = (frequency: string): number => {
  switch (frequency) {
    case 'anual':
      return 1;
    case 'semestral':
      return 2;
    case 'trimestral':
      return 4;
    case 'bimensual':
      return 6;
    case 'mensual_10_cuotas':
      return 10;
    case 'mensual_12_cuotas':
      return 12;
    case 'mensual':
      return 12; // Legacy - treat as 12 payments
    default:
      return 1;
  }
};

/**
 * Calculates the installment amount from annual premium and payment frequency
 */
export const calculateInstallment = (annualPremium: number | string | null | undefined, frequency: string): number | null => {
  if (!annualPremium) return null;
  
  const premium = typeof annualPremium === 'string' ? parseFloat(annualPremium) : annualPremium;
  if (isNaN(premium) || premium <= 0) return null;
  
  const divisor = getInstallmentDivisor(frequency);
  return premium / divisor;
};

/**
 * Formats installment amount as currency string
 */
export const formatInstallment = (annualPremium: number | string | null | undefined, frequency: string): string => {
  const installment = calculateInstallment(annualPremium, frequency);
  if (installment === null) return '-';
  
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(installment);
};

/**
 * Gets a human-readable label for the number of installments
 */
export const getInstallmentLabel = (frequency: string): string => {
  const divisor = getInstallmentDivisor(frequency);
  if (divisor === 1) return '1 pago anual';
  return `${divisor} cuotas anuales`;
};
