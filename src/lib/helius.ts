import { HeliusTransaction } from './types';

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
const HELIUS_BASE_URL = 'https://api.helius.xyz';

export async function getTransactionHistory(
  walletAddress: string,
  limit: number = 100
): Promise<HeliusTransaction[]> {
  if (!HELIUS_API_KEY) {
    throw new Error('Helius API key is not configured');
  }

  const allTransactions: HeliusTransaction[] = [];
  let lastSignature: string | undefined;
  const maxIterations = Math.ceil(limit / 100);

  for (let i = 0; i < maxIterations; i++) {
    const remaining = limit - allTransactions.length;
    const fetchLimit = Math.min(100, remaining);

    if (fetchLimit <= 0) break;

    const url = new URL(`${HELIUS_BASE_URL}/v0/addresses/${walletAddress}/transactions`);
    url.searchParams.set('api-key', HELIUS_API_KEY);
    url.searchParams.set('limit', fetchLimit.toString());
    
    if (lastSignature) {
      url.searchParams.set('before', lastSignature);
    }

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Helius API error: ${response.status} - ${errorText}`);
    }

    const transactions: HeliusTransaction[] = await response.json();

    if (transactions.length === 0) break;

    allTransactions.push(...transactions);
    lastSignature = transactions[transactions.length - 1].signature;

    // If we got fewer than requested, we've reached the end
    if (transactions.length < fetchLimit) break;
  }

  return allTransactions;
}

export function isValidSolanaAddress(address: string): boolean {
  // Base58 alphabet (no 0, O, I, l)
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  return base58Regex.test(address);
}

export function formatLamportsToSol(lamports: number): number {
  return lamports / 1_000_000_000;
}

export function shortenAddress(address: string, chars: number = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function getExplorerUrl(signature: string): string {
  return `https://solscan.io/tx/${signature}`;
}
