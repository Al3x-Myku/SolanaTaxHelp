'use client';

import { useState, useCallback } from 'react';
import WalletInput from '@/components/WalletInput';
import TransactionTable from '@/components/TransactionTable';
import ExportButton from '@/components/ExportButton';
import { 
  ProcessedTransaction, 
  TransactionLabel, 
  HeliusTransaction, 
  MINT_TO_SYMBOL, 
  COIN_IDS 
} from '@/lib/types';
import { getTransactionHistory, formatLamportsToSol } from '@/lib/helius';
import { getPriceForToken } from '@/lib/coingecko';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState('');
  const [transactions, setTransactions] = useState<ProcessedTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');

  const processTransactions = async (rawTxs: HeliusTransaction[], wallet: string): Promise<ProcessedTransaction[]> => {
    const processed: ProcessedTransaction[] = [];

    for (let i = 0; i < rawTxs.length; i++) {
      const tx = rawTxs[i];
      setProgress(`Procesare tranzacție ${i + 1}/${rawTxs.length}...`);

      const date = new Date(tx.timestamp * 1000);

      // Determine transaction details
      let amount = 0;
      let currency = 'SOL';
      let direction: 'in' | 'out' | 'swap' = 'out';

      // Check for native SOL transfers
      if (tx.nativeTransfers && tx.nativeTransfers.length > 0) {
        for (const transfer of tx.nativeTransfers) {
          if (transfer.toUserAccount === wallet) {
            amount += formatLamportsToSol(transfer.amount);
            direction = 'in';
          } else if (transfer.fromUserAccount === wallet) {
            amount += formatLamportsToSol(transfer.amount);
            direction = 'out';
          }
        }
      }

      // Check for token transfers
      if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
        for (const transfer of tx.tokenTransfers) {
          if (transfer.toUserAccount === wallet) {
            amount = transfer.tokenAmount;
            currency = MINT_TO_SYMBOL[transfer.mint] || 'TOKEN';
            direction = 'in';
          } else if (transfer.fromUserAccount === wallet) {
            amount = transfer.tokenAmount;
            currency = MINT_TO_SYMBOL[transfer.mint] || 'TOKEN';
            direction = 'out';
          }
        }
      }

      // Determine if it's a swap
      if (tx.type && tx.type.toLowerCase().includes('swap')) {
        direction = 'swap';
      }

      // Try to get historical price
      let priceRON: number | null = null;
      let valueRON: number | null = null;

      // Get price for the currency (with rate limiting)
      if (currency && COIN_IDS[currency]) {
        try {
          // Only fetch price for every 5th transaction to avoid rate limits
          if (i % 5 === 0 || i < 5) {
            priceRON = await getPriceForToken(currency, date);
            if (priceRON !== null && amount > 0) {
              valueRON = priceRON * amount;
            }
          }
        } catch (e) {
          console.warn('Price fetch failed:', e);
        }
      }

      // Determine default label based on transaction type
      let defaultLabel: TransactionLabel = 'Other';
      const typeStr = (tx.type || '').toLowerCase();
      if (typeStr.includes('swap') || typeStr.includes('trade')) {
        defaultLabel = 'Trade';
      } else if (typeStr.includes('stake') || typeStr.includes('reward')) {
        defaultLabel = 'Staking Reward';
      } else if (typeStr.includes('transfer')) {
        defaultLabel = direction === 'in' ? 'Gift' : 'Payment';
      }

      processed.push({
        signature: tx.signature,
        date,
        type: tx.type || 'UNKNOWN',
        description: tx.description || '',
        amount: amount || 0,
        currency,
        priceRON,
        valueRON,
        direction,
        label: defaultLabel,
        fee: tx.fee || 0,
        source: tx.source || '',
      });
    }

    return processed;
  };

  const handleSearch = useCallback(async (address: string) => {
    setIsLoading(true);
    setError(null);
    setTransactions([]);
    setWalletAddress(address);
    setProgress('Se conectează la Helius...');

    try {
      setProgress('Se încarcă tranzacțiile...');
      const rawTransactions = await getTransactionHistory(address, 100);

      if (rawTransactions.length === 0) {
        setError('Nu s-au găsit tranzacții pentru acest portofel');
        setIsLoading(false);
        return;
      }

      setProgress(`S-au găsit ${rawTransactions.length} tranzacții. Se procesează...`);
      const processed = await processTransactions(rawTransactions, address);
      
      setTransactions(processed);
      setProgress('');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Eroare la încărcarea tranzacțiilor');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLabelChange = useCallback((signature: string, label: TransactionLabel) => {
    setTransactions(prev => 
      prev.map(tx => 
        tx.signature === signature ? { ...tx, label } : tx
      )
    );
  }, []);

  return (
    <main className="main">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="logo-badge">
              <span className="flag">🇷🇴</span>
              <span>Pentru România</span>
            </div>
            <h1>SolTax RO</h1>
            <p className="tagline">
              Raportare automată a tranzacțiilor Solana cu evaluări istorice în RON pentru conformitate ANAF
            </p>
            
            <div className="card search-card">
              <WalletInput onSubmit={handleSearch} isLoading={isLoading} />
              {progress && (
                <p className="progress-text">{progress}</p>
              )}
              {error && (
                <p className="error-text">{error}</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {transactions.length > 0 && (
        <section className="results">
          <div className="container">
            <div className="results-header">
              <div>
                <h2>Tranzacții găsite</h2>
                <p className="text-muted">
                  {transactions.length} tranzacții pentru {walletAddress.slice(0, 8)}...{walletAddress.slice(-4)}
                </p>
              </div>
              <ExportButton 
                transactions={transactions} 
                walletAddress={walletAddress}
              />
            </div>
            
            <div className="card mt-3">
              <TransactionTable 
                transactions={transactions}
                onLabelChange={handleLabelChange}
              />
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      {transactions.length === 0 && !isLoading && (
        <section className="features">
          <div className="container">
            <div className="features-grid">
              <div className="feature-card card">
                <div className="feature-icon">📊</div>
                <h3>Prețuri Istorice RON</h3>
                <p>Evaluări automate ale tranzacțiilor la cursul din momentul efectuării</p>
              </div>
              <div className="feature-card card">
                <div className="feature-icon">🏷️</div>
                <h3>Clasificare Flexibilă</h3>
                <p>Etichetează tranzacțiile ca Trade, Gift, Staking sau Plată</p>
              </div>
              <div className="feature-card card">
                <div className="feature-icon">📁</div>
                <h3>Export CSV</h3>
                <p>Descarcă raportul pregătit pentru declarația ANAF</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>
            Construit cu ❤️ pentru comunitatea Solana din România
          </p>
          <p className="text-muted">
            Open Source • MIT License
          </p>
        </div>
      </footer>

      <style jsx>{`
        .main {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .hero {
          padding: var(--spacing-3xl) 0;
          text-align: center;
        }

        .hero-content {
          max-width: 700px;
          margin: 0 auto;
        }

        .logo-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-sm);
          background: var(--color-bg-tertiary);
          padding: var(--spacing-sm) var(--spacing-md);
          border-radius: var(--radius-xl);
          font-size: 0.875rem;
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-lg);
        }

        .flag {
          font-size: 1.25rem;
        }

        h1 {
          margin-bottom: var(--spacing-md);
        }

        .tagline {
          color: var(--color-text-secondary);
          font-size: 1.125rem;
          margin-bottom: var(--spacing-xl);
          line-height: 1.6;
        }

        .search-card {
          text-align: left;
        }

        .progress-text {
          margin-top: var(--spacing-md);
          color: var(--color-accent-secondary);
          font-size: 0.875rem;
        }

        .error-text {
          margin-top: var(--spacing-md);
          color: var(--color-error);
          font-size: 0.875rem;
        }

        .results {
          flex: 1;
          padding: var(--spacing-xl) 0 var(--spacing-3xl);
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .features {
          padding: var(--spacing-2xl) 0 var(--spacing-3xl);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: var(--spacing-lg);
        }

        .feature-card {
          text-align: center;
          padding: var(--spacing-xl);
        }

        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: var(--spacing-md);
        }

        .feature-card h3 {
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-primary);
        }

        .feature-card p {
          color: var(--color-text-secondary);
          font-size: 0.9rem;
        }

        .footer {
          padding: var(--spacing-xl) 0;
          text-align: center;
          border-top: 1px solid var(--color-border);
          margin-top: auto;
        }

        .footer p {
          margin-bottom: var(--spacing-sm);
        }

        @media (max-width: 640px) {
          .results-header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </main>
  );
}
