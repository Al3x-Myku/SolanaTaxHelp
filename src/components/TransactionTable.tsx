'use client';

import { ProcessedTransaction, TransactionLabel } from '@/lib/types';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { getExplorerUrl, shortenAddress } from '@/lib/helius';

interface TransactionTableProps {
  transactions: ProcessedTransaction[];
  onLabelChange: (signature: string, label: TransactionLabel) => void;
}

const LABELS: TransactionLabel[] = ['Trade', 'Gift', 'Staking Reward', 'Payment', 'Other'];

const LABEL_COLORS: Record<TransactionLabel, string> = {
  'Trade': 'badge-trade',
  'Gift': 'badge-transfer',
  'Staking Reward': 'badge-staking',
  'Payment': 'badge-payment',
  'Other': '',
};

export default function TransactionTable({ transactions, onLabelChange }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
          <rect width="6" height="4" x="9" y="3" rx="1"/>
          <path d="M9 14h.01"/>
          <path d="M13 14h.01"/>
          <path d="M9 17h.01"/>
          <path d="M13 17h.01"/>
        </svg>
        <p>Nu există tranzacții de afișat</p>

        <style jsx>{`
          .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-3xl);
            color: var(--color-text-muted);
            gap: var(--spacing-md);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Tip</th>
            <th>Etichetă</th>
            <th>Suma</th>
            <th>Preț RON</th>
            <th>Valoare RON</th>
            <th>TX</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.signature}>
              <td className="text-mono">
                {format(tx.date, 'dd MMM yyyy', { locale: ro })}
                <br />
                <small className="text-muted">{format(tx.date, 'HH:mm')}</small>
              </td>
              <td>
                <span className={`badge ${getBadgeClass(tx.type)}`}>
                  {tx.type}
                </span>
              </td>
              <td>
                <select
                  value={tx.label}
                  onChange={(e) => onLabelChange(tx.signature, e.target.value as TransactionLabel)}
                  className="select"
                >
                  {LABELS.map((label) => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
              </td>
              <td className="text-mono">
                <span className={tx.direction === 'in' ? 'text-success' : ''}>
                  {tx.direction === 'in' ? '+' : tx.direction === 'out' ? '-' : '↔'}
                  {tx.amount.toFixed(4)}
                </span>
                <br />
                <small className="text-muted">{tx.currency}</small>
              </td>
              <td className="text-mono">
                {tx.priceRON !== null ? (
                  `${tx.priceRON.toFixed(2)} RON`
                ) : (
                  <span className="text-muted">N/A</span>
                )}
              </td>
              <td className="text-mono">
                {tx.valueRON !== null ? (
                  <strong>{tx.valueRON.toFixed(2)} RON</strong>
                ) : (
                  <span className="text-muted">N/A</span>
                )}
              </td>
              <td>
                <a 
                  href={getExplorerUrl(tx.signature)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="tx-link"
                  title={tx.signature}
                >
                  {shortenAddress(tx.signature, 4)}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <style jsx>{`
        .tx-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-family: var(--font-mono);
          font-size: 0.8rem;
        }

        .tx-link:hover {
          color: var(--color-accent-primary);
        }

        small {
          font-size: 0.75rem;
        }
      `}</style>
    </div>
  );
}

function getBadgeClass(type: string): string {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('swap') || lowerType.includes('trade')) return 'badge-trade';
  if (lowerType.includes('transfer')) return 'badge-transfer';
  if (lowerType.includes('stake') || lowerType.includes('reward')) return 'badge-staking';
  return 'badge-payment';
}
