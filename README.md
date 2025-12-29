# SolTax RO 🇷🇴

Raportare automată a tranzacțiilor Solana cu evaluări istorice în RON pentru conformitate ANAF.

## 📋 Despre

SolTax RO este un instrument gratuit și open-source care ajută utilizatorii Solana din România să genereze rapoarte fiscale. Instrumentul:

- Preia istoricul tranzacțiilor din orice portofel Solana
- Calculează valoarea în RON la data fiecărei tranzacții
- Permite etichetarea tranzacțiilor (Trade, Gift, Staking, Payment)
- Exportă un CSV gata pentru declarația ANAF

## 🚀 Rulare Locală

### 1. Clonează repository-ul

```bash
git clone https://github.com/[username]/soltax-ro.git
cd soltax-ro
```

### 2. Instalează dependențele

```bash
npm install
```

### 3. Configurează cheia API

Creează fișierul `.env.local` în rădăcina proiectului:

```
NEXT_PUBLIC_HELIUS_API_KEY=cheia_ta_helius
```

Poți obține o cheie gratuită de la [helius.dev](https://helius.dev).

### 4. Pornește serverul

```bash
npm run dev
```

Deschide [http://localhost:3000](http://localhost:3000).

## 📊 Cum Se Folosește

1. **Introdu adresa portofelului** - Copiază adresa publică Solana
2. **Așteaptă încărcarea** - Se preiau tranzacțiile și prețurile istorice
3. **Etichetează tranzacțiile** - Selectează tipul pentru fiecare (Trade, Gift, etc.)
4. **Filtrează** - Folosește căutarea sau filtrele pentru a găsi tranzacții specifice
5. **Exportă CSV** - Descarcă raportul pentru ANAF

## 📁 Format CSV

Fișierul exportat conține:

| Coloană      | Descriere                                         |
| ------------ | ------------------------------------------------- |
| Data         | Data și ora tranzacției                           |
| Tip          | Tipul tranzacției (SWAP, TRANSFER, etc.)          |
| Etichetă     | Clasificarea dvs. (Trade, Gift, Staking, Payment) |
| Suma         | Cantitatea de criptomonedă                        |
| Monedă       | Simbolul (SOL, USDC, etc.)                        |
| Preț RON     | Cursul la data tranzacției                        |
| Valoare RON  | Valoarea totală în lei                            |
| Direcție     | Primit/Trimis/Schimb                              |
| Taxă (SOL)   | Comisionul de rețea                               |
| Semnătură TX | Identificatorul unic al tranzacției               |

## 🛠️ Stack Tehnic

- **Framework**: Next.js 16 + TypeScript
- **APIs**: Helius (tranzacții), CoinGecko (prețuri)
- **Deployment**: Vercel

## 🔐 Securitate

- Aplicația nu stochează date private
- Cheia API rămâne locală în `.env.local`
- Codul sursă este 100% public și verificabil

## 📜 Licență

MIT License - Utilizare liberă, inclusiv comercială.

---

**Construit pentru comunitatea Solana din România**
