/**
 * Operational Manual & Legal Pre-Launch Checklist Modal
 * Covers installation, backup, recovery, failure handling, and legal pre-launch requirements.
 */

import React, { useState } from 'react';
import { 
  BookOpen, 
  X, 
  ShieldAlert, 
  Server, 
  Database, 
  LifeBuoy, 
  FileText, 
  CheckCircle2 
} from 'lucide-react';

interface ContractManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContractManualModal: React.FC<ContractManualModalProps> = ({
  isOpen,
  onClose
}) => {
  const [activeSection, setActiveSection] = useState<'MANUAL' | 'LEGAL' | 'FAILURE'>('LEGAL');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                양우종합건설 전자근로계약 시스템 운영 매뉴얼 & 정책 가이드
              </h3>
              <p className="text-xs text-neutral-500">
                시스템 설치·운영·백업 복구 매뉴얼 및 실운영 전 법률·회사정책 확정 체크리스트
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-2 text-xs shrink-0">
          <button
            onClick={() => setActiveSection('LEGAL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSection === 'LEGAL'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            1. 운영 전 필수 확정 항목 (법률·노무)
          </button>
          <button
            onClick={() => setActiveSection('MANUAL')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSection === 'MANUAL'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            2. 설치·운영·백업·복구 매뉴얼
          </button>
          <button
            onClick={() => setActiveSection('FAILURE')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              activeSection === 'FAILURE'
                ? 'bg-neutral-900 text-white'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            3. 외부 연동 장애 및 실패 처리 절차
          </button>
        </div>

        {/* Content body */}
        <div className="overflow-y-auto space-y-4 pr-1 text-xs text-neutral-700 leading-relaxed flex-1">
          {activeSection === 'LEGAL' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 space-y-2">
                <span className="font-bold flex items-center gap-1.5 text-amber-800 text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  실 운영 개시 전 확정해야 할 법률 및 회사 정책 (미확정 조항 발송 차단)
                </span>
                <p className="text-[11px] leading-relaxed">
                  본 시스템은 승인되지 않은 임의 수식이나 미확정 특약이 포함된 계약서의 발송을 엄격히 차단합니다. 다음 항목이 노무법률 검토를 통해 최종 확정되어야 실제 근로자에게 발송할 수 있습니다.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-neutral-200 rounded-xl p-4 space-y-2 bg-neutral-50">
                  <span className="font-bold text-neutral-900 block text-xs">
                    ① 임원의 근로기준법상 근로자성 판정 기준
                  </span>
                  <p className="text-[11px] text-neutral-600">
                    - 등기이사 및 대표이사 등 대표권을 행사하는 임원은 근로기준법상 근로자가 아닌 위임관계에 해당할 수 있습니다.<br />
                    - <strong>정책:</strong> 근로자성이 소명되지 않은 임원 계약은 "검토 필요"로 분류하여 사전 발송을 차단합니다.
                  </p>
                </div>

                <div className="border border-neutral-200 rounded-xl p-4 space-y-2 bg-neutral-50">
                  <span className="font-bold text-neutral-900 block text-xs">
                    ② PJT 공종 종료 및 연장 특약 (PDF Page 1 나항)
                  </span>
                  <p className="text-[11px] text-neutral-600">
                    - "공종종료일을 계약만료일로 하되, 발주처 공사 중단 시 1개월 이상 중단 시 계약만료" 조항의 사전 합의 효력.<br />
                    - <strong>정책:</strong> 표준 문구 이외의 자의적 PJT 변경 특약은 변호사/노무사 검토 승인 필증을 요구합니다.
                  </p>
                </div>

                <div className="border border-neutral-200 rounded-xl p-4 space-y-2 bg-neutral-50">
                  <span className="font-bold text-neutral-900 block text-xs">
                    ③ 10원 단위 반올림 및 월임금÷295 포괄임금 적법성
                  </span>
                  <p className="text-[11px] text-neutral-600">
                    - 295시간 기준 계산식(기본 209 + 고정OT 48 + 휴일 30 + 연차 8)과 10원 단위 반올림(ROUND -1)의 법정 최저임금 상회 여부 전수 검증.<br />
                    - <strong>정책:</strong> 산식 버전(v2026.04-STD)을 고정하고 임의 변경을 차단합니다.
                  </p>
                </div>

                <div className="border border-neutral-200 rounded-xl p-4 space-y-2 bg-neutral-50">
                  <span className="font-bold text-neutral-900 block text-xs">
                    ④ 전자서명 및 교부 증적 보존 기산점
                  </span>
                  <p className="text-[11px] text-neutral-600">
                    - 근로기준법 제42조에 따라 근로계약 서류는 체결일이 아닌 <strong>근로관계가 끝난 날(퇴직일)</strong>로부터 3년간 보존해야 합니다.<br />
                    - <strong>정책:</strong> 체결 후 영구 보존 모드로 안전 보관하며, 퇴직일 입력 시 기산점을 연장합니다.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'MANUAL' && (
            <div className="space-y-4">
              <div className="border border-neutral-200 rounded-xl p-4 space-y-2">
                <span className="font-bold text-neutral-900 block text-xs flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-blue-600" />
                  실행 및 배포 가이드
                </span>
                <div className="bg-neutral-900 text-neutral-200 p-3 rounded-lg font-mono text-[11px] space-y-1">
                  <div># 1. 의존성 설치</div>
                  <div className="text-emerald-400">npm install</div>
                  <div># 2. 풀스택 개발 서버 실행 (포트 3000)</div>
                  <div className="text-emerald-400">npm run dev</div>
                  <div># 3. 프로덕션 빌드 및 정적 산출물 컴파일</div>
                  <div className="text-emerald-400">npm run build</div>
                </div>
              </div>

              <div className="border border-neutral-200 rounded-xl p-4 space-y-2">
                <span className="font-bold text-neutral-900 block text-xs flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-emerald-600" />
                  데이터베이스 및 백업·복구 절차
                </span>
                <p className="text-[11px] text-neutral-600">
                  - <strong>저장소:</strong> 계약 마스터 정보 및 감사 증적 로그는 고성능 JSON 및 로컬 DB 파일로 격리 저장됩니다.<br />
                  - <strong>인감 원본 보안:</strong> `/server/secure_storage/seals/` 비공개 디렉토리에 배치되며, 프론트엔드 공개 번들에 직접 노출되지 않습니다.<br />
                  - <strong>일일 백업:</strong> 계약서 PDF와 SHA-256 해시 인덱스를 암호화하여 일일 스냅샷으로 보관합니다.
                </p>
              </div>
            </div>
          )}

          {activeSection === 'FAILURE' && (
            <div className="space-y-4">
              <div className="border border-neutral-200 rounded-xl p-4 space-y-2 bg-neutral-50">
                <span className="font-bold text-neutral-900 block text-xs flex items-center gap-1.5">
                  <LifeBuoy className="w-4 h-4 text-red-600" />
                  문자(SMS) 및 이메일(SMTP) 장애 시 대응 매뉴얼
                </span>
                <div className="space-y-2 text-[11px] text-neutral-700">
                  <div className="p-2.5 bg-white rounded border border-neutral-200">
                    <strong>1. 휴대전화 문자(SMS/알림톡) 발송 실패:</strong>
                    <p className="mt-0.5 text-neutral-600">
                      - 관리자 대시보드에서 '모바일 서명 링크'를 직접 복사하여 카카오톡 또는 개별 문자로 전송 가능합니다.<br />
                      - 통신사 스팸 차단 번호(010 앞자리 등) 확인 후 재발송 버튼을 누르면 새 유효 토큰이 발급됩니다.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-neutral-200">
                    <strong>2. 인사팀 메일(tecs_hr@ywconst.com) 발송 실패:</strong>
                    <p className="mt-0.5 text-neutral-600">
                      - 메일 API 장애가 발생해도 <strong>근로자의 서명 체결 기록 및 최종 PDF 파일은 안전하게 보존</strong>됩니다.<br />
                      - '인사팀 이메일 전송' 탭에서 '수동 재발송' 버튼을 클릭하여 네트워크 복구 즉시 재전송합니다.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-neutral-200">
                    <strong>3. 근로자가 종이 계약서 교부를 요청한 경우:</strong>
                    <p className="mt-0.5 text-neutral-600">
                      - 관리자 콘솔에서 해당 계약의 완성본 A4 1페이지 PDF를 출력하여 등기우편 또는 현장 대면 교부하고, 교부 상태를 '종이교부 완료'로 갱신합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-neutral-200 pt-3 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
