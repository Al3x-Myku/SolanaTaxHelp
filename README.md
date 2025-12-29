# SolTax RO 🇷🇴

Automated Solana transaction reporting with historical RON (Romanian Leu) valuations for ANAF compliance.

## About

SolTax RO is a free, open-source tool that helps Romanian Solana users generate tax reports. The tool:

- Fetches transaction history from any Solana wallet
- Calculates RON value at the date of each transaction
- Allows labeling transactions (Trade, Gift, Staking, Payment)
- Exports ANAF-ready CSV files

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/[username]/soltax-ro.git
cd soltax-ro
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure API key

Create `.env.local` in the project root:

```
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key
```

Get a free key at [helius.dev](https://helius.dev).

### 4. Run the server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How to Use

1. **Enter wallet address** - Paste your Solana public address
2. **Wait for loading** - Transactions and historical prices are fetched
3. **Label transactions** - Select type for each (Trade, Gift, etc.)
4. **Filter** - Use search or dropdowns to find specific transactions
5. **Export CSV** - Download the report for ANAF declaration

## CSV Format

| Column       | Description                                |
| ------------ | ------------------------------------------ |
| Data         | Transaction date and time                  |
| Tip          | Transaction type (SWAP, TRANSFER, etc.)    |
| Etichetă     | Your label (Trade, Gift, Staking, Payment) |
| Suma         | Crypto amount                              |
| Monedă       | Symbol (SOL, USDC, etc.)                   |
| Preț RON     | Exchange rate at transaction date          |
| Valoare RON  | Total value in RON                         |
| Direcție     | Received/Sent/Swap                         |
| Taxă (SOL)   | Network fee                                |
| Semnătură TX | Unique transaction ID                      |

## Tech Stack

- **Framework**: Next.js 16 + TypeScript
- **APIs**: Helius (transactions), CoinGecko (prices)
- **Deployment**: Vercel

## Security

- No private data stored
- API key stays local in `.env.local`
- 100% open source and auditable

## License

MIT License - Free for personal and commercial use.

---

**Built for the Romanian Solana community**
