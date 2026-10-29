/**
 * Contract Rules and Text Clause Engine for YW Construction (양우종합건설)
 * Conforms directly to the approved contract PDF templates (Pages 1~7)
 */

import { WorkSchedule, WorkType } from '../types/contract';

/**
 * Determine Executive contract end date based on the 3/31 boundary rule
 * Contract date after March 31st -> March 31st of NEXT year
 * Contract date on or before March 31st -> March 31st of CURRENT year
 */
export function calculateExecutiveEndDate(contractDateStr: string): string {
  const date = new Date(contractDateStr);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();

  // If after March 31 (month > 3 or (month === 3 and day > 31))
  if (month > 3) {
    return `${year + 1}-03-31`;
  } else {
    return `${year}-03-31`;
  }
}

/**
 * Calculate Annual Salary Period (연봉 계약기간)
 * - 신규채용자: 입사일 ~ 다음년도 3월 31일
 * - 재직근로자: 당해년도 4월 1일 ~ 다음년도 3월 31일
 * - 현장 PJT: 없음 (해당 없음)
 */
export function calculateAnnualSalaryPeriod(params: {
  workType: WorkType;
  isNewHire: boolean;
  hireDate: string;
  contractDateStr: string;
}): { startDate: string; endDate: string; label: string } {
  if (params.workType === '현장PJT') {
    return { startDate: '', endDate: '', label: '해당 없음 (월급제)' };
  }

  const cDate = new Date(params.contractDateStr);
  const year = cDate.getFullYear();

  if (params.isNewHire) {
    return {
      startDate: params.hireDate || params.contractDateStr,
      endDate: `${year + 1}-03-31`,
      label: `${params.hireDate || params.contractDateStr} ~ ${year + 1}-03-31`
    };
  } else {
    return {
      startDate: `${year}-04-01`,
      endDate: `${year + 1}-03-31`,
      label: `${year}-04-01 ~ ${year + 1}-03-31`
    };
  }
}

/**
 * Get standard work schedule by WorkType
 */
export function getStandardSchedule(workType: WorkType): WorkSchedule {
  if (workType === '본사임원' || workType === '본사직원') {
    return {
      workDays: '월~금(5일)',
      workHours: '08:30~17:30',
      restHours: '11:30~12:30'
    };
  } else {
    // 현장임원, 현장직원, 현장PJT
    return {
      workDays: '월~금(5일)',
      workHours: '07:00~18:00',
      restHours: '09:00~09:30, 12:00~13:00, 15:30~16:00'
    };
  }
}

/**
 * Generate formatted contract period clause
 */
export function getContractPeriodClause(params: {
  workType: WorkType;
  startDate: string;
  endDate?: string;
  contractDateStr: string;
}): {
  clauseA: string;
  clauseB?: string;
  clauseProbation?: string;
} {
  const { workType, startDate, contractDateStr } = params;

  if (workType === '본사임원' || workType === '현장임원') {
    const end = params.endDate || calculateExecutiveEndDate(contractDateStr);
    return {
      clauseA: `가. "을"의 근로계약 기간은 ${startDate} ~ ${end} 로 한다. 임원계약 만료 시점에 회사에서 재임용 결정을 하지 않으면 임원 계약은 자동 종료한다.`,
      clauseProbation: `나. 최초 계약일로부터 2.5개월은 수습기간으로 하며, 수습기간 평가를 통해 본 채용을 거부할 수 있다.`
    };
  }

  if (workType === '본사직원' || workType === '현장직원') {
    return {
      clauseA: `가. "을"의 근로계약 기간은 ${startDate} 부터 기간의 정함이 없는 것으로 한다.`,
      clauseProbation: `나. 최초 계약일로부터 2.5개월은 수습기간으로 하며, 수습기간 평가를 통해 본 채용을 거부할 수 있다.`
    };
  }

  // 현장PJT
  const pjtEnd = params.endDate || '공종종료일';
  return {
    clauseA: `가. "을"의 근로계약 기간은 ${startDate} ~ ${pjtEnd} 일로 하고, 근로계약기간 만료와 함께 근로관계는 종료한다.`,
    clauseB: `나. '가'항에도 불구하고 근로계약기간 중 수행하고 있던 해당 공종 및 업무가 종료된 때는 그 때를 계약만료일로 하되, 해당 공종이 현장의 사정으로 연장될 경우 근로계약 종료일을 연장할 수 있으나, 총 근로계약 기간은 공사현장에서 "을"이 수행하던 공종종료일을 초과하지 못한다. 근로계약 만료일 전이라도 해당 업무 또는 해당 공종이 종료된 경우 또는 천재지변 및 이에 준하는 사유, 발주처의 공사 중단, 설계변경 등으로 인해 1개월 이상 공사를 계속할 수 없는 경우에는 그 때를 근로계약의 만료일로 한다.`,
    clauseProbation: `다. 최초 계약일로부터 2.5개월은 수습기간으로 하며, 수습기간 평가를 통해 본 채용을 거부할 수 있다.`
  };
}

/**
 * Validate legal compliance and check if contract requires legal review or blocking
 */
export function checkLegalReviewBlock(params: {
  workType: WorkType;
  duty?: string;
  jobTitle?: string;
  isHeadquarters?: boolean;
  specialClauses?: string[];
  missingFields?: string[];
}): {
  isBlocked: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Check 1: Executive worker status check
  // 임원의 경우 근로기준법상 근로자성(업무상 지휘감독 여부, 대표이사 등) 검토 필요
  if (params.workType === '본사임원' || params.workType === '현장임원') {
    const isCeoOrOfficer = (params.duty || '').includes('대표') || (params.jobTitle || '').includes('대표');
    if (isCeoOrOfficer) {
      reasons.push('대표권 있는 등기임원은 근로기준법상 근로자성이 부인될 수 있어 노무법률 검토 완료 전까지 발송이 차단됩니다.');
    }
  }

  // Check 2: Unverified special clauses for PJT
  if (params.workType === '현장PJT') {
    if (params.specialClauses && params.specialClauses.includes('UNVERIFIED_CUSTOM_CLAUSE')) {
      reasons.push('법률검토가 완료되지 않은 PJT 임의 특약이 포함되어 있어 발송이 차단됩니다.');
    }
  }

  // Check 3: Mandatory fields missing
  if (params.missingFields && params.missingFields.length > 0) {
    reasons.push(`필수 기재항목 누락: [${params.missingFields.join(', ')}]`);
  }

  return {
    isBlocked: reasons.length > 0,
    reasons
  };
}
