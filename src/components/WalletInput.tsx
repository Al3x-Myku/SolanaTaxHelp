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
      setError('Introdu adresa portofelului');
      return;
    }

    if (!isValidSolanaAddress(trimmedAddress)) {
      setError('Adresă Solana invalidă');
      return;
    }

    onSubmit(trimmedAddress);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="search-box">
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Adresa portofelului Solana..."
          className="search-input"
          disabled={isLoading}
          autoComplete="off"
          spellCheck="false"
        />
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={isLoading || !address.trim()}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Se încarcă
            </>
          ) : (
            'Caută'
          )}
        </button>
      </div>
      {error && <p className="error">{error}</p>}
    </form>
  );
}
