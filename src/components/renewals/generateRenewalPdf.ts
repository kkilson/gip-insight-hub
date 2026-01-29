import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PolicyForRenewal } from '@/hooks/useRenewals';
import { ConsumptionSummary } from '@/hooks/useConsumptions';
import { BrokerSettings, getLogoBase64 } from '@/hooks/useBrokerSettings';

// GIP Corporate Colors - Refined palette
const GIP_COLORS = {
  primary: '#182746',    // Dark blue - headers, titles
  accent: '#27abe3',     // Light blue - dividers, accents
  secondary: '#40588c',  // Medium blue - table headers
  text: '#2d3748',       // Softer black for body text
  muted: '#64748b',      // Muted text for secondary info
  lightGray: '#f8fafc',  // Very light background
  border: '#e2e8f0',     // Subtle borders
  white: '#ffffff',
  success: '#22c55e',    // For decreases
  destructive: '#ef4444', // For increases
};

const paymentFrequencyLabels: Record<string, string> = {
  mensual: 'Mensual',
  mensual_10_cuotas: 'Mensual (10 cuotas)',
  mensual_12_cuotas: 'Mensual (12 cuotas)',
  bimensual: 'Bimensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  unico: 'Pago Único',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDateLong(dateString: string): string {
  return format(new Date(dateString), "d 'de' MMMM 'de' yyyy", { locale: es });
}

export interface ConsumptionDetail {
  id: string;
  usage_date: string;
  beneficiary_name: string | null;
  usage_type: string;
  description: string;
  amount_bs: number | null;
  amount_usd: number | null;
}

export async function generateRenewalPdf(
  policy: PolicyForRenewal,
  renewalData: {
    current_amount: number;
    new_amount: number;
    renewal_date: string;
    percentage?: number;
    difference?: number;
  },
  consumptionSummary?: ConsumptionSummary | null,
  consumptionDetails?: ConsumptionDetail[],
  brokerSettings?: BrokerSettings | null
): Promise<void> {
  const clientName = `${policy.client?.first_name || ''} ${policy.client?.last_name || ''}`.trim() || 'Cliente';
  const policyNumber = policy.policy_number || 'Sin número';
  const insurerName = policy.insurer?.name || 'Sin aseguradora';
  const productName = policy.product?.name || 'Sin producto';
  const frequency = paymentFrequencyLabels[policy.payment_frequency || ''] || policy.payment_frequency || 'N/A';
  const renewalDate = formatDateLong(renewalData.renewal_date);
  const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });

  // Calculate percentage and difference
  const difference = renewalData.difference ?? (renewalData.new_amount - renewalData.current_amount);
  const percentage = renewalData.percentage ?? 
    (renewalData.current_amount > 0 
      ? ((renewalData.new_amount - renewalData.current_amount) / renewalData.current_amount) * 100 
      : 0);

  const isIncrease = difference > 0;
  const isDecrease = difference < 0;
  const variationColor = isIncrease ? GIP_COLORS.destructive : isDecrease ? GIP_COLORS.success : GIP_COLORS.muted;
  const variationSign = isIncrease ? '+' : '';

  // Broker info with defaults
  const brokerName = brokerSettings?.name || 'Mi Corretaje';
  const brokerId = brokerSettings?.identification || '';
  const brokerPhone = brokerSettings?.phone || '';
  const brokerEmail = brokerSettings?.email || '';
  const brokerAddress = brokerSettings?.address || '';

  // Get logo as base64 if available
  let logoHtml = '';
  if (brokerSettings?.logo_url) {
    const logoBase64 = await getLogoBase64(brokerSettings.logo_url);
    if (logoBase64) {
      logoHtml = `<img src="${logoBase64}" alt="Logo" class="logo" />`;
    }
  }

  // Build contact footer items
  const contactItems = [brokerEmail, brokerPhone].filter(Boolean);

  // Generate consumption table rows
  const consumptionRows = consumptionDetails?.length 
    ? consumptionDetails.map((c, idx) => `
        <tr class="${idx % 2 === 0 ? '' : 'alt-row'}">
          <td>${format(new Date(c.usage_date), 'dd/MM/yyyy')}</td>
          <td>${c.beneficiary_name || '-'}</td>
          <td>${c.usage_type}</td>
          <td>${c.description || '-'}</td>
          <td class="text-right">${c.amount_usd ? formatCurrency(c.amount_usd) : '-'}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" class="empty-row">No hay consumos registrados en el período</td></tr>';

  // Generate consumption summary by type rows
  const summaryByTypeRows = consumptionSummary?.by_type.length
    ? consumptionSummary.by_type.map((t, idx) => `
        <tr class="${idx % 2 === 0 ? '' : 'alt-row'}">
          <td>${t.type_name}</td>
          <td class="text-center">${t.count}</td>
          <td class="text-right">${formatCurrency(t.total_usd)}</td>
        </tr>
      `).join('')
    : '';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Aviso de Renovación - ${policyNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: letter;
          margin: 0.6in 0.8in;
        }
        
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 9.5pt;
          line-height: 1.6;
          color: ${GIP_COLORS.text};
          background: ${GIP_COLORS.white};
          -webkit-font-smoothing: antialiased;
        }
        
        .container {
          max-width: 700px;
          margin: 0 auto;
          padding: 30px;
        }
        
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid ${GIP_COLORS.accent};
          margin-bottom: 24px;
        }
        
        .logo-section {
          flex: 0 0 auto;
        }
        
        .logo {
          max-height: 50px;
          max-width: 160px;
          object-fit: contain;
        }
        
        .logo-placeholder {
          font-size: 8pt;
          color: ${GIP_COLORS.muted};
          font-style: italic;
        }
        
        .title-section {
          text-align: right;
        }
        
        .title {
          font-size: 18pt;
          font-weight: 600;
          color: ${GIP_COLORS.primary};
          letter-spacing: 0.5px;
          margin: 0;
        }
        
        /* Date line */
        .date-line {
          text-align: right;
          color: ${GIP_COLORS.muted};
          font-size: 9pt;
          margin-bottom: 20px;
        }
        
        /* Greeting */
        .greeting {
          margin-bottom: 14px;
          font-size: 10pt;
        }
        
        .greeting strong {
          color: ${GIP_COLORS.primary};
          font-weight: 600;
        }
        
        /* Body text */
        .intro-text {
          margin-bottom: 20px;
          text-align: justify;
          color: ${GIP_COLORS.text};
        }
        
        /* Section header */
        .section-header {
          background: ${GIP_COLORS.secondary};
          color: ${GIP_COLORS.white};
          padding: 8px 14px;
          font-size: 10pt;
          font-weight: 500;
          letter-spacing: 0.3px;
          border-radius: 4px 4px 0 0;
          margin-top: 20px;
        }
        
        /* Policy Data Table */
        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: ${GIP_COLORS.white};
          border: 1px solid ${GIP_COLORS.border};
          border-top: none;
          border-radius: 0 0 4px 4px;
          margin-bottom: 4px;
        }
        
        .data-table tr {
          border-bottom: 1px solid ${GIP_COLORS.border};
        }
        
        .data-table tr:last-child {
          border-bottom: none;
        }
        
        .data-table tr.alt-row {
          background: ${GIP_COLORS.lightGray};
        }
        
        .data-table td {
          padding: 8px 14px;
          vertical-align: middle;
        }
        
        .data-table .label {
          width: 40%;
          font-weight: 500;
          color: ${GIP_COLORS.primary};
          font-size: 9pt;
        }
        
        .data-table .value {
          width: 60%;
          color: ${GIP_COLORS.text};
          font-size: 9pt;
        }
        
        .data-table .value strong {
          font-weight: 600;
        }

        /* Comparison section */
        .comparison-container {
          margin-top: 20px;
        }
        
        .comparison-grid {
          display: flex;
          gap: 0;
          border: 1px solid ${GIP_COLORS.border};
          border-top: none;
          border-radius: 0 0 4px 4px;
          overflow: hidden;
        }
        
        .comparison-box {
          flex: 1;
          padding: 16px;
          text-align: center;
          border-right: 1px solid ${GIP_COLORS.border};
        }
        
        .comparison-box:last-child {
          border-right: none;
        }
        
        .comparison-box.highlight {
          background: linear-gradient(135deg, ${GIP_COLORS.primary}08 0%, ${GIP_COLORS.accent}08 100%);
        }
        
        .comparison-label {
          font-size: 8pt;
          color: ${GIP_COLORS.muted};
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        
        .comparison-value {
          font-size: 16pt;
          font-weight: 700;
          color: ${GIP_COLORS.primary};
        }
        
        .comparison-value.new {
          color: ${GIP_COLORS.accent};
        }
        
        .comparison-value.variation {
          font-size: 14pt;
          color: ${variationColor};
        }
        
        .comparison-difference {
          font-size: 9pt;
          color: ${variationColor};
          margin-top: 4px;
        }

        /* Consumption table */
        .consumption-section {
          margin-top: 24px;
        }
        
        .consumption-table {
          width: 100%;
          border-collapse: collapse;
          background: ${GIP_COLORS.white};
          border: 1px solid ${GIP_COLORS.border};
          border-top: none;
          border-radius: 0 0 4px 4px;
          font-size: 8.5pt;
        }
        
        .consumption-table th {
          background: ${GIP_COLORS.lightGray};
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          color: ${GIP_COLORS.primary};
          border-bottom: 1px solid ${GIP_COLORS.border};
        }
        
        .consumption-table td {
          padding: 6px 10px;
          border-bottom: 1px solid ${GIP_COLORS.border};
          vertical-align: top;
        }
        
        .consumption-table tr:last-child td {
          border-bottom: none;
        }
        
        .consumption-table .alt-row {
          background: ${GIP_COLORS.lightGray};
        }
        
        .consumption-table .text-right {
          text-align: right;
        }
        
        .consumption-table .text-center {
          text-align: center;
        }
        
        .consumption-table .empty-row {
          text-align: center;
          color: ${GIP_COLORS.muted};
          font-style: italic;
          padding: 14px;
        }

        /* Summary by type */
        .summary-section {
          margin-top: 20px;
        }
        
        .summary-grid {
          display: flex;
          gap: 16px;
        }
        
        .summary-table-container {
          flex: 1;
        }
        
        .summary-totals {
          width: 200px;
          background: ${GIP_COLORS.lightGray};
          border: 1px solid ${GIP_COLORS.border};
          border-radius: 4px;
          padding: 14px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 9pt;
        }
        
        .total-row:last-child {
          margin-bottom: 0;
          padding-top: 8px;
          border-top: 1px solid ${GIP_COLORS.border};
        }
        
        .total-label {
          color: ${GIP_COLORS.muted};
        }
        
        .total-value {
          font-weight: 600;
          color: ${GIP_COLORS.primary};
        }
        
        .total-value.highlight {
          font-size: 12pt;
          color: ${GIP_COLORS.accent};
        }
        
        /* Signature */
        .signature {
          margin-top: 28px;
          margin-bottom: 28px;
        }
        
        .signature-greeting {
          margin-bottom: 6px;
          color: ${GIP_COLORS.text};
        }
        
        .signature-name {
          font-weight: 600;
          color: ${GIP_COLORS.primary};
          font-size: 10pt;
          margin-bottom: 2px;
        }
        
        .signature-id {
          font-size: 8.5pt;
          color: ${GIP_COLORS.muted};
        }
        
        /* Footer */
        .footer {
          padding-top: 16px;
          border-top: 1px solid ${GIP_COLORS.accent};
          text-align: center;
        }
        
        .footer-contact {
          font-size: 8pt;
          color: ${GIP_COLORS.muted};
          margin-bottom: 3px;
        }
        
        .footer-contact span {
          margin: 0 6px;
        }
        
        .footer-address {
          font-size: 7.5pt;
          color: ${GIP_COLORS.muted};
          opacity: 0.8;
        }
        
        /* Print optimizations */
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .container {
            padding: 0;
            max-width: none;
          }
          
          .comparison-box.highlight,
          .consumption-table .alt-row,
          .data-table tr.alt-row {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .consumption-section {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <header class="header">
          <div class="logo-section">
            ${logoHtml || `<span class="logo-placeholder">Logo no configurado</span>`}
          </div>
          <div class="title-section">
            <h1 class="title">AVISO DE RENOVACIÓN</h1>
          </div>
        </header>
        
        <!-- Date -->
        <div class="date-line">${today}</div>
        
        <!-- Greeting -->
        <p class="greeting">
          Estimado(a) <strong>${clientName}</strong>,
        </p>
        
        <!-- Intro text -->
        <p class="intro-text">
          Le informamos que la vigencia de su póliza de seguro está próxima a vencer. 
          A continuación, encontrará el resumen de su renovación con la comparativa de primas y el detalle de consumos del período actual.
        </p>
        
        <!-- Policy Data Section -->
        <div class="section-header">Datos de la Póliza</div>
        <table class="data-table">
          <tbody>
            <tr>
              <td class="label">Número de Póliza</td>
              <td class="value"><strong>${policyNumber}</strong></td>
            </tr>
            <tr class="alt-row">
              <td class="label">Aseguradora</td>
              <td class="value">${insurerName}</td>
            </tr>
            <tr>
              <td class="label">Producto</td>
              <td class="value">${productName}</td>
            </tr>
            <tr class="alt-row">
              <td class="label">Frecuencia de Pago</td>
              <td class="value">${frequency}</td>
            </tr>
            <tr>
              <td class="label">Fecha de Renovación</td>
              <td class="value"><strong>${renewalDate}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <!-- Premium Comparison -->
        <div class="comparison-container">
          <div class="section-header">Comparativa de Primas</div>
          <div class="comparison-grid">
            <div class="comparison-box">
              <div class="comparison-label">Prima Actual</div>
              <div class="comparison-value">${formatCurrency(renewalData.current_amount)}</div>
            </div>
            <div class="comparison-box highlight">
              <div class="comparison-label">Prima Nuevo Período</div>
              <div class="comparison-value new">${formatCurrency(renewalData.new_amount)}</div>
            </div>
            <div class="comparison-box">
              <div class="comparison-label">Variación</div>
              <div class="comparison-value variation">${variationSign}${percentage.toFixed(2)}%</div>
              <div class="comparison-difference">${variationSign}${formatCurrency(difference)}</div>
            </div>
          </div>
        </div>
        
        <!-- Consumption Details -->
        <div class="consumption-section">
          <div class="section-header">Consumos del Período</div>
          <table class="consumption-table">
            <thead>
              <tr>
                <th style="width: 12%">Fecha</th>
                <th style="width: 20%">Beneficiario</th>
                <th style="width: 18%">Tipo</th>
                <th style="width: 35%">Descripción</th>
                <th style="width: 15%" class="text-right">Monto USD</th>
              </tr>
            </thead>
            <tbody>
              ${consumptionRows}
            </tbody>
          </table>
        </div>
        
        <!-- Summary by Type -->
        ${consumptionSummary && consumptionSummary.by_type.length > 0 ? `
        <div class="summary-section">
          <div class="section-header">Resumen por Tipo de Uso</div>
          <div class="summary-grid">
            <div class="summary-table-container">
              <table class="consumption-table">
                <thead>
                  <tr>
                    <th>Tipo de Uso</th>
                    <th class="text-center">Cantidad</th>
                    <th class="text-right">Total USD</th>
                  </tr>
                </thead>
                <tbody>
                  ${summaryByTypeRows}
                </tbody>
              </table>
            </div>
            <div class="summary-totals">
              <div class="total-row">
                <span class="total-label">Total consumos</span>
                <span class="total-value">${consumptionSummary.count}</span>
              </div>
              <div class="total-row">
                <span class="total-label">Total USD</span>
                <span class="total-value highlight">${formatCurrency(consumptionSummary.total_usd)}</span>
              </div>
            </div>
          </div>
        </div>
        ` : ''}
        
        <!-- Closing text -->
        <p class="intro-text" style="margin-top: 24px;">
          Si tiene alguna pregunta sobre su renovación o desea realizar modificaciones a su cobertura, 
          no dude en contactarnos. Estamos a su disposición para brindarle la mejor asesoría.
        </p>
        
        <!-- Signature -->
        <div class="signature">
          <p class="signature-greeting">Atentamente,</p>
          <p class="signature-name">${brokerName}</p>
          ${brokerId ? `<p class="signature-id">${brokerId}</p>` : ''}
        </div>
        
        <!-- Footer -->
        <footer class="footer">
          ${contactItems.length > 0 ? `<p class="footer-contact">${contactItems.map(item => `<span>${item}</span>`).join('·')}</p>` : ''}
          ${brokerAddress ? `<p class="footer-address">${brokerAddress}</p>` : ''}
        </footer>
      </div>
    </body>
    </html>
  `;

  // Create a new window and print
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  } else {
    // Fallback: download as HTML file
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aviso-renovacion-${policyNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
