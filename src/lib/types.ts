// Transaction types for the application

export interface TokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  fromTokenAccount?: string;
  toTokenAccount?: string;
  tokenAmount: number;
  mint: string;
  tokenSymbol?: string;
}

export interface NativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number; // in lamports
}

export interface HeliusTransaction {
  signature: string;
  timestamp: number;
  slot: number;
  type: string;
  source: string;
  description: string;
  fee: number;
  feePayer: string;
  nativeTransfers: NativeTransfer[];
  tokenTransfers: TokenTransfer[];
  transactionError?: { error: string };
}

export type TransactionLabel = 'Trade' | 'Gift' | 'Staking Reward' | 'Payment' | 'Other';

export interface ProcessedTransaction {
  signature: string;
  date: Date;
  type: string;
  description: string;
  amount: number;
  currency: string;
  priceRON: number | null;
  valueRON: number | null;
  direction: 'in' | 'out' | 'swap';
  label: TransactionLabel;
  fee: number;
  source: string;
}

export interface PriceData {
  [currency: string]: {
    ron: number;
    usd?: number;
  };
}

export interface HistoricalPrice {
  date: string;
  coinId: string;
  priceRON: number;
}

// CoinGecko coin IDs for common Solana tokens
export const COIN_IDS: Record<string, string> = {
  'SOL': 'solana',
  'So11111111111111111111111111111111111111112': 'solana', // Wrapped SOL
  'USDC': 'usd-coin',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'usd-coin', // USDC mint
  'USDT': 'tether',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'tether', // USDT mint
  'ETH': 'ethereum',
  'mSOL': 'msol',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'msol', // mSOL mint
  'RAY': 'raydium',
  'BONK': 'bonk',
  'JUP': 'jupiter-exchange-solana',
};

// Map mint addresses to symbols
export const MINT_TO_SYMBOL: Record<string, string> = {
  'So11111111111111111111111111111111111111112': 'SOL',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'mSOL',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'RAY',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
  'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN': 'JUP',
};
