/**
 * Wage and Allowance Calculation Engine for YW Construction (양우종합건설)
 * Standard Version: v2026.04-STD
 * 
 * Rules:
 * 1. 10-won rounding: Excel ROUND(formula, -1). Intermediate values unrounded.
 * 2. Statutory overtime: ROUND(monthly / 295 * 48, -1)
 * 3. Statutory holiday: ROUND(monthly / 295 * 30, -1)
 * 4. Annual leave: ROUND(monthly / 295 * 8, -1)
 * 5. Allowances by WorkType (본사임원, 현장임원, 본사직원, 현장직원, 현장PJT)
 * 6. Base pay = ROUND(monthly - sum(allowances), -1)
 * 7. Exact sum verification: basePay + sum(allowances) === monthly
 */

import { LicenseInfo, WageDetails, WorkType } from '../types/contract';

export const CALCULATION_VERSION = 'v2026.04-STD';
export const MIN_HOURLY_WAGE_2026 = 10030; // 2026년 최저시급

/**
 * Excel-identical ROUND(number, -1) implementation for 10-won units
 */
export function excelRound10(val: number): number {
  if (isNaN(val) || !isFinite(val)) return 0;
  // Handle IEEE floating precision before dividing/multiplying
  const rounded = Math.round(val / 10) * 10;
  return rounded;
}

/**
 * Convert integer won to Korean text representation
 * e.g., 7,000,000 -> "칠백만", 84,000,000 -> "팔천사백만"
 */
export function formatKoreanWonText(amount: number): string {
  if (!amount || amount === 0) return '영';
  const units = ['', '만', '억', '조'];
  const digits = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  const smallUnits = ['', '십', '백', '천'];

  let result = '';
  let unitIdx = 0;
  let num = Math.floor(Math.abs(amount));

  while (num > 0) {
    const chunk = num % 10000;
    if (chunk > 0) {
      let chunkStr = '';
      let temp = chunk;
      for (let i = 0; i < 4; i++) {
        const d = temp % 10;
        if (d > 0) {
          const digitChar = (i > 0 && d === 1) ? '' : digits[d];
          chunkStr = digitChar + smallUnits[i] + chunkStr;
        }
        temp = Math.floor(temp / 10);
      }
      result = chunkStr + units[unitIdx] + (result ? ' ' + result : '');
    }
    num = Math.floor(num / 10000);
    unitIdx++;
  }

  return (amount < 0 ? '마이너스 ' : '') + result + '원정';
}

/**
 * Calculate performance bonus (성과급) based on rank
 * Only for '본사직원', '현장직원'
 */
export function getPerformanceBonus(workType: WorkType, jobTitle: string): number {
  if (workType !== '본사직원' && workType !== '현장직원') {
    return 0;
  }

  const title = (jobTitle || '').trim();
  if (title.includes('부장')) return 450000;
  if (title.includes('차장')) return 400000;
  if (title.includes('과장')) return 350000;
  if (title.includes('대리')) return 200000;
  if (title.includes('주임')) return 150000;
  if (title.includes('사원')) return 150000;

  return 0;
}

/**
 * Calculate license allowance (면허수당)
 * Only for '본사직원', '현장직원'
 * Highest 1 license only (no duplicate payment)
 * 기사 10 years test based on contract or reference date
 */
export function getLicenseAllowance(
  workType: WorkType,
  license?: LicenseInfo,
  contractDateStr: string = '2026-04-01'
): number {
  if (workType !== '본사직원' && workType !== '현장직원') {
    return 0;
  }
  if (!license || !license.grade || license.grade === '없음') {
    return 0;
  }

  switch (license.grade) {
    case '기술사':
      return 300000;
    case '기사': {
      // Calculate years elapsed from acquiredDate to contractDate
      let years = license.yearsFromAcquisition;
      if (license.acquiredDate && (!years || years === 0)) {
        const acqYear = new Date(license.acquiredDate).getFullYear();
        const curYear = new Date(contractDateStr).getFullYear();
        years = Math.max(0, curYear - acqYear);
      }
      return years >= 10 ? 70000 : 50000;
    }
    case '산업기사':
      return 30000;
    case '기능사':
      return 20000;
    default:
      return 0;
  }
}

/**
 * Calculate Site Allowance (현장수당)
 * 100,000 won for '현장임원', '현장직원', '현장PJT'
 * 0 won for '본사임원', '본사직원'
 * Exception: if actual duty is at headquarters despite being field worker, 0.
 */
export function getSiteAllowance(
  workType: WorkType, 
  isActuallyWorkingAtHeadquarters: boolean = false
): number {
  if (isActuallyWorkingAtHeadquarters) return 0;
  if (workType === '현장임원' || workType === '현장직원' || workType === '현장PJT') {
    return 100000;
  }
  return 0;
}

/**
 * Calculate Position Allowance (직책수당)
 * 500,000 won if field worker (현장임원, 현장직원, 현장PJT) and duty is '현장소장'
 * 0 won otherwise
 */
export function getPositionAllowance(
  workType: WorkType, 
  duty: string = ''
): number {
  const isField = workType === '현장임원' || workType === '현장직원' || workType === '현장PJT';
  if (isField && duty.includes('현장소장')) {
    return 500000;
  }
  return 0;
}

/**
 * Calculate Meal Allowance (식대)
 * 200,000 won only for '본사임원', '본사직원'
 * 0 won for others
 */
export function getMealAllowance(workType: WorkType): number {
  if (workType === '본사임원' || workType === '본사직원') {
    return 200000;
  }
  return 0;
}

/**
 * Full Wage Calculation & Validation Function
 * Evaluates monthly salary, breakdown, 10-won check, and base pay integrity
 */
export function calculateWageDetails(params: {
  workType: WorkType;
  monthlySalary?: number;
  annualSalary?: number;
  jobTitle?: string;
  duty?: string;
  license?: LicenseInfo;
  isHeadquarters?: boolean;
  contractDateStr?: string;
  excelInputBasePay?: number; // Optional: value from uploaded Excel for comparison
}): {
  wage: WageDetails;
  isValid: boolean;
  errors: string[];
  discrepancies: string[];
} {
  const errors: string[] = [];
  const discrepancies: string[] = [];

  let monthlySalary = params.monthlySalary || 0;
  let annualSalary = params.annualSalary || 0;

  // Derive monthly from annual or vice versa
  if (monthlySalary > 0 && (!annualSalary || annualSalary === 0)) {
    annualSalary = monthlySalary * 12;
  } else if (annualSalary > 0 && (!monthlySalary || monthlySalary === 0)) {
    monthlySalary = Math.round(annualSalary / 12);
  }

  // 1. Check if monthly salary is 10-won rounded
  if (monthlySalary % 10 !== 0) {
    errors.push(`월임금(${monthlySalary.toLocaleString()}원)이 10원 단위가 아닙니다. 임의 절사하지 않고 입력 오류로 처리합니다.`);
  }

  if (monthlySalary <= 0) {
    errors.push('월임금 또는 연봉총액이 0원 이하입니다.');
  }

  // 2. Fixed statutory overtime, holiday, annual leave (unrounded inside, ROUND -1 at end)
  const fixedOtPay = excelRound10((monthlySalary / 295) * 48);
  const fixedHolidayPay = excelRound10((monthlySalary / 295) * 30);
  const annualLeavePay = excelRound10((monthlySalary / 295) * 8);

  // 3. Conditional allowances
  const performanceBonus = getPerformanceBonus(params.workType, params.jobTitle || '');
  const licenseAllowance = getLicenseAllowance(
    params.workType, 
    params.license, 
    params.contractDateStr
  );
  const siteAllowance = getSiteAllowance(params.workType, params.isHeadquarters);
  const positionAllowance = getPositionAllowance(params.workType, params.duty);
  const mealAllowance = getMealAllowance(params.workType);

  // Sum of all allowances
  const sumAllowances = 
    performanceBonus +
    licenseAllowance +
    siteAllowance +
    positionAllowance +
    fixedOtPay +
    fixedHolidayPay +
    annualLeavePay +
    mealAllowance;

  // Base Pay = ROUND(monthly - sum(allowances), -1)
  const basePay = excelRound10(monthlySalary - sumAllowances);

  // 4. Verification: basePay + sumAllowances === monthlySalary
  const calculatedSum = basePay + sumAllowances;
  const isVerified10Won = calculatedSum === monthlySalary;

  if (!isVerified10Won) {
    const diff = calculatedSum - monthlySalary;
    errors.push(`반올림된 기준급(${basePay.toLocaleString()}원)과 제수당 합계(${sumAllowances.toLocaleString()}원)의 합계(${calculatedSum.toLocaleString()}원)가 월임금(${monthlySalary.toLocaleString()}원)과 ${diff > 0 ? '+' : ''}${diff.toLocaleString()}원 불일치합니다.`);
  }

  if (basePay < 0) {
    errors.push(`제수당 합계(${sumAllowances.toLocaleString()}원)가 월임금(${monthlySalary.toLocaleString()}원)을 초과하여 기준급이 음수(${basePay.toLocaleString()}원)입니다.`);
  }

  // 5. Excel input comparison if provided
  if (params.excelInputBasePay !== undefined && params.excelInputBasePay > 0) {
    if (params.excelInputBasePay !== basePay) {
      discrepancies.push(
        `엑셀 입력 기준급(${params.excelInputBasePay.toLocaleString()}원)과 시스템 산식 계산값(${basePay.toLocaleString()}원)이 다릅니다. (차이: ${(params.excelInputBasePay - basePay).toLocaleString()}원)`
      );
    }
  }

  // 6. Minimum wage validation check
  // 209 hours standard: basePay / 209
  const baseHourly = basePay > 0 ? basePay / 209 : 0;
  if (baseHourly > 0 && baseHourly < MIN_HOURLY_WAGE_2026) {
    discrepancies.push(
      `통상 기준시급(약 ${Math.round(baseHourly).toLocaleString()}원)이 2026년 법정 최저시급(${MIN_HOURLY_WAGE_2026.toLocaleString()}원) 미만입니다. 고용노동부 가이드라인 검토가 필요합니다.`
    );
  }

  return {
    wage: {
      annualSalary,
      monthlySalary,
      basePay,
      performanceBonus,
      licenseAllowance,
      siteAllowance,
      positionAllowance,
      fixedOtPay,
      fixedHolidayPay,
      annualLeavePay,
      mealAllowance,
      sumAllowances,
      calculationVersion: CALCULATION_VERSION,
      isVerified10Won,
      discrepancyNote: discrepancies.join('; ')
    },
    isValid: errors.length === 0,
    errors,
    discrepancies
  };
}
