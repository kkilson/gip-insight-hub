import { Collection } from '@/hooks/useCollections';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function generatePremiumNoticePdf(collection: Collection): Promise<void> {
  const clientName = `${collection.client?.first_name || ''} ${collection.client?.last_name || ''}`.trim();
  const clientEmail = collection.client?.email || '';
  const clientPhone = collection.client?.phone || collection.client?.mobile || '';
  
  const policyNumber = collection.policy?.policy_number || 'Sin número';
  const insurerName = collection.policy?.insurer?.name || collection.policy?.insurer?.short_name || 'N/A';
  const productName = collection.policy?.product?.name || 'N/A';
  
  const dueDate = format(new Date(collection.due_date), "dd 'de' MMMM 'de' yyyy", { locale: es });
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es });
  
  const amount = new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(collection.amount);

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
  const frequency = paymentFrequencyLabels[collection.payment_frequency] || collection.payment_frequency;

  // Build HTML content for PDF
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Aviso de Prima - ${policyNumber}</title>
  <style>
    @page {
      size: letter;
      margin: 2.5cm 2cm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 40px;
      border-bottom: 2px solid #1a365d;
      padding-bottom: 20px;
    }
    .company-name {
      font-size: 18pt;
      font-weight: bold;
      color: #1a365d;
      margin: 0;
    }
    .company-subtitle {
      font-size: 10pt;
      color: #4a5568;
      margin-top: 5px;
    }
    .date-section {
      text-align: right;
      margin-bottom: 30px;
    }
    .recipient {
      margin-bottom: 30px;
    }
    .recipient p {
      margin: 3px 0;
    }
    .recipient .name {
      font-weight: bold;
    }
    .subject {
      font-weight: bold;
      text-align: center;
      font-size: 14pt;
      margin: 30px 0;
      text-decoration: underline;
    }
    .salutation {
      margin-bottom: 20px;
    }
    .body-text {
      text-align: justify;
      margin-bottom: 20px;
    }
    .details-box {
      background-color: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .details-box table {
      width: 100%;
      border-collapse: collapse;
    }
    .details-box td {
      padding: 8px 5px;
      vertical-align: top;
    }
    .details-box td:first-child {
      font-weight: bold;
      width: 40%;
      color: #2d3748;
    }
    .amount-highlight {
      font-size: 16pt;
      font-weight: bold;
      color: #1a365d;
    }
    .payment-info {
      background-color: #ebf8ff;
      border: 1px solid #90cdf4;
      border-radius: 8px;
      padding: 15px;
      margin: 25px 0;
    }
    .payment-info h4 {
      margin: 0 0 10px 0;
      color: #2b6cb0;
    }
    .payment-info p {
      margin: 5px 0;
      font-size: 11pt;
    }
    .closing {
      margin-top: 40px;
    }
    .signature {
      margin-top: 60px;
    }
    .signature-line {
      border-top: 1px solid #1a1a1a;
      width: 200px;
      margin-bottom: 5px;
    }
    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9pt;
      color: #718096;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <p class="company-name">GIP Asesores Integrales</p>
    <p class="company-subtitle">Asesoría y Corretaje de Seguros</p>
  </div>

  <div class="date-section">
    <p>Caracas, ${today}</p>
  </div>

  <div class="recipient">
    <p class="name">${clientName}</p>
    ${clientEmail ? `<p>${clientEmail}</p>` : ''}
    ${clientPhone ? `<p>${clientPhone}</p>` : ''}
    <p>Presente.-</p>
  </div>

  <p class="subject">AVISO DE PRIMA</p>

  <p class="salutation">Estimado(a) ${clientName.split(' ')[0]}:</p>

  <p class="body-text">
    Por medio de la presente, nos permitimos recordarle que se encuentra próximo 
    el vencimiento del pago de prima correspondiente a su póliza de seguro. 
    A continuación, le detallamos la información relacionada con este pago:
  </p>

  <div class="details-box">
    <table>
      <tr>
        <td>Número de Póliza:</td>
        <td>${policyNumber}</td>
      </tr>
      <tr>
        <td>Aseguradora:</td>
        <td>${insurerName}</td>
      </tr>
      <tr>
        <td>Producto:</td>
        <td>${productName}</td>
      </tr>
      <tr>
        <td>Frecuencia de Pago:</td>
        <td>${frequency}</td>
      </tr>
      <tr>
        <td>Fecha de Vencimiento:</td>
        <td>${dueDate}</td>
      </tr>
      <tr>
        <td>Monto a Pagar:</td>
        <td class="amount-highlight">${amount}</td>
      </tr>
    </table>
  </div>

  <div class="payment-info">
    <h4>Datos para el Pago</h4>
    <p><strong>Banco:</strong> Banco Mercantil</p>
    <p><strong>Cuenta Corriente:</strong> 0105-0123-45-1234567890</p>
    <p><strong>A nombre de:</strong> GIP Asesores Integrales, C.A.</p>
    <p><strong>RIF:</strong> J-12345678-9</p>
    <p><em>Por favor, enviar comprobante de pago a nuestro correo o WhatsApp.</em></p>
  </div>

  <p class="body-text">
    Le recordamos la importancia de mantener su póliza al día para garantizar 
    la continuidad de su cobertura. En caso de requerir información adicional 
    o asistencia para realizar su pago, no dude en contactarnos.
  </p>

  <p class="body-text">
    Agradecemos su atención y confianza en nuestros servicios.
  </p>

  <div class="closing">
    <p>Atentamente,</p>
    <div class="signature">
      <div class="signature-line"></div>
      <p><strong>GIP Asesores Integrales</strong></p>
      <p>Departamento de Cobranzas</p>
    </div>
  </div>

  <div class="footer">
    <p>GIP Asesores Integrales, C.A. | Tel: 0212-XXX-XXXX | cobranzas@gipasesores.com</p>
  </div>
</body>
</html>
  `;

  // Create a new window for printing/PDF generation
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then trigger print dialog
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
    };
    
    // Fallback if onload doesn't fire
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  } else {
    // Fallback: download as HTML file
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
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
