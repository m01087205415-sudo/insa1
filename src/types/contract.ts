/**
 * Types for YW Construction (양우종합건설) Electronic Labor Contract System
 */

export type WorkType = 
  | '본사임원' 
  | '현장임원' 
  | '본사직원' 
  | '현장직원' 
  | '현장PJT';

export type ContractStatus = 
  | 'DRAFT'              // 초안작성
  | 'VALIDATION_ERROR'  // 검증오류
  | 'REVIEW_PENDING'     // 검토/승인대기
  | 'APPROVED'           // 승인완료
  | 'SEALED'             // 날인완료
  | 'SEND_PENDING'       // 발송대기
  | 'SENT'               // 발송완료
  | 'AUTH_COMPLETED'     // 인증완료 (OTP 통과)
  | 'VIEWED'             // 열람
  | 'SIGNING'            // 서명처리중
  | 'SIGNED'             // 체결완료 (서명 완료)
  | 'MODIFICATION_REQ'   // 수정요청
  | 'REJECTED'           // 거절
  | 'CANCELED'           // 취소
  | 'EXPIRED';           // 링크만료

export type EmailDeliveryStatus = 
  | 'PENDING' 
  | 'QUEUED' 
  | 'SENT' 
  | 'DELIVERED' 
  | 'FAILED' 
  | 'DEV_MODE_SIMULATED';

export type DeliveryStatus = 
  | 'NOT_DELIVERED' 
  | 'ELECTRONIC_DELIVERED' 
  | 'PAPER_REQUESTED' 
  | 'FAILED';

export type UserRole = 
  | 'HR_MANAGER'    // 인사 담당자
  | 'APPROVER'      // 승인권자 (대표이사/본부장)
  | 'ADMIN'         // 시스템 관리자
  | 'WORKER';       // 근로자

export type LicenseGrade = 
  | '기술사' 
  | '기사' 
  | '산업기사' 
  | '기능사' 
  | '없음';

export interface LicenseInfo {
  name: string;             // 자격증명 (예: 건축기사, 토목기사)
  grade: LicenseGrade;      // 등급
  acquiredDate: string;     // 취득일 (YYYY-MM-DD)
  yearsFromAcquisition: number; // 경과 연수
}

export interface WageDetails {
  annualSalary: number;     // 연봉총액 (원)
  monthlySalary: number;    // 월임금 (원)
  basePay: number;          // 기준급 (10원 반올림)
  performanceBonus: number; // 성과급
  licenseAllowance: number; // 면허수당 (최상위 1개)
  siteAllowance: number;    // 현장수당 (100,000원)
  positionAllowance: number;// 직책수당 (현장소장 500,000원)
  fixedOtPay: number;       // 고정OT수당 ROUND(월/295*48, -1)
  fixedHolidayPay: number;  // 고정휴일수당 ROUND(월/295*30, -1)
  annualLeavePay: number;   // 연차수당 ROUND(월/295*8, -1)
  mealAllowance: number;    // 식대 (본사만 200,000원)
  sumAllowances: number;    // 제수당 합계
  calculationVersion: string; // 산식 버전 (예: 'v2026.04-STD')
  isVerified10Won: boolean; // 10원 단위 일치 여부
  discrepancyNote?: string;
}

export interface WorkSchedule {
  workDays: string;         // 근로일 (예: '월~금(5일)')
  workHours: string;        // 근로시간 (예: '08:30~17:30' 또는 '07:00~18:00')
  restHours: string;        // 휴게시간 (예: '11:30~12:30' 또는 3회 분할)
}

export interface ContractItem {
  id: string;               // 계약 고유 식별자 (UUID)
  contractNo: string;       // 외부 계약관리번호 (예: YW-2026-001)
  version: number;          // 계약 버전 (수정 시 증가)
  empNo: string;            // 사번 (문자열, 00123 보존)
  name: string;             // 성명
  birthDate: string;        // 생년월일 (YYYY-MM-DD)
  address: string;          // 주소 (긴 주소 대응)
  phone: string;            // 휴대전화 (010-XXXX-XXXX)
  email?: string;           // 근로자 이메일
  
  workType: WorkType;       // 근무유형 5종
  department: string;       // 부서/현장부서
  siteName: string;         // 현장명 (본사의 경우 본사)
  siteCode: string;         // 현장코드
  workLocation: string;     // 근무장소 ('본사' 또는 현장 주소)
  jobTitle: string;         // 직급 (PJT는 직급에 'PJT')
  duty: string;             // 직책/직무 (예: '현장소장', '공무', '공무팀장')
  isHeadquarters: boolean;  // 실제 본사근무 여부
  
  hireDate: string;         // 입사일
  contractStartDate: string;// 근로계약 시작일
  contractEndDate?: string; // 근로계약 종료일 ('기간의 정함이 없음' 또는 YYYY-MM-DD)
  annualSalaryStartDate?: string; // 연봉적용 시작일
  annualSalaryEndDate?: string;   // 연봉적용 종료일
  contractDate: string;     // 근로계약 체결일자 (예: 2026-04-01)
  
  // PJT 전용
  pjtName?: string;         // PJT 사업명
  pjtProcessDuty?: string;  // 담당 공정 및 업무
  pjtEndStandard?: string;  // 종료 기준 (공종 종료일 등)
  pjtExpectedEndDate?: string; // PJT 종료 예정일
  
  // 임금 & 수당
  wage: WageDetails;
  
  // 자격사항
  license?: LicenseInfo;
  
  // 근로조건
  schedule: WorkSchedule;
  
  // 수습 및 특약
  probationEnabled: boolean; // 수습 적용 여부
  probationMonths: number;   // 기본 2.5개월
  specialClauses: string[];  // 적용된 승인 특약
  requiresLegalReview: boolean; // 근로자성 미확인 임원 / PJT 특약 미검토 시 true
  legalReviewReason?: string;
  
  // 상태 및 링크
  status: ContractStatus;
  signToken?: string;        // 암호학적 서명 링크 토큰
  tokenExpiresAt?: string;   // 링크 만료 시각 (기본 7일)
  otpCode?: string;          // 본인확인 OTP (6자리, 디버그 모드용 표시 지원)
  otpAttempts: number;       // OTP 시도 횟수 (최대 5회)
  otpVerifiedAt?: string;
  
  // 서명 및 인감
  isApproved: boolean;       // 승인권자 승인 여부
  approvedBy?: string;       // 승인자 ID/성명
  approvedAt?: string;       // 승인 시각
  approvalVersion?: number;  // 승인된 계약 버전
  
  isSealed: boolean;         // 사용인감 날인 여부
  sealedBy?: string;         // 날인 처리자
  sealedAt?: string;         // 날인 시각
  sealVersion: string;       // 인감 버전 (예: 'YW-SEAL-2026-01')
  
  workerSignedAt?: string;   // 근로자 서명 제출 시각
  signatureDataUrl?: string; // 근로자 서명 이미지 (Data URL)
  preSignDocHash?: string;   // 서명 전 계약서 SHA-256 해시
  finalPdfHash?: string;     // 서명 완료본 최종 PDF SHA-256 해시
  
  // 이메일 및 교부
  emailStatus: EmailDeliveryStatus;
  emailSentAt?: string;
  emailErrorMessage?: string;
  deliveryStatus: DeliveryStatus;
  deliveredAt?: string;
  
  // 수정요청 내역
  modificationRequest?: {
    requestedAt: string;
    reason: string;
    status: 'PENDING' | 'RESOLVED' | 'REJECTED';
  };
  
  // A4 1페이지 검증 결과
  pageCompliance: {
    isExactlyOnePage: boolean;
    estimatedHeightMm: number; // 297mm 기준
    warning?: string;
  };
  
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  contractId: string;
  contractNo: string;
  version: number;
  eventType: 
    | 'CREATED'
    | 'EXCEL_VALIDATED'
    | 'UPDATED'
    | 'APPROVED'
    | 'SEALED'
    | 'LINK_DISPATCHED'
    | 'OTP_REQUESTED'
    | 'OTP_VERIFIED'
    | 'VIEWED'
    | 'MODIFICATION_REQUESTED'
    | 'SIGNED'
    | 'PDF_GENERATED'
    | 'EMAIL_DISPATCHED'
    | 'DELIVERY_CONFIRMED'
    | 'RE_APPROVED'
    | 'LINK_REVOKED';
  actor: string;
  actorRole: UserRole;
  clientIp?: string;
  userAgent?: string;
  details: string;
  documentHash?: string;
  timestamp: string;
}

export interface CompanyConfig {
  companyName: string;      // 양우종합건설 주식회사
  ceoName: string;          // 고예림
  businessNumber: string;   // 123-45-67890
  hrEmail: string;          // tecs_hr@ywconst.com
  sealPath: string;         // /seal_stamp.png
  sealVersion: string;      // YW-SEAL-2026-01
  salaryCalculationVersion: string; // v2026.04-STD
  minWageHourly2026: number;// 최저임금 (2026년 기준 10,030원 등)
  devMode: boolean;         // 개발/모의 모드 (실제 SMS/SMTP 대신 시뮬레이션)
}
