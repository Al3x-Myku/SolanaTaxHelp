# SolTax RO 🇷🇴

Automated Solana transaction reporting with historical RON valuations for **ANAF Form 212** (Declarația Unică) compliance.

## ANAF Compliance

This tool generates CSV exports designed for Romanian crypto tax reporting:

| Requirement                           | Implementation                     |
| ------------------------------------- | ---------------------------------- |
| **Form 212** (Declarația Unică)       | ✅ All required columns included   |
| **10% tax rate** on gains             | ✅ Auto-calculated in summary      |
| **200 RON exemption** per transaction | ✅ Tracked separately              |
| **600 RON annual threshold**          | ✅ Warning included                |
| **RON valuation at tx date**          | ✅ Historical prices via CoinGecko |
| **Transaction categories**            | ✅ Mapped to ANAF categories       |

### Tax Categories Supported

- **Trade** → Vânzare/Cumpărare criptomonede
- **Gift** → Donație primită
- **Staking Reward** → Recompensă staking (venit la primire)
- **Payment** → Plată bunuri/servicii

### Important Deadlines

- **Deadline**: May 25th for previous year
- **Submission**: Via SPV (Spațiul Privat Virtual) or e-guvernare.ro

> ⚠️ **Disclaimer**: This tool provides estimates only. Consult a tax professional for your actual declaration.

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/[username]/soltax-ro.git
cd soltax-ro
npm install
```

### 2. Configure API Key

Create `.env.local`:

```
NEXT_PUBLIC_HELIUS_API_KEY=your_helius_key
```

Get free key: [helius.dev](https://helius.dev)

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## CSV Export Format

The exported CSV includes:

| Column           | Description                             |
| ---------------- | --------------------------------------- |
| Data Tranzacție  | Date & time (dd.MM.yyyy HH:mm:ss)       |
| Tip Operațiune   | Transaction type (SWAP, TRANSFER, etc.) |
| Clasificare      | ANAF category                           |
| Cantitate        | Crypto amount                           |
| Monedă/Token     | Symbol (SOL, USDC, etc.)                |
| Curs RON         | Historical RON rate                     |
| Valoare RON      | Total value in RON                      |
| Direcție         | Încasare / Plată / Schimb valutar       |
| Comision Rețea   | Network fee in SOL                      |
| Identificator TX | Transaction signature                   |

### Tax Summary Section

Each export includes:

- Total received/sent in RON
- Estimated capital gains
- Transactions under 200 RON (potentially exempt)
- Estimated 10% tax due

---

## Tech Stack

- **Next.js 16** + TypeScript
- **Helius API** - Transaction history
- **CoinGecko API** - Historical RON prices
- **Vercel** - Deployment

## License

MIT License - Free for personal and commercial use.

---

**Built for the Romanian Solana community** 🇷🇴
