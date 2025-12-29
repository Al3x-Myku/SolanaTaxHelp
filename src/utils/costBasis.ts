import { ProcessedTransaction } from '@/lib/types';

/**
 * Cost Basis Calculator using FIFO (First-In, First-Out) method
 * 
 * For Romanian ANAF compliance:
 * - Tracks acquisition cost per token
 * - Calculates real gains/losses on disposal
 * - Supports multiple currencies
 */

export interface CostBasisLot {
  date: Date;
  amount: number;
  costPerUnit: number; // in RON
  totalCost: number;   // in RON
  currency: string;
  signature: string;
  remaining: number;   // amount still in lot
}

export interface DisposalEvent {
  date: Date;
  amount: number;
  proceedsPerUnit: number; // in RON
  totalProceeds: number;   // in RON
  costBasis: number;       // in RON (from matched lots)
  realizedGain: number;    // in RON (proceeds - cost)
  currency: string;
  signature: string;
  matchedLots: {
    lot: CostBasisLot;
    amountUsed: number;
    costUsed: number;
  }[];
}

export interface CostBasisSummary {
  currency: string;
  totalAcquired: number;
  totalDisposed: number;
  totalCostBasis: number;      // RON
  totalProceeds: number;       // RON
  realizedGains: number;       // RON
  realizedLosses: number;      // RON
  netGain: number;             // RON
  unrealizedHoldings: number;  // amount still held
  unrealizedCostBasis: number; // RON value of holdings
}

export interface PortfolioCostBasis {
  disposals: DisposalEvent[];
  summaryByCurrency: Map<string, CostBasisSummary>;
  totalNetGain: number;
  totalRealizedGains: number;
  totalRealizedLosses: number;
}

/**
 * Calculate cost basis using FIFO method
 */
export function calculateCostBasis(transactions: ProcessedTransaction[]): PortfolioCostBasis {
  // Sort transactions chronologically
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Track lots per currency
  const lots: Map<string, CostBasisLot[]> = new Map();
  const disposals: DisposalEvent[] = [];
  
  for (const tx of sorted) {
    const currency = tx.currency;
    
    if (!lots.has(currency)) {
      lots.set(currency, []);
    }
    
    if (tx.direction === 'in' && tx.amount > 0) {
      // Acquisition - add to lots
      const costPerUnit = tx.priceRON || 0;
      lots.get(currency)!.push({
        date: tx.date,
        amount: tx.amount,
        costPerUnit,
        totalCost: tx.amount * costPerUnit,
        currency,
        signature: tx.signature,
        remaining: tx.amount,
      });
    } else if (tx.direction === 'out' && tx.amount > 0) {
      // Disposal - match with FIFO lots
      const disposal = processDisposalFIFO(
        tx,
        lots.get(currency) || []
      );
      if (disposal) {
        disposals.push(disposal);
      }
    } else if (tx.direction === 'swap') {
      // Swap is both a disposal and acquisition
      // For simplicity, treat as disposal of the sent currency
      const disposal = processDisposalFIFO(
        tx,
        lots.get(currency) || []
      );
      if (disposal) {
        disposals.push(disposal);
      }
    }
  }
  
  // Calculate summary per currency
  const summaryByCurrency = calculateSummaries(lots, disposals);
  
  // Calculate totals
  let totalNetGain = 0;
  let totalRealizedGains = 0;
  let totalRealizedLosses = 0;
  
  summaryByCurrency.forEach(summary => {
    totalNetGain += summary.netGain;
    totalRealizedGains += summary.realizedGains;
    totalRealizedLosses += summary.realizedLosses;
  });
  
  return {
    disposals,
    summaryByCurrency,
    totalNetGain,
    totalRealizedGains,
    totalRealizedLosses,
  };
}

/**
 * Process a disposal using FIFO matching
 */
function processDisposalFIFO(
  tx: ProcessedTransaction,
  currencyLots: CostBasisLot[]
): DisposalEvent | null {
  if (tx.amount <= 0) return null;
  
  let amountToDispose = tx.amount;
  const proceeds = tx.priceRON || 0;
  const matchedLots: DisposalEvent['matchedLots'] = [];
  let totalCostBasis = 0;
  
  // FIFO: match with oldest lots first
  for (const lot of currencyLots) {
    if (amountToDispose <= 0) break;
    if (lot.remaining <= 0) continue;
    
    const amountFromLot = Math.min(lot.remaining, amountToDispose);
    const costFromLot = amountFromLot * lot.costPerUnit;
    
    matchedLots.push({
      lot,
      amountUsed: amountFromLot,
      costUsed: costFromLot,
    });
    
    lot.remaining -= amountFromLot;
    amountToDispose -= amountFromLot;
    totalCostBasis += costFromLot;
  }
  
  const totalProceeds = tx.amount * proceeds;
  const realizedGain = totalProceeds - totalCostBasis;
  
  return {
    date: tx.date,
    amount: tx.amount,
    proceedsPerUnit: proceeds,
    totalProceeds,
    costBasis: totalCostBasis,
    realizedGain,
    currency: tx.currency,
    signature: tx.signature,
    matchedLots,
  };
}

/**
 * Calculate summary statistics per currency
 */
function calculateSummaries(
  lots: Map<string, CostBasisLot[]>,
  disposals: DisposalEvent[]
): Map<string, CostBasisSummary> {
  const summaries = new Map<string, CostBasisSummary>();
  
  // Initialize from lots
  lots.forEach((currencyLots, currency) => {
    const totalAcquired = currencyLots.reduce((sum, lot) => sum + lot.amount, 0);
    const unrealizedHoldings = currencyLots.reduce((sum, lot) => sum + lot.remaining, 0);
    const unrealizedCostBasis = currencyLots.reduce(
      (sum, lot) => sum + (lot.remaining * lot.costPerUnit), 
      0
    );
    
    summaries.set(currency, {
      currency,
      totalAcquired,
      totalDisposed: 0,
      totalCostBasis: 0,
      totalProceeds: 0,
      realizedGains: 0,
      realizedLosses: 0,
      netGain: 0,
      unrealizedHoldings,
      unrealizedCostBasis,
    });
  });
  
  // Add disposal data
  for (const disposal of disposals) {
    const summary = summaries.get(disposal.currency);
    if (!summary) continue;
    
    summary.totalDisposed += disposal.amount;
    summary.totalCostBasis += disposal.costBasis;
    summary.totalProceeds += disposal.totalProceeds;
    
    if (disposal.realizedGain >= 0) {
      summary.realizedGains += disposal.realizedGain;
    } else {
      summary.realizedLosses += Math.abs(disposal.realizedGain);
    }
    
    summary.netGain = summary.realizedGains - summary.realizedLosses;
  }
  
  return summaries;
}

/**
 * Format cost basis for display
 */
export function formatCostBasisForDisplay(portfolio: PortfolioCostBasis): {
  disposals: Array<{
    date: string;
    currency: string;
    amount: string;
    proceeds: string;
    costBasis: string;
    gain: string;
    isProfit: boolean;
  }>;
  totalGain: string;
  isNetProfit: boolean;
} {
  return {
    disposals: portfolio.disposals.map(d => ({
      date: d.date.toLocaleDateString('ro-RO'),
      currency: d.currency,
      amount: d.amount.toFixed(4),
      proceeds: d.totalProceeds.toFixed(2) + ' RON',
      costBasis: d.costBasis.toFixed(2) + ' RON',
      gain: (d.realizedGain >= 0 ? '+' : '') + d.realizedGain.toFixed(2) + ' RON',
      isProfit: d.realizedGain >= 0,
    })),
    totalGain: (portfolio.totalNetGain >= 0 ? '+' : '') + portfolio.totalNetGain.toFixed(2) + ' RON',
    isNetProfit: portfolio.totalNetGain >= 0,
  };
}
