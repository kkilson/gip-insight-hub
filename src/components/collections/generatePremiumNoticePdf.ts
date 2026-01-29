import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Collection } from '@/hooks/useCollections';
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

export async function generatePremiumNoticePdf(
  collection: Collection,
  brokerSettings?: BrokerSettings | null
): Promise<void> {
  const clientName = `${collection.client?.first_name || ''} ${collection.client?.last_name || ''}`.trim() || 'Cliente';
  const policyNumber = collection.policy?.policy_number || 'Sin número';
  const insurerName = collection.policy?.insurer?.name || 'Sin aseguradora';
  const productName = collection.policy?.product?.name || '';
  const productCategory = collection.policy?.product?.category || '';
  const planProduct = [productName, productCategory].filter(Boolean).join(' - ') || 'Sin producto';
  const frequency = paymentFrequencyLabels[collection.payment_frequency] || collection.payment_frequency;
  const amount = formatCurrency(collection.amount);
  const dueDate = formatDateLong(collection.due_date);
  const today = format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });

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

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Aviso de Prima - ${policyNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        @page {
          size: letter;
          margin: 0.75in 1in;
        }
        
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: 10.5pt;
          line-height: 1.7;
          color: ${GIP_COLORS.text};
          background: ${GIP_COLORS.white};
          -webkit-font-smoothing: antialiased;
        }
        
        .container {
          max-width: 640px;
          margin: 0 auto;
          padding: 40px;
        }
        
        /* Header - Clean and balanced */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 1px solid ${GIP_COLORS.accent};
          margin-bottom: 32px;
        }
        
        .logo-section {
          flex: 0 0 auto;
        }
        
        .logo {
          max-height: 56px;
          max-width: 180px;
          object-fit: contain;
        }
        
        .logo-placeholder {
          font-size: 9pt;
          color: ${GIP_COLORS.muted};
          font-style: italic;
        }
        
        .title-section {
          text-align: right;
        }
        
        .title {
          font-size: 22pt;
          font-weight: 600;
          color: ${GIP_COLORS.primary};
          letter-spacing: 0.5px;
          margin: 0;
        }
        
        /* Date line */
        .date-line {
          text-align: right;
          color: ${GIP_COLORS.muted};
          font-size: 10pt;
          margin-bottom: 28px;
        }
        
        /* Greeting */
        .greeting {
          margin-bottom: 20px;
          font-size: 11pt;
        }
        
        .greeting strong {
          color: ${GIP_COLORS.primary};
          font-weight: 600;
        }
        
        /* Body text */
        .intro-text {
          margin-bottom: 28px;
          text-align: justify;
          color: ${GIP_COLORS.text};
        }
        
        /* Policy Data Table - Clean VUMI style */
        .policy-section {
          margin-bottom: 28px;
        }
        
        .policy-header {
          background: ${GIP_COLORS.secondary};
          color: ${GIP_COLORS.white};
          padding: 10px 16px;
          font-size: 11pt;
          font-weight: 500;
          letter-spacing: 0.3px;
          border-radius: 4px 4px 0 0;
        }
        
        .policy-table {
          width: 100%;
          border-collapse: collapse;
          background: ${GIP_COLORS.white};
          border: 1px solid ${GIP_COLORS.border};
          border-top: none;
          border-radius: 0 0 4px 4px;
        }
        
        .policy-table tr {
          border-bottom: 1px solid ${GIP_COLORS.border};
        }
        
        .policy-table tr:last-child {
          border-bottom: none;
        }
        
        .policy-table tr:nth-child(even) {
          background: ${GIP_COLORS.lightGray};
        }
        
        .policy-table td {
          padding: 10px 16px;
          vertical-align: middle;
        }
        
        .policy-table .label {
          width: 45%;
          font-weight: 500;
          color: ${GIP_COLORS.primary};
          font-size: 10pt;
        }
        
        .policy-table .value {
          width: 55%;
          color: ${GIP_COLORS.text};
          font-size: 10pt;
        }
        
        .policy-table .value strong {
          font-weight: 600;
        }
        
        /* Highlighted amount row */
        .policy-table .amount-row {
          background: linear-gradient(135deg, ${GIP_COLORS.primary}08 0%, ${GIP_COLORS.accent}08 100%) !important;
        }
        
        .policy-table .amount-value {
          font-size: 13pt;
          font-weight: 700;
          color: ${GIP_COLORS.primary};
        }
        
        /* Additional text */
        .additional-text {
          margin-bottom: 36px;
          text-align: justify;
          color: ${GIP_COLORS.text};
        }
        
        /* Signature */
        .signature {
          margin-bottom: 40px;
        }
        
        .signature-greeting {
          margin-bottom: 8px;
          color: ${GIP_COLORS.text};
        }
        
        .signature-name {
          font-weight: 600;
          color: ${GIP_COLORS.primary};
          font-size: 11pt;
          margin-bottom: 2px;
        }
        
        .signature-id {
          font-size: 9.5pt;
          color: ${GIP_COLORS.muted};
        }
        
        /* Footer - Minimal and elegant */
        .footer {
          padding-top: 20px;
          border-top: 1px solid ${GIP_COLORS.accent};
          text-align: center;
        }
        
        .footer-contact {
          font-size: 9pt;
          color: ${GIP_COLORS.muted};
          margin-bottom: 4px;
        }
        
        .footer-contact span {
          margin: 0 8px;
        }
        
        .footer-address {
          font-size: 8.5pt;
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
          
          .policy-table tr:nth-child(even),
          .policy-table .amount-row {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
            <h1 class="title">AVISO DE PRIMA</h1>
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
          Le informamos que se acerca la fecha de vencimiento de la prima correspondiente a su póliza de seguro.
          A continuación, encontrará los detalles de su próximo pago:
        </p>
        
        <!-- Policy Data Section -->
        <div class="policy-section">
          <div class="policy-header">Datos de la Póliza</div>
          <table class="policy-table">
            <tbody>
              <tr>
                <td class="label">Número de Póliza</td>
                <td class="value"><strong>${policyNumber}</strong></td>
              </tr>
              <tr>
                <td class="label">Aseguradora</td>
                <td class="value">${insurerName}</td>
              </tr>
              <tr>
                <td class="label">Plan / Producto</td>
                <td class="value">${planProduct}</td>
              </tr>
              <tr>
                <td class="label">Frecuencia de Pago</td>
                <td class="value">${frequency}</td>
              </tr>
              <tr class="amount-row">
                <td class="label">Monto de la Prima</td>
                <td class="value amount-value">${amount}</td>
              </tr>
              <tr>
                <td class="label">Fecha del Próximo Pago</td>
                <td class="value"><strong>${dueDate}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Additional text -->
        <p class="additional-text">
          Le agradecemos realizar el pago antes de la fecha indicada para mantener la vigencia de su póliza 
          y garantizar la continuidad de su cobertura. Si tiene alguna pregunta o requiere asistencia, 
          no dude en contactarnos.
        </p>
        
        <!-- Signature -->
        <div class="signature">
          <p class="signature-greeting">Saludos cordiales,</p>
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
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
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
    a.download = `aviso-prima-${policyNumber}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
