'use client';

import { useState } from 'react';
import { isValidSolanaAddress } from '@/lib/helius';

interface WalletInputProps {
  onSubmit: (address: string) => void;
  isLoading: boolean;
}

export default function WalletInput({ onSubmit, isLoading }: WalletInputProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedAddress = address.trim();
    
    if (!trimmedAddress) {
      setError('Te rog introdu adresa portofelului');
      return;
    }

    if (!isValidSolanaAddress(trimmedAddress)) {
      setError('Adresa Solana nu este validă');
      return;
    }

    onSubmit(trimmedAddress);
  };

  return (
    <form onSubmit={handleSubmit} className="wallet-input-form">
      <div className="input-wrapper">
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Introdu adresa portofelului Solana..."
          className="input wallet-input"
          disabled={isLoading}
          autoComplete="off"
          spellCheck="false"
        />
        <button 
          type="submit" 
          className="btn btn-primary submit-btn"
          disabled={isLoading || !address.trim()}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Se încarcă...
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.3-4.3"></path>
              </svg>
              Caută Tranzacții
            </>
          )}
        </button>
      </div>
      
      {error && (
        <p className="error-message">{error}</p>
      )}

      <style jsx>{`
        .wallet-input-form {
          width: 100%;
        }

        .input-wrapper {
          display: flex;
          gap: var(--spacing-md);
          width: 100%;
        }

        .wallet-input {
          flex: 1;
          min-width: 0;
        }

        .submit-btn {
          flex-shrink: 0;
          white-space: nowrap;
        }

        .error-message {
          color: var(--color-error);
          font-size: 0.875rem;
          margin-top: var(--spacing-sm);
        }

        @media (max-width: 640px) {
          .input-wrapper {
            flex-direction: column;
          }

          .submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </form>
  );
}
