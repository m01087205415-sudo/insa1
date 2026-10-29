/**
 * Main Contract Dashboard & Management Console
 * Manages contracts, filtering, status badges, mobile link dispatches, and resend workflows.
 */

import React, { useState } from 'react';
import { ContractItem, UserRole } from '../types/contract';
import { 
  FileText, 
  Search, 
  Send, 
  Download, 
  ExternalLink, 
  Mail, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  FileSignature, 
  RotateCcw,
  Smartphone,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react';

interface ContractDashboardProps {
  contracts: ContractItem[];
  onSelectContract: (contract: ContractItem) => void;
  onOpenMobileSign: (contract: ContractItem) => void;
  onResendLink: (contractId: string) => void;
  onRetryEmail: (contractId: string) => void;
  onDownloadPdf: (contract: ContractItem) => void;
  onDownloadAuditCert: (contract: ContractItem) => void;
  currentRole: UserRole;
  devMode: boolean;
  onToggleDevMode: () => void;
}

export const ContractDashboard: React.FC<ContractDashboardProps> = ({
  contracts,
  onSelectContract,
  onOpenMobileSign,
  onResendLink,
  onRetryEmail,
  onDownloadPdf,
  onDownloadAuditCert,
  currentRole,
  devMode,
  onToggleDevMode
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('ALL');

  // Filtered contracts
  const filteredContracts = contracts.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (workTypeFilter !== 'ALL' && c.workType !== workTypeFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.empNo.toLowerCase().includes(q) ||
        c.contractNo.toLowerCase().includes(q) ||
        c.siteName.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return <span className="text-emerald-700 font-semibold inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> 체결 완료</span>;
      case 'SENT':
        return <span className="text-blue-700 font-semibold inline-flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> 발송 완료(서명대기)</span>;
      case 'APPROVED':
        return <span className="text-indigo-700 font-semibold inline-flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> 승인·날인완료</span>;
      case 'REVIEW_PENDING':
        return <span className="text-amber-700 font-semibold inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> 검토·승인대기</span>;
      case 'MODIFICATION_REQ':
        return <span className="text-purple-700 font-semibold inline-flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> 수정 요청접수</span>;
      case 'VALIDATION_ERROR':
        return <span className="text-red-600 font-semibold inline-flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> 검증 오류</span>;
      default:
        return <span className="text-neutral-600 font-medium">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>전체 계약서</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <span className="text-2xl font-bold text-neutral-900 font-mono">
            {contracts.length}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-0.5">총 관리 계약 건수</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-600 text-xs mb-1">
            <span>승인 대기</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <span className="text-2xl font-bold text-amber-700 font-mono">
            {contracts.filter(c => c.status === 'REVIEW_PENDING').length}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-0.5">결재권자 검토 필요</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-blue-600 text-xs mb-1">
            <span>모바일 서명 대기</span>
            <Smartphone className="w-4 h-4 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-blue-700 font-mono">
            {contracts.filter(c => c.status === 'SENT' || c.status === 'VIEWED' || c.status === 'SIGNING').length}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-0.5">근로자 링크 전송됨</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-emerald-600 text-xs mb-1">
            <span>체결 완료</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="text-2xl font-bold text-emerald-700 font-mono">
            {contracts.filter(c => c.status === 'SIGNED').length}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-0.5">인사팀 메일 자동 발송</span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-purple-600 text-xs mb-1">
            <span>수정 요청 접수</span>
            <RotateCcw className="w-4 h-4 text-purple-500" />
          </div>
          <span className="text-2xl font-bold text-purple-700 font-mono">
            {contracts.filter(c => c.status === 'MODIFICATION_REQ').length}
          </span>
          <span className="text-[11px] text-neutral-400 block mt-0.5">근로자 피드백 확인</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">전체 진행 상태</option>
              <option value="REVIEW_PENDING">검토 및 승인 대기</option>
              <option value="APPROVED">승인 및 날인 완료</option>
              <option value="SENT">발송 완료 (서명대기)</option>
              <option value="SIGNED">체결 완료</option>
              <option value="MODIFICATION_REQ">수정 요청</option>
              <option value="VALIDATION_ERROR">검증 오류</option>
            </select>

            {/* Work Type Filter */}
            <select
              value={workTypeFilter}
              onChange={(e) => setWorkTypeFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-neutral-50 border border-neutral-200 rounded-lg text-neutral-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="ALL">전체 근무유형 (5종)</option>
              <option value="본사임원">본사임원</option>
              <option value="현장임원">현장임원</option>
              <option value="본사직원">본사직원</option>
              <option value="현장직원">현장직원</option>
              <option value="현장PJT">현장PJT</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="성명, 사번, 계약번호, 현장 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-neutral-50"
              />
            </div>

            {/* Dev Mode Indicator Toggle */}
            <button
              onClick={onToggleDevMode}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                devMode 
                  ? 'bg-amber-50 text-amber-800 border-amber-300' 
                  : 'bg-neutral-100 text-neutral-600 border-neutral-200'
              }`}
              title="가상 발송 모드(Dev Mode)와 실제 발송 모드 전환"
            >
              {devMode ? '가상 발송 모드(Dev)' : '실제 연동 모드'}
            </button>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                <th className="p-3">계약번호 / 버전</th>
                <th className="p-3">성명 / 사번</th>
                <th className="p-3">근무유형 / 현장</th>
                <th className="p-3">휴대전화 (OTP)</th>
                <th className="p-3 text-right">월임금 / 연봉</th>
                <th className="p-3 text-center">진행 상태</th>
                <th className="p-3 text-center">인사팀 메일 전송</th>
                <th className="p-3 text-center">근로자 교부 상태</th>
                <th className="p-3 text-right">작업 및 링크</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-neutral-500">
                    조건에 해당하는 계약서가 없습니다.
                  </td>
                </tr>
              ) : (
                filteredContracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="p-3">
                      <span className="font-semibold text-neutral-900 block font-mono">{contract.contractNo}</span>
                      <span className="text-[11px] text-neutral-500 font-mono">v{contract.version}.0</span>
                    </td>

                    <td className="p-3">
                      <span className="font-bold text-neutral-900 block">{contract.name}</span>
                      <span className="text-[11px] text-neutral-500 font-mono">{contract.empNo} ({contract.jobTitle})</span>
                    </td>

                    <td className="p-3">
                      <span className="font-medium text-neutral-800 block">{contract.workType}</span>
                      <span className="text-[11px] text-neutral-500 truncate block max-w-[130px]">
                        {contract.siteName}
                      </span>
                    </td>

                    <td className="p-3">
                      <span className="font-mono text-neutral-900 block">{contract.phone}</span>
                      {contract.otpCode && (
                        <span className="text-[10px] text-blue-600 font-mono">
                          OTP: {contract.otpCode}
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-right tabular-nums">
                      <span className="font-bold text-neutral-900 block">
                        {contract.wage.monthlySalary.toLocaleString()}원
                      </span>
                      <span className="text-[11px] text-neutral-500 block">
                        연 {contract.wage.annualSalary.toLocaleString()}원
                      </span>
                    </td>

                    <td className="p-3 text-center">
                      {getStatusBadge(contract.status)}
                    </td>

                    <td className="p-3 text-center">
                      {contract.emailStatus === 'DELIVERED' || contract.emailStatus === 'DEV_MODE_SIMULATED' ? (
                        <span className="text-emerald-700 text-[11px] font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          발송완료
                        </span>
                      ) : contract.emailStatus === 'FAILED' ? (
                        <button
                          onClick={() => onRetryEmail(contract.id)}
                          className="text-red-600 hover:text-red-700 text-[11px] font-medium inline-flex items-center gap-1 underline"
                        >
                          <RefreshCw className="w-3 h-3" /> 실패(재시도)
                        </button>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">미발송</span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      {contract.deliveryStatus === 'ELECTRONIC_DELIVERED' ? (
                        <span className="text-blue-700 text-[11px] font-medium inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          전자교부 확인
                        </span>
                      ) : contract.deliveryStatus === 'PAPER_REQUESTED' ? (
                        <span className="text-amber-700 text-[11px] font-medium">
                          종이교부 요청
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-[11px]">미교부</span>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Open mobile signer preview */}
                        <button
                          onClick={() => onOpenMobileSign(contract)}
                          className="px-2 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                          title="근로자 모바일 서명 화면 열기"
                        >
                          <Smartphone className="w-3 h-3" />
                          모바일서명
                        </button>

                        {/* View & Download PDF */}
                        <button
                          onClick={() => onSelectContract(contract)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          title="계약서 보기"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onDownloadPdf(contract)}
                          className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          title="A4 1페이지 PDF 다운로드"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {/* Audit certificate */}
                        <button
                          onClick={() => onDownloadAuditCert(contract)}
                          className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="전자서명 감사증명서 다운로드"
                        >
                          <ShieldCheck className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
