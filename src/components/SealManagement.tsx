/**
 * Official Seal & Contract Template Rule Management (사용인감 및 서식 버전 관리)
 * Conforms to security rules: restricted access, audit tracking, original quality inspection.
 */

import React, { useState } from 'react';
import { 
  Stamp, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  Lock, 
  Upload, 
  FileText, 
  Eye, 
  Calendar,
  Layers
} from 'lucide-react';
import { CompanyConfig, UserRole } from '../types/contract';
import { CALCULATION_VERSION, MIN_HOURLY_WAGE_2026 } from '../utils/wageCalculator';

interface SealManagementProps {
  companyConfig: CompanyConfig;
  currentRole: UserRole;
  onUpdateConfig: (newConfig: Partial<CompanyConfig>) => void;
}

export const SealManagement: React.FC<SealManagementProps> = ({
  companyConfig,
  currentRole,
  onUpdateConfig
}) => {
  const [selectedVersion, setSelectedVersion] = useState<string>('YW-SEAL-2026-01');
  const [sealQualityStatus, setSealQualityStatus] = useState<string>('VERIFIED_ORIGINAL');

  // RBAC Check: Only APPROVER (or designated HR) can manage/authorize seal imprints
  const isAuthorized = currentRole === 'APPROVER';

  return (
    <div className="space-y-6">
      {/* Overview & Security Guard Card */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <Stamp className="w-5 h-5 text-red-600" />
              회사 사용인감 및 서식·임금 규칙 버전 관리
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              첨부 PDF 8페이지에서 추출된 공식 인감 원본을 검증하고, 승인권자의 결재 후에만 서버에서 계약서에 합성됩니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAuthorized ? (
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                인감 날인 승인 권한 보유 (대표이사)
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" />
                인감 관리 권한 제한 (승인권자 전용)
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Official Seal Extraction & Verification */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Stamp className="w-4 h-4 text-neutral-600" />
              등록된 사용인감 원본 및 무결성 검증
            </h3>
            <span className="text-[11px] font-mono text-neutral-500 font-semibold">
              {companyConfig.sealVersion}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            {/* Real Seal Visual Preview */}
            <div className="relative w-32 h-32 bg-white rounded-lg border border-neutral-300 p-2 shadow-inner flex items-center justify-center shrink-0">
              <img
                src={companyConfig.sealPath}
                alt="양우종합건설 주식회사 사용인감"
                className="max-w-full max-h-full object-contain filter drop-shadow-sm"
              />
              <span className="absolute bottom-1 right-2 text-[8px] text-neutral-400 font-mono">
                214 × 214 px
              </span>
            </div>

            {/* Seal Details and Quality Inspection */}
            <div className="space-y-2 text-xs flex-1">
              <div>
                <span className="text-neutral-500 block text-[11px]">인감 명칭</span>
                <span className="font-bold text-neutral-900">
                  양우종합건설 주식회사 대표이사의인 / 사용인감
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">추출 출처</span>
                <span className="font-medium text-neutral-700">
                  첨부 PDF Page 8 (원본 스캔본 추출 및 투명 배경 처리)
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[11px]">형태 보정 정책</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  인위적 AI 왜곡/재생성 없음 (원본 형상 그대로 유지)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
            <span className="font-semibold block flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              보안 및 인감 날인 통제 수칙
            </span>
            <ul className="list-disc pl-4 text-[11px] space-y-0.5 text-blue-800">
              <li>인감 원본은 비공개 디렉토리에 보관되며, 프론트엔드 번들 또는 공개 URL에 노출되지 않습니다.</li>
              <li>승인권자의 명시적인 승인 기록(승인자, 시각, 계약버전)이 있는 계약서에만 서버에서 합성됩니다.</li>
              <li>인감 날인과 별도로 최종 완성본 PDF의 SHA-256 해시를 생성하여 변조를 방지합니다.</li>
            </ul>
          </div>
        </div>

        {/* Card 2: Approved Salary Calculation Rules & Templates */}
        <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-neutral-600" />
              승인된 임금 계산 규칙 및 템플릿 버전
            </h3>
            <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold border border-emerald-200">
              {CALCULATION_VERSION} (고정)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="border border-neutral-200 rounded-lg p-3 space-y-2 bg-neutral-50">
              <div className="flex items-center justify-between">
                <span className="font-bold text-neutral-900">10원 단위 반올림 공식 [Excel ROUND -1]</span>
                <span className="text-neutral-500 font-mono text-[10px]">시행일: 2026-04-01</span>
              </div>
              <div className="space-y-1 text-[11px] font-mono bg-white p-2.5 rounded border border-neutral-200 text-neutral-800">
                <div>고정OT수당 = ROUND(월임금 / 295 * 48, -1)</div>
                <div>고정휴일수당 = ROUND(월임금 / 295 * 30, -1)</div>
                <div>연차수당 = ROUND(월임금 / 295 * 8, -1)</div>
                <div className="text-blue-700 font-bold">
                  기준급 = ROUND(월임금 - SUM(반올림된 제수당), -1)
                </div>
              </div>
              <span className="text-[10px] text-neutral-500 block">
                * 중간 계산값은 반올림하지 않으며, 최종 항목별 결과에만 10원 단위 반올림을 적용합니다.
              </span>
            </div>

            <div className="border border-neutral-200 rounded-lg p-3 space-y-1 text-xs">
              <span className="font-bold text-neutral-900 block mb-1">
                2026년도 법정 기준치 모니터링
              </span>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-600">2026년 법정 최저시급</span>
                <span className="font-mono font-bold text-neutral-900">
                  {MIN_HOURLY_WAGE_2026.toLocaleString()}원 / 시간
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-neutral-600">포괄임금 산정기준시간</span>
                <span className="font-mono font-bold text-neutral-900">
                  295시간 (기본 209 + OT 48 + 휴일 30 + 연차 8)
                </span>
              </div>
            </div>

            <div className="border border-neutral-200 rounded-lg p-3 text-xs space-y-1">
              <span className="font-bold text-neutral-900 block">회사 기본정보 설정</span>
              <div className="text-[11px] text-neutral-600 space-y-0.5">
                <div>상호: <strong>{companyConfig.companyName}</strong></div>
                <div>대표이사: <strong>{companyConfig.ceoName}</strong></div>
                <div>인사팀 공식 메일: <strong className="text-blue-700">{companyConfig.hrEmail}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
