import { ProcessedTransaction } from '@/lib/types';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

/**
 * ANAF Form 212 (Declarația Unică) Compliant CSV Export
 * 
 * Requirements:
 * - 10% tax on capital gains from crypto
 * - Gains under 200 RON per transaction exempt if total annual gains < 600 RON
 * - Must report: date, description, amount, acquisition cost, sale value, gain/loss
 */

export interface TaxSummary {
  totalReceived: number;
  totalSent: number;
  totalFees: number;
  estimatedGains: number;
  estimatedTax: number;
  exemptTransactions: number;
  taxableTransactions: number;
}

export function calculateTaxSummary(transactions: ProcessedTransaction[]): TaxSummary {
  let totalReceived = 0;
  let totalSent = 0;
  let totalFees = 0;
  let exemptTransactions = 0;
  let taxableTransactions = 0;

  transactions.forEach(tx => {
    const feeInSol = tx.fee / 1_000_000_000;
    totalFees += feeInSol;

    if (tx.valueRON !== null) {
      if (tx.direction === 'in') {
        totalReceived += tx.valueRON;
      } else if (tx.direction === 'out') {
        totalSent += tx.valueRON;
        
        // Check 200 RON per-transaction exemption
        if (tx.valueRON < 200) {
          exemptTransactions++;
        } else {
          taxableTransactions++;
        }
      }
    }
  });

  // Estimated gains (simplified - proper calculation needs cost basis)
  const estimatedGains = Math.max(0, totalReceived - totalSent);
  
  // 10% tax rate (only if total gains > 600 RON)
  const estimatedTax = estimatedGains > 600 ? estimatedGains * 0.10 : 0;

  return {
    totalReceived,
    totalSent,
    totalFees,
    estimatedGains,
    estimatedTax,
    exemptTransactions,
    taxableTransactions,
  };
}

export function generateCSV(transactions: ProcessedTransaction[]): string {
  const summary = calculateTaxSummary(transactions);
  
  // ANAF-compliant headers
  const headers = [
    'Data Tranzacție',           // Transaction date
    'Tip Operațiune',            // Operation type
    'Clasificare',               // Classification for Form 212
    'Cantitate',                 // Amount
    'Monedă/Token',              // Currency/Token
    'Curs RON (la data tx)',     // RON rate at transaction date
    'Valoare RON',               // Value in RON
    'Direcție',                  // Direction (In/Out/Swap)
    'Comision Rețea (SOL)',      // Network fee in SOL
    'Identificator Tranzacție',  // Transaction signature
    'Sursă',                     // Source (DEX, wallet, etc.)
  ];

  const rows = transactions.map(tx => [
    format(tx.date, 'dd.MM.yyyy HH:mm:ss', { locale: ro }),
    tx.type,
    mapLabelToANAF(tx.label),
    tx.amount.toFixed(8),
    tx.currency,
    tx.priceRON !== null ? tx.priceRON.toFixed(4) : 'N/A',
    tx.valueRON !== null ? tx.valueRON.toFixed(2) : 'N/A',
    translateDirection(tx.direction),
    (tx.fee / 1_000_000_000).toFixed(9),
    tx.signature,
    tx.source || 'Unknown',
  ]);

  const escapeField = (field: string): string => {
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes(';')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Build CSV with summary section
  const summarySection = [
    '',
    '--- SUMAR FISCAL (ESTIMATIV) ---',
    `Total Primit (RON);${summary.totalReceived.toFixed(2)}`,
    `Total Trimis (RON);${summary.totalSent.toFixed(2)}`,
    `Câștiguri Estimate (RON);${summary.estimatedGains.toFixed(2)}`,
    `Tranzacții sub 200 RON (potențial scutite);${summary.exemptTransactions}`,
    `Tranzacții taxabile;${summary.taxableTransactions}`,
    `Impozit Estimat 10% (RON);${summary.estimatedTax.toFixed(2)}`,
    '',
    'NOTĂ: Acest calcul este estimativ. Consultați un contabil pentru declarația Form 212.',
    `Perioada: ${format(transactions[transactions.length - 1]?.date || new Date(), 'dd.MM.yyyy')} - ${format(transactions[0]?.date || new Date(), 'dd.MM.yyyy')}`,
    `Generat: ${format(new Date(), 'dd.MM.yyyy HH:mm:ss')}`,
    '',
  ];

  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.map(escapeField).join(';')),
    ...summarySection,
  ].join('\n');

  // BOM for Excel UTF-8 compatibility
  return '\uFEFF' + csvContent;
}

function mapLabelToANAF(label: string): string {
  // Map to Form 212 categories
  switch (label) {
    case 'Trade':
      return 'Vânzare/Cumpărare criptomonede';
    case 'Gift':
      return 'Donație primită';
    case 'Staking Reward':
      return 'Recompensă staking (venit la primire)';
    case 'Payment':
      return 'Plată bunuri/servicii';
    default:
      return 'Altă operațiune';
  }
}

function translateDirection(direction: 'in' | 'out' | 'swap'): string {
  switch (direction) {
    case 'in': return 'Încasare';
    case 'out': return 'Plată';
    case 'swap': return 'Schimb valutar';
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
  return `SolTax_RO_Form212_${shortAddress}_${date}.csv`;
}
