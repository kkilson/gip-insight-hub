import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Collection } from '@/hooks/useCollections';
import { BrokerSettings, getLogoBase64 } from '@/hooks/useBrokerSettings';

// GIP Corporate Colors
const GIP_COLORS = {
  primary: '#182746',   // Dark blue
  accent: '#27abe3',    // Light blue
  secondary: '#40588c', // Medium blue
  text: '#1a1a1a',      // Near black
  lightGray: '#f8f9fa',
  white: '#ffffff',
};

const paymentFrequencyLabels: Record<string, string> = {
  mensual: 'MENSUAL',
  mensual_10_cuotas: 'MENSUAL (10 CUOTAS)',
  mensual_12_cuotas: 'MENSUAL (12 CUOTAS)',
  bimensual: 'BIMENSUAL',
  trimestral: 'TRIMESTRAL',
  semestral: 'SEMESTRAL',
  anual: 'ANUAL',
  unico: 'PAGO ÚNICO',
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
  const frequency = paymentFrequencyLabels[collection.payment_frequency] || collection.payment_frequency.toUpperCase();
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
      logoHtml = `<img src="${logoBase64}" alt="Logo" style="max-height: 80px; max-width: 200px; object-fit: contain;" />`;
    }
  }

  // Build contact footer items
  const contactItems = [
    brokerEmail,
    brokerPhone,
  ].filter(Boolean);

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
          margin: 1in;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 11pt;
          line-height: 1.6;
          color: ${GIP_COLORS.text};
          background: ${GIP_COLORS.white};
        }
        
        .container {
          max-width: 700px;
          margin: 0 auto;
          padding: 20px;
        }
        
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .logo-section {
          flex: 1;
        }
        
        .logo-placeholder {
          width: 200px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        
        .title-section {
          text-align: right;
        }
        
        .title {
          font-size: 24pt;
          font-weight: bold;
          color: ${GIP_COLORS.primary};
          letter-spacing: 1px;
        }
        
        .divider {
          height: 3px;
          background: ${GIP_COLORS.accent};
          margin: 15px 0 25px 0;
        }
        
        /* Date */
        .date-line {
          text-align: right;
          margin-bottom: 30px;
          color: ${GIP_COLORS.text};
        }
        
        /* Greeting */
        .greeting {
          margin-bottom: 25px;
        }
        
        .greeting strong {
          color: ${GIP_COLORS.primary};
        }
        
        /* Intro text */
        .intro-text {
          margin-bottom: 30px;
          text-align: justify;
        }
        
        /* Policy Data Table */
        .policy-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          border: 1px solid ${GIP_COLORS.secondary};
        }
        
        .policy-table th {
          background: ${GIP_COLORS.secondary};
          color: ${GIP_COLORS.white};
          padding: 12px 15px;
          text-align: left;
          font-size: 12pt;
          font-weight: 600;
        }
        
        .policy-table td {
          padding: 10px 15px;
          border-bottom: 1px solid #e0e0e0;
        }
        
        .policy-table tr:last-child td {
          border-bottom: none;
        }
        
        .policy-table .label {
          width: 45%;
          font-weight: 500;
          color: ${GIP_COLORS.primary};
          background: ${GIP_COLORS.lightGray};
        }
        
        .policy-table .value {
          width: 55%;
          color: ${GIP_COLORS.text};
        }
        
        .policy-table .amount {
          font-size: 13pt;
          font-weight: bold;
          color: ${GIP_COLORS.primary};
        }
        
        /* Additional text */
        .additional-text {
          margin-bottom: 30px;
          text-align: justify;
        }
        
        /* Signature */
        .signature {
          margin-top: 40px;
          margin-bottom: 50px;
        }
        
        .signature-greeting {
          margin-bottom: 20px;
        }
        
        .signature-name {
          font-weight: bold;
          color: ${GIP_COLORS.primary};
          font-size: 12pt;
        }
        
        .signature-id {
          font-size: 10pt;
          color: #666;
        }
        
        /* Footer */
        .footer-divider {
          height: 2px;
          background: ${GIP_COLORS.accent};
          margin: 30px 0 15px 0;
        }
        
        .footer {
          text-align: center;
          font-size: 9pt;
          color: #666;
        }
        
        .footer-contact {
          margin-bottom: 5px;
        }
        
        .footer-address {
          color: #888;
        }
        
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .container {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo-section">
            <div class="logo-placeholder">
              ${logoHtml || `<span style="color: #999; font-size: 10pt;">Logo no configurado</span>`}
            </div>
          </div>
          <div class="title-section">
            <div class="title">AVISO DE PRIMA</div>
          </div>
        </div>
        
        <!-- Divider -->
        <div class="divider"></div>
        
        <!-- Date -->
        <div class="date-line">${today}</div>
        
        <!-- Greeting -->
        <div class="greeting">
          Estimado(a) <strong>${clientName}</strong>,
        </div>
        
        <!-- Intro text -->
        <div class="intro-text">
          Le informamos que se acerca la fecha de vencimiento de la prima correspondiente a su póliza de seguro.
          A continuación, encontrará los detalles de su próximo pago:
        </div>
        
        <!-- Policy Data Table -->
        <table class="policy-table">
          <thead>
            <tr>
              <th colspan="2">Datos de la Póliza</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="label">Número de Póliza:</td>
              <td class="value"><strong>${policyNumber}</strong></td>
            </tr>
            <tr>
              <td class="label">Aseguradora:</td>
              <td class="value">${insurerName}</td>
            </tr>
            <tr>
              <td class="label">Plan / Producto:</td>
              <td class="value">${planProduct}</td>
            </tr>
            <tr>
              <td class="label">Frecuencia de Pago:</td>
              <td class="value">${frequency}</td>
            </tr>
            <tr>
              <td class="label">Monto de la Prima:</td>
              <td class="value amount">${amount}</td>
            </tr>
            <tr>
              <td class="label">Fecha del Próximo Pago:</td>
              <td class="value"><strong>${dueDate}</strong></td>
            </tr>
          </tbody>
        </table>
        
        <!-- Additional text -->
        <div class="additional-text">
          Le agradecemos realizar el pago antes de la fecha indicada para mantener la vigencia de su póliza 
          y garantizar la continuidad de su cobertura. Si tiene alguna pregunta o requiere asistencia, 
          no dude en contactarnos.
        </div>
        
        <!-- Signature -->
        <div class="signature">
          <div class="signature-greeting">Saludos cordiales,</div>
          <div class="signature-name">${brokerName}</div>
          ${brokerId ? `<div class="signature-id">${brokerId}</div>` : ''}
        </div>
        
        <!-- Footer -->
        <div class="footer-divider"></div>
        <div class="footer">
          ${contactItems.length > 0 ? `<div class="footer-contact">${contactItems.join(' · ')}</div>` : ''}
          ${brokerAddress ? `<div class="footer-address">${brokerAddress}</div>` : ''}
        </div>
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
