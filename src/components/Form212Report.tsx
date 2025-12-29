'use client';

import { ProcessedTransaction } from '@/lib/types';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { calculateTaxSummary } from '@/utils/csv';

interface Form212ReportProps {
  transactions: ProcessedTransaction[];
  walletAddress: string;
  onClose: () => void;
}

// 2024 tax constants
const MINIMUM_WAGE_2024 = 3300; // RON
const TAX_RATE = 0.10; // 10%
const CASS_RATE = 0.10; // 10%
const EXEMPT_PER_TX = 200; // RON
const EXEMPT_ANNUAL = 600; // RON

export default function Form212Report({ transactions, walletAddress, onClose }: Form212ReportProps) {
  const summary = calculateTaxSummary(transactions);
  
  // Calculate income categories
  const tradeIncome = transactions
    .filter(tx => tx.label === 'Trade' && tx.valueRON)
    .reduce((sum, tx) => sum + (tx.valueRON || 0), 0);
  
  const stakingIncome = transactions
    .filter(tx => tx.label === 'Staking Reward' && tx.valueRON)
    .reduce((sum, tx) => sum + (tx.valueRON || 0), 0);
  
  const giftIncome = transactions
    .filter(tx => tx.label === 'Gift' && tx.valueRON)
    .reduce((sum, tx) => sum + (tx.valueRON || 0), 0);

  const totalIncome = summary.totalReceived;
  const totalExpenses = summary.totalSent;
  const netGain = Math.max(0, totalIncome - totalExpenses);
  
  // Tax calculations
  const isExempt = netGain <= EXEMPT_ANNUAL;
  const taxableAmount = isExempt ? 0 : netGain;
  const incomeTax = taxableAmount * TAX_RATE;
  
  // CASS calculation (if income > 6 minimum wages)
  const cassTreshold = MINIMUM_WAGE_2024 * 6;
  const owessCASS = totalIncome > cassTreshold;
  const cassBase = owessCASS ? Math.min(totalIncome, MINIMUM_WAGE_2024 * 24) : 0;
  const cassAmount = cassBase * CASS_RATE;

  // Get date range
  const dates = transactions.map(tx => tx.date).sort((a, b) => a.getTime() - b.getTime());
  const startDate = dates[0] || new Date();
  const endDate = dates[dates.length - 1] || new Date();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="form212-overlay">
      <div className="form212-modal">
        <div className="form212-header">
          <h2>Declarația Unică - Formular 212</h2>
          <p>Secțiunea: Venituri din alte surse (criptomonede)</p>
          <div className="form212-actions no-print">
            <button onClick={handlePrint} className="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Printează
            </button>
            <button onClick={onClose} className="btn btn-secondary">Închide</button>
          </div>
        </div>

        <div className="form212-content">
          {/* Identification Section */}
          <section className="form-section">
            <h3>I. DATE DE IDENTIFICARE</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>Portofel Solana:</label>
                <span className="mono">{walletAddress}</span>
              </div>
              <div className="form-field">
                <label>Perioada raportată:</label>
                <span>{format(startDate, 'dd.MM.yyyy')} - {format(endDate, 'dd.MM.yyyy')}</span>
              </div>
              <div className="form-field">
                <label>Data generării:</label>
                <span>{format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ro })}</span>
              </div>
            </div>
          </section>

          {/* Income from Other Sources - Crypto */}
          <section className="form-section">
            <h3>II. VENITURI DIN ALTE SURSE</h3>
            <p className="section-note">Cap. I - Venituri realizate din transferul de monedă virtuală</p>
            
            <table className="form-table">
              <thead>
                <tr>
                  <th>Categorie venit</th>
                  <th>Valoare (RON)</th>
                  <th>Observații</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Câștiguri din tranzacționare (Trade)</td>
                  <td className="amount">{tradeIncome.toFixed(2)}</td>
                  <td>Diferența între prețul de vânzare și achiziție</td>
                </tr>
                <tr>
                  <td>Recompense Staking</td>
                  <td className="amount">{stakingIncome.toFixed(2)}</td>
                  <td>Impozabil la valoarea de piață la primire</td>
                </tr>
                <tr>
                  <td>Donații/Gift-uri primite</td>
                  <td className="amount">{giftIncome.toFixed(2)}</td>
                  <td>Valoare estimată la data primirii</td>
                </tr>
                <tr className="total-row">
                  <td><strong>TOTAL VENITURI</strong></td>
                  <td className="amount"><strong>{totalIncome.toFixed(2)}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Deductible Expenses */}
          <section className="form-section">
            <h3>III. CHELTUIELI DEDUCTIBILE</h3>
            <table className="form-table">
              <tbody>
                <tr>
                  <td>Plăți efectuate (transferuri, achiziții)</td>
                  <td className="amount">{totalExpenses.toFixed(2)}</td>
                </tr>
                <tr>
                  <td>Comisioane rețea (fees)</td>
                  <td className="amount">{(summary.totalFees * 1000).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Tax Calculation */}
          <section className="form-section highlight">
            <h3>IV. CALCULUL IMPOZITULUI PE VENIT</h3>
            
            <div className="tax-summary">
              <div className="tax-row">
                <span>Câștig net (Venituri - Cheltuieli):</span>
                <span className="amount">{netGain.toFixed(2)} RON</span>
              </div>
              
              {isExempt ? (
                <div className="tax-row exempt">
                  <span>⚠️ Scutit de impozit (sub {EXEMPT_ANNUAL} RON/an)</span>
                  <span className="amount">0.00 RON</span>
                </div>
              ) : (
                <>
                  <div className="tax-row">
                    <span>Baza impozabilă:</span>
                    <span className="amount">{taxableAmount.toFixed(2)} RON</span>
                  </div>
                  <div className="tax-row">
                    <span>Impozit pe venit (10%):</span>
                    <span className="amount highlight-value">{incomeTax.toFixed(2)} RON</span>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* CASS Section */}
          <section className="form-section">
            <h3>V. CONTRIBUȚIA LA ASIGURĂRILE SOCIALE DE SĂNĂTATE (CASS)</h3>
            
            <div className="cass-info">
              <p>Prag 6 salarii minime: {cassTreshold.toLocaleString('ro-RO')} RON</p>
              <p>Venit total: {totalIncome.toFixed(2)} RON</p>
              
              {owessCASS ? (
                <div className="tax-row warning">
                  <span>CASS datorat (10% din baza de calcul):</span>
                  <span className="amount">{cassAmount.toFixed(2)} RON</span>
                </div>
              ) : (
                <div className="tax-row exempt">
                  <span>Nu se datorează CASS (venit sub prag)</span>
                  <span className="amount">0.00 RON</span>
                </div>
              )}
            </div>
          </section>

          {/* Summary */}
          <section className="form-section summary-section">
            <h3>VI. SUMAR OBLIGAȚII FISCALE</h3>
            
            <table className="form-table summary-table">
              <tbody>
                <tr>
                  <td>Impozit pe venit (10%)</td>
                  <td className="amount">{incomeTax.toFixed(2)} RON</td>
                </tr>
                <tr>
                  <td>CASS (dacă aplicabil)</td>
                  <td className="amount">{cassAmount.toFixed(2)} RON</td>
                </tr>
                <tr className="total-row">
                  <td><strong>TOTAL DE PLATĂ</strong></td>
                  <td className="amount"><strong>{(incomeTax + cassAmount).toFixed(2)} RON</strong></td>
                </tr>
              </tbody>
            </table>

            <div className="deadline-notice">
              <p><strong>⏰ Termen limită:</strong> 25 Mai 2025</p>
              <p>Depunere: SPV (anaf.ro) sau fizic la ANAF</p>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="form-section disclaimer">
            <p>
              <strong>⚠️ ATENȚIE:</strong> Acest document este generat automat și are caracter informativ. 
              Calculele sunt estimative. Consultați un contabil autorizat pentru declarația oficială.
            </p>
            <p>
              Notă: Potrivit modificărilor din noiembrie 2024, câștigurile din criptomonede sunt 
              scutite temporar de impozit până la 31 iulie 2025.
            </p>
          </section>

          {/* Transaction Details */}
          <section className="form-section no-print">
            <h3>ANEXĂ: Detalii tranzacții ({transactions.length})</h3>
            <div className="tx-summary">
              <p>Tranzacții sub 200 RON (potențial scutite): {summary.exemptTransactions}</p>
              <p>Tranzacții taxabile: {summary.taxableTransactions}</p>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .form212-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          overflow-y: auto;
        }

        .form212-modal {
          background: white;
          color: #1a1a2e;
          max-width: 800px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        }

        .form212-header {
          background: #1a365d;
          color: white;
          padding: 24px;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .form212-header h2 {
          margin: 0 0 4px 0;
          font-size: 20px;
        }

        .form212-header p {
          margin: 0;
          opacity: 0.8;
          font-size: 14px;
        }

        .form212-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .form212-content {
          padding: 24px;
        }

        .form-section {
          margin-bottom: 24px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .form-section:last-child {
          border-bottom: none;
        }

        .form-section h3 {
          font-size: 14px;
          font-weight: 700;
          color: #1a365d;
          margin-bottom: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .section-note {
          font-size: 13px;
          color: #64748b;
          margin-bottom: 16px;
          font-style: italic;
        }

        .form-grid {
          display: grid;
          gap: 12px;
        }

        .form-field {
          display: flex;
          gap: 8px;
          font-size: 14px;
        }

        .form-field label {
          color: #64748b;
          min-width: 150px;
        }

        .mono {
          font-family: monospace;
          font-size: 12px;
          word-break: break-all;
        }

        .form-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .form-table th,
        .form-table td {
          padding: 10px 12px;
          text-align: left;
          border: 1px solid #e2e8f0;
        }

        .form-table th {
          background: #f8fafc;
          font-weight: 600;
          color: #334155;
        }

        .form-table .amount {
          text-align: right;
          font-family: monospace;
        }

        .total-row {
          background: #f1f5f9;
        }

        .tax-summary {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
        }

        .tax-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #e2e8f0;
        }

        .tax-row:last-child {
          border-bottom: none;
        }

        .tax-row.exempt {
          color: #059669;
        }

        .tax-row.warning {
          color: #dc2626;
        }

        .highlight-value {
          font-weight: 700;
          color: #dc2626;
        }

        .cass-info {
          background: #fef3c7;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #fcd34d;
        }

        .cass-info p {
          margin: 4px 0;
          font-size: 14px;
        }

        .summary-section .summary-table {
          background: #ecfdf5;
        }

        .summary-section .total-row {
          background: #059669;
          color: white;
        }

        .deadline-notice {
          margin-top: 16px;
          padding: 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          font-size: 14px;
        }

        .deadline-notice p {
          margin: 4px 0;
        }

        .disclaimer {
          background: #fffbeb;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #fde68a;
          font-size: 13px;
        }

        .disclaimer p {
          margin: 8px 0;
        }

        .tx-summary {
          font-size: 14px;
          color: #64748b;
        }

        .tx-summary p {
          margin: 4px 0;
        }

        @media print {
          .form212-overlay {
            position: static;
            background: white;
            padding: 0;
          }

          .form212-modal {
            max-height: none;
            box-shadow: none;
          }

          .no-print {
            display: none !important;
          }

          .form212-header {
            position: static;
            background: #1a365d !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}
