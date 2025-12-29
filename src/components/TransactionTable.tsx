'use client';

import { ProcessedTransaction, TransactionLabel } from '@/lib/types';
import { format } from 'date-fns';
import { getExplorerUrl, shortenAddress } from '@/lib/helius';

interface TransactionTableProps {
  transactions: ProcessedTransaction[];
  onLabelChange: (signature: string, label: TransactionLabel) => void;
}

const LABELS: TransactionLabel[] = ['Trade', 'Gift', 'Staking Reward', 'Payment', 'Other'];

export default function TransactionTable({ transactions, onLabelChange }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="empty">
        <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
          <rect width="6" height="4" x="9" y="3" rx="1"/>
        </svg>
        <p>Nu s-au găsit tranzacții</p>
      </div>
    );
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Data</th>
            <th>Tip</th>
            <th>Etichetă</th>
            <th>Sumă</th>
            <th>Preț RON</th>
            <th>Valoare RON</th>
            <th>TX</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <tr key={tx.signature}>
              <td>
                {format(tx.date, 'dd.MM.yyyy')}
                <br />
                <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>
                  {format(tx.date, 'HH:mm')}
                </span>
              </td>
              <td>
                <span className={`tag ${getTagClass(tx.type)}`}>
                  {tx.type.length > 12 ? tx.type.slice(0, 12) + '…' : tx.type}
                </span>
              </td>
              <td>
                <select
                  value={tx.label}
                  onChange={(e) => onLabelChange(tx.signature, e.target.value as TransactionLabel)}
                  className="label-select"
                >
                  {LABELS.map((label) => (
                    <option key={label} value={label}>{label}</option>
                  ))}
                </select>
              </td>
              <td>
                <span className={`amount ${tx.direction === 'in' ? 'positive' : tx.direction === 'out' ? 'negative' : ''}`}>
                  {tx.direction === 'in' ? '+' : tx.direction === 'out' ? '-' : ''}
                  {tx.amount.toFixed(4)} {tx.currency}
                </span>
              </td>
              <td className="price">
                {tx.priceRON !== null ? (
                  `${tx.priceRON.toFixed(2)}`
                ) : (
                  <span className="price-na">—</span>
                )}
              </td>
              <td className="price">
                {tx.valueRON !== null ? (
                  <strong>{tx.valueRON.toFixed(2)}</strong>
                ) : (
                  <span className="price-na">—</span>
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
    </div>
  );
}

function getTagClass(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('swap')) return 'tag-swap';
  if (t.includes('transfer')) return 'tag-transfer';
  if (t.includes('stake')) return 'tag-stake';
  return 'tag-unknown';
}
