'use client';

import { useState, useMemo } from 'react';
import { ProcessedTransaction } from '@/lib/types';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { calculateTaxSummary } from '@/utils/csv';
import { calculateCostBasis, PortfolioCostBasis } from '@/utils/costBasis';

interface Form212ReportProps {
  transactions: ProcessedTransaction[];
  walletAddress: string;
  onClose: () => void;
}

// Tax constants - ANAF Form 212 2025 (v1.0.3)
// Reference: structura_D212_2025_v1.0.3_01082025.pdf
const MINIMUM_WAGE_2024_H1 = 3300; // RON (Jan-Jun 2024)
const MINIMUM_WAGE_2024_H2 = 3700; // RON (Jul 2024+, per validator J10.0.0)
const MINIMUM_WAGE_2025 = 3700;    // RON (2025 - using latest known)
const TAX_RATE = 0.10;             // 10% impozit pe venit
const CASS_RATE = 0.10;            // 10% CASS
const EXEMPT_ANNUAL = 600;         // RON - prag scutire anuala

export default function Form212Report({ transactions, walletAddress, onClose }: Form212ReportProps) {
  // Personal data state
  const [nume, setNume] = useState('');
  const [prenume, setPrenume] = useState('');
  const [cnp, setCnp] = useState('');
  const [adresa, setAdresa] = useState('');
  const [localitate, setLocalitate] = useState('');
  const [judet, setJudet] = useState('');

  const summary = calculateTaxSummary(transactions);
  
  // Calculate cost basis using FIFO
  const costBasis: PortfolioCostBasis = useMemo(() => {
    return calculateCostBasis(transactions);
  }, [transactions]);
  
  // Use REAL gains from cost basis instead of simple income-expense
  const realizedGains = costBasis.totalRealizedGains;
  const realizedLosses = costBasis.totalRealizedLosses;
  const netCapitalGain = costBasis.totalNetGain;
  
  // Calculate income categories (for staking/gifts which are taxed at receipt)
  const stakingIncome = transactions
    .filter(tx => tx.label === 'Staking Reward' && tx.valueRON)
    .reduce((sum, tx) => sum + (tx.valueRON || 0), 0);
  
  const giftIncome = transactions
    .filter(tx => tx.label === 'Gift' && tx.valueRON)
    .reduce((sum, tx) => sum + (tx.valueRON || 0), 0);

  // Total taxable = capital gains + staking income (gifts may be exempt)
  const totalTaxableIncome = Math.max(0, netCapitalGain) + stakingIncome;
  
  // Tax calculations
  const isExempt = totalTaxableIncome <= EXEMPT_ANNUAL;
  const taxableAmount = isExempt ? 0 : totalTaxableIncome;
  const incomeTax = taxableAmount * TAX_RATE;
  
  // Get date range and determine fiscal year
  const dates = transactions.map(tx => tx.date).sort((a, b) => a.getTime() - b.getTime());
  const startDate = dates[0] || new Date();
  const endDate = dates[dates.length - 1] || new Date();
  
  // Determine fiscal year based on transaction dates
  const fiscalYear = endDate.getFullYear();
  
  // Select minimum wage based on fiscal year
  const minimumWage = fiscalYear >= 2025 ? MINIMUM_WAGE_2025 : 
                      fiscalYear === 2024 ? MINIMUM_WAGE_2024_H2 : MINIMUM_WAGE_2024_H1;
  
  // CASS calculation (if income > 6 minimum wages)
  const cassTreshold = minimumWage * 6;
  const owessCASS = totalTaxableIncome > cassTreshold;
  const cassBase = owessCASS ? Math.min(totalTaxableIncome, minimumWage * 24) : 0;
  const cassAmount = cassBase * CASS_RATE;
  const deadlineYear = fiscalYear + 1;
  const deadline = new Date(deadlineYear, 4, 25); // May 25 next year
  const now = new Date();
  const isPastDeadline = now > deadline;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="form212-overlay">
      <div className="form212-modal">
        <div className="form212-header">
          <h2>Declarația Unică - Formular 212</h2>
          <p>Venituri din alte surse (criptomonede) - Anul fiscal {fiscalYear}</p>
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
          {/* Personal Data Section */}
          <section className="form-section no-print">
            <h3>COMPLETEAZĂ DATELE PERSONALE</h3>
            <p className="section-note">Aceste date vor apărea pe declarație</p>
            
            <div className="personal-data-grid">
              <div className="input-group">
                <label>Nume *</label>
                <input 
                  type="text" 
                  value={nume} 
                  onChange={(e) => setNume(e.target.value)}
                  placeholder="ex: Popescu"
                />
              </div>
              <div className="input-group">
                <label>Prenume *</label>
                <input 
                  type="text" 
                  value={prenume} 
                  onChange={(e) => setPrenume(e.target.value)}
                  placeholder="ex: Ion"
                />
              </div>
              <div className="input-group">
                <label>CNP *</label>
                <input 
                  type="text" 
                  value={cnp} 
                  onChange={(e) => setCnp(e.target.value.replace(/\D/g, '').slice(0, 13))}
                  placeholder="1234567890123"
                  maxLength={13}
                />
              </div>
              <div className="input-group full-width">
                <label>Adresa (stradă, număr, bloc, scară, ap.)</label>
                <input 
                  type="text" 
                  value={adresa} 
                  onChange={(e) => setAdresa(e.target.value)}
                  placeholder="ex: Str. Libertății nr. 10, bl. A1, sc. 2, ap. 5"
                />
              </div>
              <div className="input-group">
                <label>Localitatea</label>
                <input 
                  type="text" 
                  value={localitate} 
                  onChange={(e) => setLocalitate(e.target.value)}
                  placeholder="ex: București"
                />
              </div>
              <div className="input-group">
                <label>Județul</label>
                <input 
                  type="text" 
                  value={judet} 
                  onChange={(e) => setJudet(e.target.value)}
                  placeholder="ex: Sector 1 / Ilfov"
                />
              </div>
            </div>
          </section>

          {/* Print version - Personal Data Display */}
          <section className="form-section print-only">
            <h3>DATE DE IDENTIFICARE CONTRIBUABIL</h3>
            <table className="form-table">
              <tbody>
                <tr>
                  <td style={{width: '30%'}}><strong>Nume și prenume:</strong></td>
                  <td>{nume || '_______________'} {prenume || '_______________'}</td>
                </tr>
                <tr>
                  <td><strong>CNP:</strong></td>
                  <td className="mono">{cnp || '_ _ _ _ _ _ _ _ _ _ _ _ _'}</td>
                </tr>
                <tr>
                  <td><strong>Adresa:</strong></td>
                  <td>{adresa || '________________________________'}</td>
                </tr>
                <tr>
                  <td><strong>Localitatea / Județul:</strong></td>
                  <td>{localitate || '__________'} / {judet || '__________'}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Wallet & Period Info */}
          <section className="form-section">
            <h3>INFORMAȚII PORTOFEL CRYPTO</h3>
            <div className="form-grid">
              <div className="form-field">
                <label>Portofel Solana:</label>
                <span className="mono">{walletAddress}</span>
              </div>
              <div className="form-field">
                <label>Anul fiscal:</label>
                <span><strong>{fiscalYear}</strong></span>
              </div>
              <div className="form-field">
                <label>Perioada tranzacțiilor:</label>
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
            <h3>VENITURI DIN ALTE SURSE (Cap. I - Monedă virtuală)</h3>
            
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
                  <td>Câștiguri realizate din tranzacționare</td>
                  <td className="amount">{realizedGains.toFixed(2)}</td>
                  <td>Diferență (preț vânzare - preț achiziție)</td>
                </tr>
                <tr>
                  <td>Pierderi realizate din tranzacționare</td>
                  <td className="amount" style={{color: '#dc2626'}}>-{realizedLosses.toFixed(2)}</td>
                  <td>Deductibile din câștiguri</td>
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
                  <td><strong>CÂȘTIG NET DIN CAPITAL</strong></td>
                  <td className="amount"><strong>{netCapitalGain.toFixed(2)}</strong></td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Cost Basis Details */}
          <section className="form-section">
            <h3>DETALII CALCUL CÂȘTIG</h3>
            <table className="form-table">
              <tbody>
                <tr>
                  <td>Total achiziții (cost basis)</td>
                  <td className="amount">{summary.totalSent.toFixed(2)} RON</td>
                </tr>
                <tr>
                  <td>Total vânzări (încasări)</td>
                  <td className="amount">{summary.totalReceived.toFixed(2)} RON</td>
                </tr>
                <tr>
                  <td>Comisioane rețea (fees)</td>
                  <td className="amount">{(summary.totalFees * 1000).toFixed(2)} RON</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Tax Calculation */}
          <section className="form-section highlight">
            <h3>CALCULUL IMPOZITULUI PE VENIT</h3>
            
            <div className="tax-summary">
              <div className="tax-row">
                <span>Câștig net din capital:</span>
                <span className="amount" style={{color: netCapitalGain >= 0 ? '#059669' : '#dc2626'}}>
                  {netCapitalGain >= 0 ? '+' : ''}{netCapitalGain.toFixed(2)} RON
                </span>
              </div>
              <div className="tax-row">
                <span>+ Venituri din staking:</span>
                <span className="amount">{stakingIncome.toFixed(2)} RON</span>
              </div>
              <div className="tax-row">
                <span><strong>Total venit impozabil:</strong></span>
                <span className="amount"><strong>{totalTaxableIncome.toFixed(2)} RON</strong></span>
              </div>
              
              {isExempt ? (
                <div className="tax-row exempt">
                  <span>✓ Scutit de impozit (sub {EXEMPT_ANNUAL} RON/an)</span>
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
            <h3>CONTRIBUȚIA LA ASIGURĂRILE SOCIALE DE SĂNĂTATE (CASS)</h3>
            
            <div className="cass-info">
              <p>Prag 6 salarii minime ({fiscalYear}): {cassTreshold.toLocaleString('ro-RO')} RON</p>
              <p>Venit impozabil total: {totalTaxableIncome.toFixed(2)} RON</p>
              
              {owessCASS ? (
                <div className="tax-row warning">
                  <span>CASS datorat (10%):</span>
                  <span className="amount">{cassAmount.toFixed(2)} RON</span>
                </div>
              ) : (
                <div className="tax-row exempt">
                  <span>✓ Nu se datorează CASS (venit sub prag)</span>
                  <span className="amount">0.00 RON</span>
                </div>
              )}
            </div>
          </section>

          {/* Summary */}
          <section className="form-section summary-section">
            <h3>SUMAR OBLIGAȚII FISCALE - ANUL {fiscalYear}</h3>
            
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

            <div className={`deadline-notice ${isPastDeadline ? 'past-deadline' : ''}`}>
              <p>
                <strong>⏰ Termen limită depunere:</strong> 25 Mai {deadlineYear}
                {isPastDeadline && <span className="deadline-warning"> (TRECUT!)</span>}
              </p>
              <p>
                {isPastDeadline 
                  ? `Atenție: Termenul pentru anul ${fiscalYear} a trecut. Depuneți cât mai curând pentru a evita penalități.`
                  : `Depunere: SPV (anaf.ro) sau fizic la ANAF`
                }
              </p>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="form-section disclaimer">
            <p>
              <strong>⚠️ ATENȚIE:</strong> Acest document este generat automat și are caracter informativ. 
              Calculele sunt estimative. <strong>Consultați un contabil autorizat</strong> pentru declarația oficială.
            </p>
            <p>
              <strong>Notă importantă:</strong> Potrivit Legii 296/2023 modificată în noiembrie 2024, 
              câștigurile din criptomonede realizate de persoane fizice sunt <strong>scutite temporar 
              de impozit până la 31 iulie 2025</strong>.
            </p>
          </section>

          {/* Transaction Summary */}
          <section className="form-section">
            <h3>ANEXĂ: SUMAR TRANZACȚII</h3>
            <div className="tx-summary">
              <p>Total tranzacții analizate: <strong>{transactions.length}</strong></p>
              <p>Tranzacții sub 200 RON (potențial scutite individual): {summary.exemptTransactions}</p>
              <p>Tranzacții peste 200 RON: {summary.taxableTransactions}</p>
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
          align-items: flex-start;
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
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
          margin: 20px 0;
        }

        .form212-header {
          background: #1a365d;
          color: white;
          padding: 24px;
          position: sticky;
          top: 0;
          z-index: 10;
          border-radius: 8px 8px 0 0;
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

        /* Personal Data Form */
        .personal-data-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .input-group.full-width {
          grid-column: 1 / -1;
        }

        .input-group label {
          font-size: 13px;
          color: #64748b;
          font-weight: 500;
        }

        .input-group input {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          font-size: 14px;
          background: #f8fafc;
        }

        .input-group input:focus {
          outline: none;
          border-color: #1a365d;
          background: white;
        }

        /* Print-only section */
        .print-only {
          display: none;
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
          flex-wrap: wrap;
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

        .form-table td {
          color: #1a1a2e;
        }

        .form-table tr:hover td {
          background: #f1f5f9;
          color: #1a1a2e;
        }

        .form-table .amount {
          text-align: right;
          font-family: monospace;
          color: #1a1a2e;
        }

        .total-row {
          background: #f1f5f9;
        }

        .total-row td {
          color: #1a1a2e !important;
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
          background: #ecfdf5;
          border: 1px solid #86efac;
          border-radius: 6px;
          font-size: 14px;
        }

        .deadline-notice.past-deadline {
          background: #fef2f2;
          border-color: #fecaca;
        }

        .deadline-warning {
          color: #dc2626;
          font-weight: 700;
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
          color: #374151;
        }

        .tx-summary p {
          margin: 6px 0;
        }

        @media print {
          .form212-overlay {
            position: static;
            background: white;
            padding: 0;
          }

          .form212-modal {
            box-shadow: none;
            border-radius: 0;
          }

          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          .form212-header {
            position: static;
            background: #1a365d !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            border-radius: 0;
          }

          .form-section {
            page-break-inside: avoid;
          }
        }

        @media (max-width: 640px) {
          .personal-data-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
