import { COIN_IDS } from './types';
import { format } from 'date-fns';

// In-memory cache for historical prices
const priceCache: Map<string, number> = new Map();

function getCacheKey(coinId: string, date: Date): string {
  return `${coinId}-${format(date, 'dd-MM-yyyy')}`;
}

export async function getHistoricalPrice(
  coinId: string,
  date: Date
): Promise<number | null> {
  const cacheKey = getCacheKey(coinId, date);
  
  // Check cache first
  if (priceCache.has(cacheKey)) {
    console.log(`[Cache Hit] ${cacheKey}`);
    return priceCache.get(cacheKey)!;
  }

  try {
    const dateStr = format(date, 'dd-MM-yyyy');
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${dateStr}&localization=false`;

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('CoinGecko rate limit reached, waiting...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        return getHistoricalPrice(coinId, date); // Retry
      }
      console.error(`CoinGecko API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    if (!data.market_data?.current_price?.ron) {
      // If RON is not available, try to calculate from USD
      if (data.market_data?.current_price?.usd) {
        // Fetch USD/RON rate (approximate, could be enhanced with BNR API)
        const usdPrice = data.market_data.current_price.usd;
        const ronRate = await getUsdToRonRate(date);
        const ronPrice = usdPrice * ronRate;
        priceCache.set(cacheKey, ronPrice);
        return ronPrice;
      }
      return null;
    }

    const ronPrice = data.market_data.current_price.ron;
    priceCache.set(cacheKey, ronPrice);
    
    return ronPrice;
  } catch (error) {
    console.error(`Error fetching price for ${coinId}:`, error);
    return null;
  }
}

// Fallback USD to RON rate (can be enhanced with BNR API)
async function getUsdToRonRate(date: Date): Promise<number> {
  // Using a reasonable average rate as fallback
  // In production, this should use BNR API for historical rates
  // Current approximate rate as of 2024
  return 4.57;
}

export async function getPriceForToken(
  tokenSymbolOrMint: string,
  date: Date
): Promise<number | null> {
  const coinId = COIN_IDS[tokenSymbolOrMint];
  
  if (!coinId) {
    console.warn(`Unknown token: ${tokenSymbolOrMint}`);
    return null;
  }

  return getHistoricalPrice(coinId, date);
}

// Get current price (for display purposes)
export async function getCurrentPrice(coinId: string): Promise<number | null> {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=ron`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data[coinId]?.ron || null;
  } catch (error) {
    console.error(`Error fetching current price for ${coinId}:`, error);
    return null;
  }
}

// Batch price fetching with rate limiting
export async function batchGetHistoricalPrices(
  requests: Array<{ coinId: string; date: Date }>
): Promise<Map<string, number | null>> {
  const results = new Map<string, number | null>();
  
  // Process in batches to avoid rate limits
  const batchSize = 10;
  const delayBetweenBatches = 2000; // 2 seconds

  for (let i = 0; i < requests.length; i += batchSize) {
    const batch = requests.slice(i, i + batchSize);
    
    const batchResults = await Promise.all(
      batch.map(async ({ coinId, date }) => {
        const price = await getHistoricalPrice(coinId, date);
        return { key: getCacheKey(coinId, date), price };
      })
    );

    batchResults.forEach(({ key, price }) => {
      results.set(key, price);
    });

    // Wait between batches to avoid rate limiting
    if (i + batchSize < requests.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return results;
}
