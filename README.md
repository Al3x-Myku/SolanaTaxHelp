# SolTax RO 🇷🇴

**Raportare automată a tranzacțiilor Solana cu evaluări istorice în RON pentru conformitate ANAF.**

Automated Solana transaction reporting with historical RON (Romanian Leu) valuations for ANAF compliance.

## 🎯 Despre Proiect

SolTax RO este un instrument utilitar specializat pentru comunitatea Solana din România. Instrumentul permite oricărui utilizator să introducă adresa publică a portofelului și să genereze instant un raport CSV formatat, mapând fiecare tranzacție la prețul istoric al SOL/USDC/ETH în RON.

## 🚀 Ghid de Utilizare

### 1. Instalare

```bash
# Clonează repository-ul
git clone https://github.com/[username]/soltax-ro.git
cd soltax-ro

# Instalează dependențele
npm install

# Configurează variabilele de mediu
cp .env.example .env.local
# Editează .env.local cu cheile tale API
```

### 2. Configurare API Keys

Ai nevoie de:

- **Helius API Key** (gratuit): [helius.dev](https://helius.dev)
- **CoinGecko API Key** (opțional, gratuit): [coingecko.com](https://www.coingecko.com/en/api)

### 3. Rulare

```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000) în browser.

### 4. Generare Raport

1. Introdu adresa portofelului Solana
2. Așteaptă încărcarea tranzacțiilor
3. Etichetează tranzacțiile (Trade, Gift, Staking Reward, Payment)
4. Descarcă CSV-ul pentru ANAF

## 📊 Format CSV Export

| Coloană     | Descriere                  |
| ----------- | -------------------------- |
| Data        | Data tranzacției           |
| Tip         | Tipul tranzacției          |
| Suma        | Cantitatea de token        |
| Monedă      | SOL/USDC/etc               |
| Preț RON    | Prețul la data tranzacției |
| Valoare RON | Valoarea totală în RON     |
| Semnătură   | Transaction signature      |

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **APIs**: Helius RPC, CoinGecko
- **Deployment**: Vercel

## 📜 Licență

Acest proiect este 100% Open Source sub licența MIT.

---

**Construit cu ❤️ pentru comunitatea Solana din România**
