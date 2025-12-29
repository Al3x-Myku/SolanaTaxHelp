'use client';

import { useState, useCallback, useMemo } from 'react';
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
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [labelFilter, setLabelFilter] = useState<string>('all');

  const processTransactions = async (rawTxs: HeliusTransaction[], wallet: string): Promise<ProcessedTransaction[]> => {
    const processed: ProcessedTransaction[] = [];

    for (let i = 0; i < rawTxs.length; i++) {
      const tx = rawTxs[i];
      setProgress(`${i + 1}/${rawTxs.length}`);

      const date = new Date(tx.timestamp * 1000);

      let amount = 0;
      let currency = 'SOL';
      let direction: 'in' | 'out' | 'swap' = 'out';

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

      if (tx.type && tx.type.toLowerCase().includes('swap')) {
        direction = 'swap';
      }

      let priceRON: number | null = null;
      let valueRON: number | null = null;

      if (currency && COIN_IDS[currency]) {
        try {
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
    setProgress('Connecting...');

    try {
      const rawTransactions = await getTransactionHistory(address, 100);

      if (rawTransactions.length === 0) {
        setError('No transactions found for this wallet');
        setIsLoading(false);
        return;
      }

      setProgress(`Found ${rawTransactions.length}. Processing...`);
      const processed = await processTransactions(rawTransactions, address);
      
      setTransactions(processed);
      setProgress('');
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load transactions');
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

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch = 
          tx.signature.toLowerCase().includes(search) ||
          tx.type.toLowerCase().includes(search) ||
          tx.currency.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }
      
      // Type filter
      if (typeFilter !== 'all') {
        if (!tx.type.toLowerCase().includes(typeFilter.toLowerCase())) {
          return false;
        }
      }
      
      // Label filter
      if (labelFilter !== 'all') {
        if (tx.label !== labelFilter) return false;
      }
      
      return true;
    });
  }, [transactions, searchTerm, typeFilter, labelFilter]);

  // Stats
  const stats = useMemo(() => {
    const totalIn = filteredTransactions
      .filter(tx => tx.direction === 'in' && tx.valueRON)
      .reduce((sum, tx) => sum + (tx.valueRON || 0), 0);
    
    const totalOut = filteredTransactions
      .filter(tx => tx.direction === 'out' && tx.valueRON)
      .reduce((sum, tx) => sum + (tx.valueRON || 0), 0);
    
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [filteredTransactions]);

  // Get unique types for filter
  const uniqueTypes = useMemo(() => {
    const types = new Set(transactions.map(tx => tx.type));
    return Array.from(types).sort();
  }, [transactions]);

  return (
    <>
      <header className="header">
        <div className="container header-inner">
          <div className="logo">
            <div className="logo-icon">◎</div>
            SolTax RO
          </div>
          <nav className="nav-links">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://solscan.io" target="_blank" rel="noopener noreferrer">Solscan</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="container">
            <h1 className="hero-title">Raportare tranzacții Solana</h1>
            <p className="hero-subtitle">
              Generează rapoarte cu prețuri istorice RON pentru declarații ANAF
            </p>
            
            <div className="search-section">
              <WalletInput onSubmit={handleSearch} isLoading={isLoading} />
              {progress && <p className="progress">Processing: {progress}</p>}
              {error && <p className="error">{error}</p>}
            </div>
          </div>
        </section>

        {transactions.length > 0 && (
          <section className="container">
            {/* Stats */}
            <div className="stats-bar">
              <div className="stat">
                <span className="stat-label">Tranzacții</span>
                <span className="stat-value">{filteredTransactions.length}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Primit (RON)</span>
                <span className="stat-value positive">+{stats.totalIn.toFixed(2)}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Trimis (RON)</span>
                <span className="stat-value">{stats.totalOut.toFixed(2)}</span>
              </div>
            </div>

            {/* Filters + Export */}
            <div className="results-header">
              <div className="filters">
                <input
                  type="text"
                  placeholder="Caută..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="filter-input"
                />
                <select 
                  value={typeFilter} 
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Toate tipurile</option>
                  {uniqueTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <select 
                  value={labelFilter} 
                  onChange={(e) => setLabelFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Toate etichetele</option>
                  <option value="Trade">Trade</option>
                  <option value="Gift">Gift</option>
                  <option value="Staking Reward">Staking Reward</option>
                  <option value="Payment">Payment</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <ExportButton 
                transactions={filteredTransactions} 
                walletAddress={walletAddress}
              />
            </div>

            {/* Table */}
            <TransactionTable 
              transactions={filteredTransactions}
              onLabelChange={handleLabelChange}
            />
          </section>
        )}
      </main>

      <footer className="footer">
        <div className="container">
          <p className="footer-text">
            Open source · <a href="https://github.com">MIT License</a>
          </p>
        </div>
      </footer>
    </>
  );
}
