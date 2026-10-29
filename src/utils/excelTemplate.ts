/**
 * Excel Template Generator and Parser for YW Construction (양우종합건설)
 * Uses 'xlsx' (SheetJS) to ensure proper string handling (retaining leading zeros for phone numbers and emp IDs).
 */

import * as XLSX from 'xlsx';
import { ContractItem, LicenseGrade, LicenseInfo, WorkType } from '../types/contract';
import { calculateWageDetails } from './wageCalculator';
import { calculateAnnualSalaryPeriod, getContractPeriodClause, getStandardSchedule } from './contractRules';

export interface ExcelRowData {
  contractNo: string;
  empNo: string;
  name: string;
  birthDate: string;
  phone: string;
  email?: string;
  address: string;
  workType: string;
  department: string;
  siteName: string;
  siteCode: string;
  workLocation: string;
  jobTitle: string;
  duty: string;
  isHeadquarters: string;
  hireDate: string;
  contractStartDate: string;
  contractEndDate?: string;
  annualSalary?: string | number;
  monthlySalary?: string | number;
  pjtName?: string;
  pjtProcessDuty?: string;
  pjtExpectedEndDate?: string;
  licenseName?: string;
  licenseGrade?: string;
  licenseAcquiredDate?: string;
  probationEnabled?: string;
  specialClauses?: string;
  excelInputBasePay?: string | number;
}

export interface ValidationErrorItem {
  rowNumber: number;
  contractNo: string;
  empNo: string;
  name: string;
  columnName: string;
  errorReason: string;
  fixGuide: string;
}

/**
 * Generate official .xlsx contract batch template file buffer
 */
export function generateExcelTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Input Data with headers and sample row
  const headers = [
    '계약관리번호*',
    '사번*',
    '성명*',
    '생년월일(YYYY-MM-DD)*',
    '휴대전화번호*',
    '이메일',
    '주소*',
    '근무유형*',
    '부서*',
    '현장명*',
    '현장코드',
    '근무장소*',
    '직급*',
    '직책/직무',
    '본사근무여부(Y/N)',
    '입사일(YYYY-MM-DD)*',
    '계약시작일(YYYY-MM-DD)*',
    '계약종료일(YYYY-MM-DD)',
    '연봉총액(원)',
    '월임금(원)*',
    '기준급(입력확인용)',
    'PJT명',
    'PJT담당공정/업무',
    'PJT종료예정일',
    '보유자격증명',
    '자격등급',
    '자격취득일(YYYY-MM-DD)',
    '수습적용여부(Y/N)',
    '특약사항코드'
  ];

  const sampleRows = [
    [
      'YW-2026-001',
      '00101',
      '김상무',
      '1972-05-14',
      '010-1234-5678',
      'ksm@ywconst.com',
      '서울특별시 강남구 테헤란로 152 강남파이낸스센터 18층',
      '본사임원',
      '토목사업본부',
      '본사',
      'HQ01',
      '본사',
      '상무',
      '본부장',
      'Y',
      '2026-04-01',
      '2026-04-01',
      '2027-03-31',
      84000000,
      7000000,
      4759330,
      '',
      '',
      '',
      '',
      '없음',
      '',
      'N',
      ''
    ],
    [
      'YW-2026-002',
      '00102',
      '박소장',
      '1974-08-20',
      '010-2345-6789',
      'psj@ywconst.com',
      '경기도 화성시 동탄대로 100 동탄역 디에트르 현장',
      '현장임원',
      '건축사업부',
      '동탄현장',
      'DT01',
      '동탄 아파트 신축공사 현장',
      '전무',
      '현장소장',
      'N',
      '2026-04-01',
      '2026-04-01',
      '2027-03-31',
      84000000,
      7000000,
      3839330,
      '',
      '',
      '',
      '',
      '없음',
      '',
      'N',
      ''
    ],
    [
      'YW-2026-003',
      '00201',
      '이고모',
      '1982-11-03',
      '010-3456-7890',
      'lgm@ywconst.com',
      '서울특별시 마포구 마포대로 123 양우빌딩',
      '본사직원',
      '인사총무팀',
      '본사',
      'HQ01',
      '본사',
      '부장',
      '팀장',
      'Y',
      '2020-03-01',
      '2026-04-01',
      '',
      84000000,
      7000000,
      4239330,
      '',
      '',
      '',
      '건축기사',
      '기사',
      '2014-06-01',
      'N',
      ''
    ],
    [
      'YW-2026-004',
      '00202',
      '최공무',
      '1985-04-12',
      '010-4567-8901',
      'cgm@ywconst.com',
      '인천광역시 서구 청라한내로 200 청라지구 현장사무소',
      '현장직원',
      '공사팀',
      '청라현장',
      'CR02',
      '인천 청라 물류센터 신축현장',
      '부장',
      '현장소장',
      'N',
      '2021-07-01',
      '2026-04-01',
      '',
      84000000,
      7000000,
      3839330,
      '',
      '',
      '',
      '토목기사',
      '기사',
      '2012-05-10',
      'N',
      ''
    ],
    [
      'YW-2026-005',
      '00301',
      '정기술',
      '1978-09-25',
      '010-5678-9012',
      'jgs@ywconst.com',
      '세종특별자치시 한누리대로 411 세종 스마트캠퍼스 현장',
      '현장PJT',
      '골조공사반',
      '세종현장',
      'SJ03',
      '세종 스마트캠퍼스 2공구 현장',
      'PJT',
      '골조반장',
      'N',
      '2026-04-01',
      '2026-04-01',
      '2026-12-31',
      '',
      7000000,
      4789330,
      '세종 스마트캠퍼스 신축공사',
      '철근콘크리트 골조공사',
      '2026-12-31',
      '콘크리트기사',
      '기사',
      '2010-02-15',
      'N',
      ''
    ]
  ];

  const wsInput = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);

  // Set column widths
  wsInput['!cols'] = [
    { wch: 15 }, // 계약관리번호
    { wch: 10 }, // 사번
    { wch: 12 }, // 성명
    { wch: 20 }, // 생년월일
    { wch: 18 }, // 전화번호
    { wch: 20 }, // 이메일
    { wch: 40 }, // 주소
    { wch: 14 }, // 근무유형
    { wch: 16 }, // 부서
    { wch: 16 }, // 현장명
    { wch: 12 }, // 현장코드
    { wch: 25 }, // 근무장소
    { wch: 10 }, // 직급
    { wch: 14 }, // 직책
    { wch: 16 }, // 본사여부
    { wch: 16 }, // 입사일
    { wch: 16 }, // 계약시작
    { wch: 16 }, // 계약종료
    { wch: 16 }, // 연봉
    { wch: 14 }, // 월임금
    { wch: 18 }, // 기준급
    { wch: 25 }, // PJT명
    { wch: 20 }, // PJT공정
    { wch: 16 }, // PJT종료
    { wch: 18 }, // 자격명
    { wch: 12 }, // 자격등급
    { wch: 18 }, // 취득일
    { wch: 16 }, // 수습
    { wch: 16 }  // 특약
  ];

  XLSX.utils.book_append_sheet(wb, wsInput, '근로계약입력');

  // Sheet 2: Guidelines and Code Reference
  const guideData = [
    ['양우종합건설 전자근로계약 엑셀 입력 가이드 및 코드표', ''],
    ['버전', 'v2026.04-STD (승인된 계산 규칙)'],
    ['1. 필수 입력 및 텍스트 서식 주의사항', ''],
    [' - 사번 및 휴대전화번호는 반드시 "텍스트" 서식으로 입력하여 앞자리 "0"이 지워지지 않도록 하십시오.'],
    [' - 휴대전화번호는 010-XXXX-XXXX 형식으로 입력하십시오.'],
    [' - 날짜는 YYYY-MM-DD 형식으로 입력하십시오.'],
    [' - 월임금은 10원 단위로 입력해야 하며, 1원 단위 입력 시 오류가 발생합니다.'],
    [''],
    ['2. 근무유형 코드 (5종)', ''],
    ['본사임원', '근로계약기간(3/31 기준 자동), 식대 20만원, 근무시간 08:30~17:30, 근무장소에 "본사" 표기'],
    ['현장임원', '근로계약기간(3/31 기준 자동), 현장수당 10만원, 현장소장시 직책수당 50만원, 근무시간 07:00~18:00'],
    ['본사직원', '기간 정함 없음, 성과급/면허수당/식대 20만원, 근무시간 08:30~17:30, 근무장소에 "본사" 표기'],
    ['현장직원', '기간 정함 없음, 성과급/면허수당/현장수당 10만원/현장소장 50만원, 근무시간 07:00~18:00'],
    ['현장PJT', '직급에 "PJT" 표기, 근로계약 입사일~PJT종료일(공종특약 포함), 연봉기간 없음, 현장수당 10만원'],
    [''],
    ['3. 직급별 성과급 (본사직원, 현장직원만 해당)', ''],
    ['부장', '450,000원'],
    ['차장', '400,000원'],
    ['과장', '350,000원'],
    ['대리', '200,000원'],
    ['주임', '150,000원'],
    ['사원', '150,000원'],
    [''],
    ['4. 자격등급별 면허수당 (본사직원, 현장직원만 해당 / 최상위 1개만 지급)', ''],
    ['기술사', '300,000원'],
    ['기사', '취득일 기준 10년 이상: 70,000원 / 10년 미만: 50,000원'],
    ['산업기사', '30,000원'],
    ['기능사', '20,000원'],
    ['없음', '0원'],
    [''],
    ['5. 법정 포괄제수당 10원 단위 반올림 공식 (산식 고정)', ''],
    ['고정OT수당', '= ROUND(월임금 / 295 * 48, -1)'],
    ['고정휴일수당', '= ROUND(월임금 / 295 * 30, -1)'],
    ['연차수당', '= ROUND(월임금 / 295 * 8, -1)'],
    ['기준급', '= ROUND(월임금 - 제수당합계, -1)']
  ];

  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [{ wch: 20 }, { wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsGuide, '코드표및작성가이드');

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buf);
}

/**
 * Parse uploaded Excel file and validate row-by-row
 */
export function parseAndValidateExcel(fileBuffer: ArrayBuffer): {
  contracts: ContractItem[];
  errors: ValidationErrorItem[];
  warnings: string[];
} {
  const wb = XLSX.read(fileBuffer, { type: 'array', cellDates: true });
  const sheetName = wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];

  // Raw rows as 2D array with cell formatting
  const rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });

  if (!rawRows || rawRows.length < 2) {
    return {
      contracts: [],
      errors: [
        {
          rowNumber: 1,
          contractNo: '-',
          empNo: '-',
          name: '-',
          columnName: '헤더/데이터',
          errorReason: '엑셀 파일에 데이터 행이 존재하지 않습니다.',
          fixGuide: '제공된 템플릿에 맞추어 2행부터 계약 데이터를 입력해주세요.'
        }
      ],
      warnings: []
    };
  }

  const contracts: ContractItem[] = [];
  const errors: ValidationErrorItem[] = [];
  const warnings: string[] = [];
  
  // Track duplicates
  const seenContractNos = new Set<string>();
  const phoneToNames = new Map<string, string[]>();

  // Row 0 is header, data starts at Row 1 (Excel Row 2)
  for (let r = 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    // Skip completely empty rows
    if (row.every((cell: any) => !cell || String(cell).trim() === '')) {
      continue;
    }

    const rowNum = r + 1; // 1-indexed Excel row

    // Extract columns with string sanitization
    const contractNo = String(row[0] || '').trim();
    const empNo = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    let birthDate = String(row[3] || '').trim();
    const rawPhone = String(row[4] || '').trim();
    const email = String(row[5] || '').trim();
    const address = String(row[6] || '').trim();
    const rawWorkType = String(row[7] || '').trim() as WorkType;
    const department = String(row[8] || '').trim();
    const siteName = String(row[9] || '').trim();
    const siteCode = String(row[10] || '').trim();
    let workLocation = String(row[11] || '').trim();
    let jobTitle = String(row[12] || '').trim();
    const duty = String(row[13] || '').trim();
    const isHeadquarters = String(row[14] || '').toUpperCase() === 'Y';
    const hireDate = String(row[15] || '').trim();
    const contractStartDate = String(row[16] || '').trim();
    const contractEndDate = String(row[17] || '').trim();
    const rawAnnual = row[18];
    const rawMonthly = row[19];
    const rawInputBasePay = row[20];
    const pjtName = String(row[21] || '').trim();
    const pjtProcessDuty = String(row[22] || '').trim();
    const pjtExpectedEndDate = String(row[23] || '').trim();
    const licenseName = String(row[24] || '').trim();
    const licenseGrade = (String(row[25] || '').trim() || '없음') as LicenseGrade;
    const licenseAcquiredDate = String(row[26] || '').trim();
    const probationEnabled = String(row[27] || '').toUpperCase() === 'Y';
    const specialClauses = String(row[28] || '').trim();

    // 1. Mandatory fields checks
    if (!contractNo) {
      errors.push({
        rowNumber: rowNum,
        contractNo: '-',
        empNo,
        name,
        columnName: '계약관리번호',
        errorReason: '계약관리번호가 비어있습니다.',
        fixGuide: 'YW-2026-XXX 형식의 고유 번호를 입력하세요.'
      });
    }

    if (!empNo) {
      errors.push({
        rowNumber: rowNum,
        contractNo,
        empNo: '-',
        name,
        columnName: '사번',
        errorReason: '사번이 비어있습니다.',
        fixGuide: '사번을 문자열(예: 00101)로 입력하세요.'
      });
    }

    if (!name) {
      errors.push({
        rowNumber: rowNum,
        contractNo,
        empNo,
        name: '-',
        columnName: '성명',
        errorReason: '성명이 누락되었습니다.',
        fixGuide: '근로자 성명을 입력하세요.'
      });
    }

    // BirthDate validation
    if (!birthDate) {
      errors.push({
        rowNumber: rowNum,
        contractNo,
        empNo,
        name,
        columnName: '생년월일',
        errorReason: '생년월일이 누락되었습니다.',
        fixGuide: 'YYYY-MM-DD 형식으로 입력하세요.'
      });
    } else {
      // Normalize if given as 6 digits like 850412
      if (/^\d{6}$/.test(birthDate)) {
        const yr = parseInt(birthDate.slice(0, 2), 10);
        const prefix = yr > 40 ? '19' : '20';
        birthDate = `${prefix}${birthDate.slice(0, 2)}-${birthDate.slice(2, 4)}-${birthDate.slice(4, 6)}`;
      }
    }

    // Phone validation & preserve leading 0
    let phone = rawPhone.replace(/[^0-9]/g, '');
    if (!phone) {
      errors.push({
        rowNumber: rowNum,
        contractNo,
        empNo,
        name,
        columnName: '휴대전화번호',
        errorReason: '휴대전화번호가 비어있습니다.',
        fixGuide: '010-XXXX-XXXX 형식으로 입력하세요.'
      });
    } else {
      if (phone.length === 10 && phone.startsWith('10')) {
        phone = '0' + phone; // restore stripped leading zero
      }
      if (phone.length === 11) {
        phone = `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7, 11)}`;
      } else {
        errors.push({
          rowNumber: rowNum,
          contractNo,
          empNo,
          name,
          columnName: '휴대전화번호',
          errorReason: `유효하지 않은 휴대전화 번호 길이입니다. (${rawPhone})`,
          fixGuide: '010으로 시작하는 11자리 번호를 확인하세요.'
        });
      }
    }

    // Check duplicate phone across different people
    if (phone) {
      const existing = phoneToNames.get(phone) || [];
      if (existing.length > 0 && !existing.includes(name)) {
        warnings.push(`[확인 경고] 동일한 휴대전화번호(${phone})가 복수의 근로자(${[...existing, name].join(', ')})에게 입력되었습니다. 오발송 주의가 필요합니다.`);
      }
      phoneToNames.set(phone, [...existing, name]);
    }

    // Check duplicate contract number
    if (contractNo) {
      if (seenContractNos.has(contractNo)) {
        errors.push({
          rowNumber: rowNum,
          contractNo,
          empNo,
          name,
          columnName: '계약관리번호',
          errorReason: `동일한 계약관리번호(${contractNo})가 중복되었습니다.`,
          fixGuide: '계약관리번호를 고유하게 변경하세요.'
        });
      }
      seenContractNos.add(contractNo);
    }

    // Validate WorkType
    const validWorkTypes: WorkType[] = ['본사임원', '현장임원', '본사직원', '현장직원', '현장PJT'];
    let workType = rawWorkType;
    if (!validWorkTypes.includes(workType)) {
      errors.push({
        rowNumber: rowNum,
        contractNo,
        empNo,
        name,
        columnName: '근무유형',
        errorReason: `알 수 없는 근무유형입니다: '${rawWorkType}'`,
        fixGuide: '본사임원, 현장임원, 본사직원, 현장직원, 현장PJT 중 하나를 정확히 입력하세요.'
      });
      workType = '본사직원'; // fallback for schema safety
    }

    // Check work location and jobTitle rules from PDF
    if ((workType === '본사임원' || workType === '본사직원') && !workLocation.includes('본사')) {
      workLocation = '본사';
    }
    if (workType === '현장PJT' && !jobTitle.includes('PJT')) {
      jobTitle = 'PJT';
    }

    // Parse amounts
    const monthlySalary = typeof rawMonthly === 'number' ? rawMonthly : parseInt(String(rawMonthly || '0').replace(/[^0-9]/g, ''), 10);
    const annualSalary = typeof rawAnnual === 'number' ? rawAnnual : parseInt(String(rawAnnual || '0').replace(/[^0-9]/g, ''), 10);
    const excelInputBasePay = rawInputBasePay ? parseInt(String(rawInputBasePay).replace(/[^0-9]/g, ''), 10) : undefined;

    // License info
    let license: LicenseInfo | undefined = undefined;
    if (licenseGrade && licenseGrade !== '없음') {
      license = {
        name: licenseName || '국가기술자격',
        grade: licenseGrade,
        acquiredDate: licenseAcquiredDate || '2016-01-01',
        yearsFromAcquisition: licenseAcquiredDate ? Math.max(0, 2026 - new Date(licenseAcquiredDate).getFullYear()) : 0
      };
    }

    // Wage calculation and validation
    const wageResult = calculateWageDetails({
      workType,
      monthlySalary,
      annualSalary,
      jobTitle,
      duty,
      license,
      isHeadquarters,
      contractDateStr: contractStartDate || '2026-04-01',
      excelInputBasePay
    });

    if (!wageResult.isValid) {
      for (const err of wageResult.errors) {
        errors.push({
          rowNumber: rowNum,
          contractNo,
          empNo,
          name,
          columnName: '임금계산',
          errorReason: err,
          fixGuide: '10원 단위 반올림 및 월임금/수당 산식을 확인하세요.'
        });
      }
    }

    if (wageResult.discrepancies.length > 0) {
      for (const disc of wageResult.discrepancies) {
        warnings.push(`[${contractNo} ${name}] ${disc}`);
      }
    }

    // Dates & Periods
    const contractDate = contractStartDate || '2026-04-01';
    const annualPeriod = calculateAnnualSalaryPeriod({
      workType,
      isNewHire: hireDate === contractStartDate,
      hireDate,
      contractDateStr: contractDate
    });

    const schedule = getStandardSchedule(workType);

    // Create normalized contract object
    const contract: ContractItem = {
      id: `c_${Date.now()}_${r}`,
      contractNo,
      version: 1,
      empNo,
      name,
      birthDate,
      address: address || '주소 미입력',
      phone,
      email: email || undefined,
      workType,
      department: department || '관리부',
      siteName: siteName || (workType.startsWith('본사') ? '본사' : '현장'),
      siteCode: siteCode || 'HQ',
      workLocation: workLocation || (workType.startsWith('본사') ? '본사' : '현장사무소'),
      jobTitle: jobTitle || '직원',
      duty: duty || '담당',
      isHeadquarters,
      hireDate: hireDate || contractDate,
      contractStartDate: contractStartDate || contractDate,
      contractEndDate: contractEndDate || undefined,
      annualSalaryStartDate: annualPeriod.startDate || undefined,
      annualSalaryEndDate: annualPeriod.endDate || undefined,
      contractDate,
      pjtName: pjtName || undefined,
      pjtProcessDuty: pjtProcessDuty || undefined,
      pjtExpectedEndDate: pjtExpectedEndDate || undefined,
      wage: wageResult.wage,
      license,
      schedule,
      probationEnabled,
      probationMonths: 2.5,
      specialClauses: specialClauses ? specialClauses.split(',').map(s => s.trim()) : [],
      requiresLegalReview: false,
      status: errors.some(e => e.rowNumber === rowNum) ? 'VALIDATION_ERROR' : 'REVIEW_PENDING',
      otpAttempts: 0,
      isApproved: false,
      isSealed: false,
      sealVersion: 'YW-SEAL-2026-01',
      emailStatus: 'PENDING',
      deliveryStatus: 'NOT_DELIVERED',
      pageCompliance: {
        isExactlyOnePage: true,
        estimatedHeightMm: 292
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    contracts.push(contract);
  }

  return { contracts, errors, warnings };
}

/**
 * Export validation errors as an Excel workbook buffer
 */
export function exportErrorsToExcel(errors: ValidationErrorItem[]): Uint8Array {
  const wb = XLSX.utils.book_new();
  const headers = ['행번호', '계약관리번호', '사번', '성명', '오류항목', '오류이유', '수정조치방법'];
  const rows = errors.map(e => [
    e.rowNumber,
    e.contractNo,
    e.empNo,
    e.name,
    e.columnName,
    e.errorReason,
    e.fixGuide
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 10 },
    { wch: 16 },
    { wch: 12 },
    { wch: 14 },
    { wch: 18 },
    { wch: 45 },
    { wch: 45 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, '검증오류목록');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Uint8Array(buf);
}
