import { ProcessedTransaction } from '@/lib/types';
import { format } from 'date-fns';
import { calculateCostBasis } from './costBasis';
import { calculateTaxSummary } from './csv';

/**
 * ANAF Form D212 XML Generator
 * Based on: d212_20250113.xsd (ANAF Schema 2025)
 * 
 * Generates XML compatible with DUKIntegrator validator
 */

interface PersonalData {
  nume: string;
  prenume: string;
  initiala: string;
  cnp: string;
  adresa: string;
  localitate: string;
  judet: string;
  codPostal: string;
  telefon: string;
  email: string;
}

interface D212XMLOptions {
  transactions: ProcessedTransaction[];
  personalData: PersonalData;
  walletAddress: string;
  fiscalYear: number;
}

// Tax constants - matching ANAF 2025
const MINIMUM_WAGE_2024_H2 = 3700;
const MINIMUM_WAGE_2025 = 3700;

/**
 * Generate ANAF D212 XML content
 */
export function generateD212XML(options: D212XMLOptions): string {
  const { transactions, personalData, fiscalYear } = options;
  
  const costBasis = calculateCostBasis(transactions);
  const summary = calculateTaxSummary(transactions);
  
  // Calculate values
  const stakingIncome = transactions
    .filter(tx => tx.label === 'Staking Reward' && tx.valueRON)
    .reduce((sum, tx) => sum + Math.round(tx.valueRON || 0), 0);
  
  const netCapitalGain = Math.max(0, Math.round(costBasis.totalNetGain));
  const totalTaxableIncome = netCapitalGain + stakingIncome;
  
  const minimumWage = fiscalYear >= 2025 ? MINIMUM_WAGE_2025 : MINIMUM_WAGE_2024_H2;
  const cassThreshold = minimumWage * 6;
  
  const incomeTax = totalTaxableIncome > 600 ? Math.round(totalTaxableIncome * 0.10) : 0;
  const owesCASS = totalTaxableIncome > cassThreshold;
  const cassAmount = owesCASS ? Math.round(Math.min(totalTaxableIncome, minimumWage * 24) * 0.10) : 0;
  
  // Get date range
  const dates = transactions.map(tx => tx.date).sort((a, b) => a.getTime() - b.getTime());
  const startDate = dates[0] || new Date();
  const formatDate = (date: Date): string => {
    return format(date, 'dd.MM.yyyy');
  };

  const fullAddress = [
    personalData.adresa,
    personalData.localitate,
    personalData.judet,
    personalData.codPostal
  ].filter(Boolean).join(', ');

  const fullName = [
    personalData.nume,
    personalData.initiala,
    personalData.prenume
  ].filter(Boolean).join(' ');

  // Define variables for XML attributes based on existing calculations
  const netIncome = netCapitalGain; // Corresponds to venit_net_anual
  const impozit = incomeTax; // Corresponds to impozit11
  const totalRevenue = Math.round(summary.totalReceived); // Corresponds to venit_brut
  const totalCostBasis = Math.round(summary.totalSent); // Corresponds to chelt_deduc

  // Build XML according to ANAF XSD schema
  // CRITICAL: Order of elements must be: oblig_realizat, oblig_estimat, cap11...
  // Attributes must use adresa_c (combined) and nume_c (combined) instead of granular fields
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<d212 xmlns="mfp:anaf:dgti:d212:declaratie:v9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="mfp:anaf:dgti:d212:declaratie:v9 d212.xsd"
      d_rec="0"
      rectif1="0"
      rectif2="0"
      totalPlata_A="12"
      luna_r="12"
      an_r="${fiscalYear}"
      bifa_succesor="0"
      anulare_litA="0"
      anulare_litB="0"
      bifa_conformare="0"
      bifa111="1"
      bifa112="0"
      bifa113="0"
      bifa121="0"
      bifa122="0"
      bifa131="0"
      bifa132="0"
      bifa14="0"
      bifa15="0"
      bifa18="0"
      nume_c="${escapeXML(fullName)}"
      cif="${personalData.cnp}"
      adresa_c="${escapeXML(fullAddress)}"
      telefon_c="${personalData.telefon || ''}"
      email_c="${escapeXML(personalData.email || '')}"
      nerezident="0">

  <oblig_realizat
    real_venit_net_recalculat_ai="${netIncome}"
    real_cas_deductibila_ai="0"
    real_cass_datorata_ai="0"
    oblimpoz_real_total="${impozit}"
    oblimpoz_real_anticipat="0"
    oblimpoz_real_dif_deplata="${impozit}"
    oblimpoz_real_dif_restituit="0"
    oblcas_real_difPlus="0"
    oblcas_real_str="0"
    oblcass_real_difPlus_ai="0"
    oblcass_real_difMinus_ai="0"
    oblcass_real_str="0"
    impozit_venit_plus="${impozit}"
    impozit_venit_minus="0"
    cas_plus="0"
    cass_plus="0"
    cass_minus="0"
    dif_de_plata="${impozit}"
    dif_de_restituit="0"
  />
  
  <cap11 
    scutire="0"
    reg="0"
    categ_venit="1016"
    det_ven_net="1"
    forma_org="1"
    mod_forma_org="0"
    caen="6201"
    descriere_sediu_bun="Tranzactii criptomonede - ${escapeXML(options.walletAddress.slice(0, 20))}..."
    data_incep="01.01.${fiscalYear}"
    data_sf="31.12.${fiscalYear}"
    nr_zile_scutite="0"
    venit_brut="${totalRevenue}"
    chelt_deduc="${totalCostBasis}"
    venit_net_anual="${netIncome}"
    pierdere="0"
    pierdere_precedenta="0"
    pierdere_compensata="0"
    venit_recalculat="${netIncome}"
    venit_redus="0"
    impozit11="${impozit}"
  />

</d212>`;

  return xml;
}

/**
 * Calculate checksum for ANAF (sum of digits)
 */
function calculateChecksum(value: number): number {
  const str = Math.abs(Math.round(value)).toString();
  return str.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0);
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download XML file
 */
export function downloadD212XML(content: string, walletAddress: string, fiscalYear: number): void {
  const blob = new Blob([content], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const shortAddr = `${walletAddress.slice(0, 4)}_${walletAddress.slice(-4)}`;
  const filename = `D212_${fiscalYear}_${shortAddr}.xml`;
  
  // Create link
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = filename;
  
  // Append to body (required for Firefox)
  document.body.appendChild(link);
  
  // Programmatic click
  link.click();
  
  // Clean up after a small delay to ensure download starts
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 100);
}
