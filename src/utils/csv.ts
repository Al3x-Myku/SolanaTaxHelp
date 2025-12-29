import { ProcessedTransaction } from '@/lib/types';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export function generateCSV(transactions: ProcessedTransaction[]): string {
  // CSV Header in Romanian
  const headers = [
    'Data',
    'Tip',
    'Etichetă',
    'Suma',
    'Monedă',
    'Preț RON',
    'Valoare RON',
    'Direcție',
    'Taxă (SOL)',
    'Semnătură TX'
  ];

  const rows = transactions.map(tx => [
    format(tx.date, 'dd/MM/yyyy HH:mm', { locale: ro }),
    tx.type,
    tx.label,
    tx.amount.toFixed(6),
    tx.currency,
    tx.priceRON !== null ? tx.priceRON.toFixed(2) : 'N/A',
    tx.valueRON !== null ? tx.valueRON.toFixed(2) : 'N/A',
    translateDirection(tx.direction),
    (tx.fee / 1_000_000_000).toFixed(9),
    tx.signature
  ]);

  // Escape and format CSV
  const escapeField = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(escapeField).join(','))
  ].join('\n');

  // Add BOM for proper Romanian character encoding in Excel
  return '\uFEFF' + csvContent;
}

function translateDirection(direction: 'in' | 'out' | 'swap'): string {
  switch (direction) {
    case 'in': return 'Primit';
    case 'out': return 'Trimis';
    case 'swap': return 'Schimb';
    default: return direction;
  }
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function generateFilename(walletAddress: string): string {
  const date = format(new Date(), 'yyyy-MM-dd');
  const shortAddress = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;
  return `SolTax_RO_${shortAddress}_${date}.csv`;
}
