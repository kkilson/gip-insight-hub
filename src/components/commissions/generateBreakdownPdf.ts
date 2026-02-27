import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { BrokerSettings, getLogoBase64 } from '@/hooks/useBrokerSettings';

interface BreakdownEntry {
  policy_number: string;
  client_name: string;
  premium: number;
  commission_rate: number;
  advisor_percentage: number;
  advisor_amount: number;
}

interface BreakdownAdvisor {
  advisor_name: string;
  entries: BreakdownEntry[];
  total: number;
}

const COLORS = {
  primary: '#182746',
  accent: '#27abe3',
  secondary: '#40588c',
  text: '#2d3748',
  muted: '#64748b',
  lightGray: '#f8fafc',
  border: '#e2e8f0',
  white: '#ffffff',
};

function fmtCurrency(amount: number, symbol: string): string {
  return `${symbol}${amount.toLocaleString('es', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function generateBreakdownPdf(
  advisorData: BreakdownAdvisor,
  currencySymbol: string,
  brokerSettings?: BrokerSettings | null,
): Promise<void> {
  const today = format(new Date(), "d/M/yyyy", { locale: es });

  let logoHtml = '';
  if (brokerSettings?.logo_url) {
    const logoBase64 = await getLogoBase64(brokerSettings.logo_url);
    if (logoBase64) {
      logoHtml = `<img src="${logoBase64}" alt="Logo" style="max-height:60px;max-width:200px;object-fit:contain;" />`;
    }
  }

  const rows = advisorData.entries.map(e => `
    <tr>
      <td>${e.policy_number}</td>
      <td>${e.client_name}</td>
      <td class="num">${fmtCurrency(e.premium, currencySymbol)}</td>
      <td class="num">${e.advisor_percentage}%</td>
      <td class="num">${fmtCurrency(e.advisor_amount, currencySymbol)}</td>
    </tr>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Desglose - ${advisorData.advisor_name}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    @page { size:letter; margin:0.75in 1in; }
    body {
      font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
      font-size:10pt; line-height:1.6; color:${COLORS.text};
      background:${COLORS.white};
      -webkit-font-smoothing:antialiased;
    }
    .container { max-width:660px; margin:0 auto; padding:40px; }

    /* Header */
    .header {
      display:flex; justify-content:space-between; align-items:center;
      padding-bottom:20px; border-bottom:2px solid ${COLORS.accent};
      margin-bottom:28px;
    }
    .header-title {
      font-size:20pt; font-weight:700; color:${COLORS.primary};
      letter-spacing:0.3px;
    }

    /* Meta info */
    .meta { margin-bottom:24px; }
    .meta p { font-size:10.5pt; margin-bottom:4px; }
    .meta strong { color:${COLORS.primary}; font-weight:600; }

    /* Table */
    table {
      width:100%; border-collapse:collapse;
      margin-bottom:24px; font-size:9.5pt;
    }
    thead th {
      background:${COLORS.secondary}; color:${COLORS.white};
      padding:9px 12px; text-align:left; font-weight:500;
      font-size:9pt; letter-spacing:0.3px;
    }
    thead th:first-child { border-radius:4px 0 0 0; }
    thead th:last-child { border-radius:0 4px 0 0; }
    tbody td {
      padding:8px 12px; border-bottom:1px solid ${COLORS.border};
    }
    tbody tr:nth-child(even) { background:${COLORS.lightGray}; }
    .num { text-align:right; font-variant-numeric:tabular-nums; }

    /* Total row */
    .total-row {
      display:flex; justify-content:flex-end; align-items:center;
      padding:12px 16px; background:linear-gradient(135deg,${COLORS.primary}08,${COLORS.accent}10);
      border-radius:4px; border:1px solid ${COLORS.border};
    }
    .total-label { font-size:11pt; font-weight:500; color:${COLORS.primary}; margin-right:16px; }
    .total-value { font-size:14pt; font-weight:700; color:${COLORS.primary}; }

    /* Footer */
    .footer {
      margin-top:40px; padding-top:16px;
      border-top:1px solid ${COLORS.accent};
      text-align:center; font-size:8.5pt; color:${COLORS.muted};
    }

    @media print {
      body { -webkit-print-color-adjust:exact!important; print-color-adjust:exact!important; }
      .container { padding:0; max-width:none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <div>${logoHtml || ''}</div>
      <div class="header-title">Desglose de Comisiones</div>
    </header>

    <div class="meta">
      <p><strong>Asesor:</strong> ${advisorData.advisor_name}</p>
      <p><strong>Fecha:</strong> ${today}</p>
    </div>

    <table>
      <thead>
        <tr>
          <th>Nº Póliza</th>
          <th>Cliente</th>
          <th class="num">Prima</th>
          <th class="num">% Asesor</th>
          <th class="num">Monto Asesor</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="total-row">
      <span class="total-label">Total:</span>
      <span class="total-value">${fmtCurrency(advisorData.total, currencySymbol)}</span>
    </div>

    <footer class="footer">
      ${brokerSettings?.name ? `<p>${brokerSettings.name}</p>` : ''}
      ${[brokerSettings?.email, brokerSettings?.phone].filter(Boolean).length > 0
        ? `<p>${[brokerSettings?.email, brokerSettings?.phone].filter(Boolean).join(' · ')}</p>` : ''}
    </footer>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => setTimeout(() => printWindow.print(), 250);
  } else {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `desglose_${advisorData.advisor_name.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
