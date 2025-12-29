'use client';

import { ProcessedTransaction } from '@/lib/types';
import { generateCSV, downloadCSV, generateFilename } from '@/utils/csv';

interface ExportButtonProps {
  transactions: ProcessedTransaction[];
  walletAddress: string;
  disabled?: boolean;
}

export default function ExportButton({ transactions, walletAddress, disabled }: ExportButtonProps) {
  const handleExport = () => {
    if (transactions.length === 0) return;

    const csvContent = generateCSV(transactions);
    const filename = generateFilename(walletAddress);
    downloadCSV(csvContent, filename);
  };

  return (
    <button
      onClick={handleExport}
      className="btn btn-success export-btn"
      disabled={disabled || transactions.length === 0}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Descarcă CSV pentru ANAF
      {transactions.length > 0 && (
        <span className="count">({transactions.length})</span>
      )}

      <style jsx>{`
        .export-btn {
          font-weight: 600;
        }

        .count {
          opacity: 0.8;
          font-weight: 400;
        }
      `}</style>
    </button>
  );
}
