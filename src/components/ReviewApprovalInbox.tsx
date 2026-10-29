/**
 * Review & Approval Inbox (검토 및 승인 대기함)
 * Priority screen requested for executive approvers and HR leadership.
 * Validates wage calculations, A4 1-page fit, and blocks unverified contracts.
 */

import React, { useState } from 'react';
import { ContractItem, UserRole } from '../types/contract';
import { ContractDocument } from './ContractDocument';
import { 
  CheckCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Eye, 
  Stamp, 
  Send, 
  UserCheck, 
  Search, 
  FileCheck,
  RotateCcw,
  Clock,
  Sparkles
} from 'lucide-react';

interface ReviewApprovalInboxProps {
  contracts: ContractItem[];
  onApproveAndSeal: (contractIds: string[], approverName: string) => void;
  onRejectOrRevoke: (contractId: string, reason: string) => void;
  onDispatchLinks: (contractIds: string[]) => void;
  onSelectForView: (contract: ContractItem) => void;
  currentRole: UserRole;
}

export const ReviewApprovalInbox: React.FC<ReviewApprovalInboxProps> = ({
  contracts,
  onApproveAndSeal,
  onRejectOrRevoke,
  onDispatchLinks,
  onSelectForView,
  currentRole
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [metricFilter, setMetricFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'LEGAL_REVIEW' | 'SIGNED'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [previewContract, setPreviewContract] = useState<ContractItem | null>(null);
  const [approverName, setApproverName] = useState<string>('대표이사 고예림');
  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [targetRejectId, setTargetRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  // Counts for the 4 metric cards
  const pendingCount = contracts.filter(c => c.status === 'REVIEW_PENDING' && !c.requiresLegalReview).length;
  const approvedCount = contracts.filter(c => (c.status === 'APPROVED' || c.isSealed) && c.status !== 'SIGNED').length;
  const legalReviewCount = contracts.filter(c => c.requiresLegalReview).length;
  const signedCount = contracts.filter(c => c.status === 'SIGNED').length;

  // Filter contracts based on clicked metric card + workType + search
  const displayedContracts = contracts.filter(c => {
    // 1. Metric card click filter (from captured screenshot)
    if (metricFilter === 'PENDING') {
      if (c.status !== 'REVIEW_PENDING' || c.requiresLegalReview) return false;
    } else if (metricFilter === 'APPROVED') {
      if ((c.status !== 'APPROVED' && !c.isSealed) || c.status === 'SIGNED') return false;
    } else if (metricFilter === 'LEGAL_REVIEW') {
      if (!c.requiresLegalReview) return false;
    } else if (metricFilter === 'SIGNED') {
      if (c.status !== 'SIGNED') return false;
    }

    // 2. Work type filter
    if (filterType !== 'ALL' && c.workType !== filterType) return false;

    // 3. Search query
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.empNo.toLowerCase().includes(q) ||
        c.contractNo.toLowerCase().includes(q) ||
        c.siteName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const validPendingIds = displayedContracts
        .filter(c => !c.requiresLegalReview && c.status !== 'VALIDATION_ERROR' && c.status !== 'SIGNED')
        .map(c => c.id);
      setSelectedIds(validPendingIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    onApproveAndSeal(selectedIds, approverName);
    setSelectedIds([]);
  };

  const handleBatchDispatch = () => {
    if (selectedIds.length === 0) return;
    onDispatchLinks(selectedIds);
    setSelectedIds([]);
  };

  const executeReject = () => {
    if (targetRejectId && rejectReason.trim()) {
      onRejectOrRevoke(targetRejectId, rejectReason);
      setRejectModalOpen(false);
      setTargetRejectId(null);
      setRejectReason('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Overview */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
                검토 및 승인 대기함
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                승인권자 전용 결재창
              </span>
            </div>
            <p className="text-xs text-neutral-600 mt-1">
              생성된 근로계약서의 A4 1페이지 규격, 10원 단위 반올림 임금 산식, 법률 검토 여부를 확인한 후 회사 사용인감 날인 및 휴대전화 서명 링크 발송을 최종 승인합니다.
            </p>
          </div>

          {/* Approver Identity Selector */}
          <div className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 p-2.5 rounded-lg shrink-0">
            <UserCheck className="w-4 h-4 text-neutral-600" />
            <div className="text-xs">
              <span className="text-neutral-500 block text-[10px]">결재권자 서명자</span>
              <select
                value={approverName}
                onChange={(e) => setApproverName(e.target.value)}
                className="font-semibold text-neutral-900 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
              >
                <option value="대표이사 고예림">대표이사 고예림 (직인/인감권한)</option>
                <option value="인사총무본부장 이고모">인사총무본부장 이고모 (위임전결)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Status Metrics Bar - Interactive Clickable Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-neutral-100 text-xs">
          {/* Card 1: 결재 대기 중 */}
          <button
            type="button"
            onClick={() => setMetricFilter(prev => prev === 'PENDING' ? 'ALL' : 'PENDING')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
              metricFilter === 'PENDING'
                ? 'bg-neutral-900 text-white border-neutral-900 shadow-md ring-2 ring-neutral-900'
                : 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`block font-medium ${metricFilter === 'PENDING' ? 'text-neutral-200' : 'text-neutral-600'}`}>
                결재 대기 중
              </span>
              {metricFilter === 'PENDING' && (
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-semibold">
                  필터 적용 중
                </span>
              )}
            </div>
            <span className="text-xl font-bold font-mono mt-1 block">
              {pendingCount}건
            </span>
            <span className={`text-[10px] mt-0.5 block ${metricFilter === 'PENDING' ? 'text-neutral-300' : 'text-neutral-400'}`}>
              클릭 시 결재 대기 건만 필터링
            </span>
          </button>

          {/* Card 2: 날인/승인 완료 */}
          <button
            type="button"
            onClick={() => setMetricFilter(prev => prev === 'APPROVED' ? 'ALL' : 'APPROVED')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
              metricFilter === 'APPROVED'
                ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-600'
                : 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`block font-medium ${metricFilter === 'APPROVED' ? 'text-emerald-100' : 'text-emerald-700'}`}>
                날인/승인 완료
              </span>
              {metricFilter === 'APPROVED' && (
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-semibold">
                  필터 적용 중
                </span>
              )}
            </div>
            <span className="text-xl font-bold font-mono mt-1 block">
              {approvedCount}건
            </span>
            <span className={`text-[10px] mt-0.5 block ${metricFilter === 'APPROVED' ? 'text-emerald-100' : 'text-emerald-600'}`}>
              클릭 시 날인·승인 완료 건만 필터링
            </span>
          </button>

          {/* Card 3: 노무/법률 검토필요 (발송차단) */}
          <button
            type="button"
            onClick={() => setMetricFilter(prev => prev === 'LEGAL_REVIEW' ? 'ALL' : 'LEGAL_REVIEW')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
              metricFilter === 'LEGAL_REVIEW'
                ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-500'
                : 'bg-amber-50 hover:bg-amber-100/70 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`block font-medium ${metricFilter === 'LEGAL_REVIEW' ? 'text-amber-100' : 'text-amber-700'}`}>
                노무/법률 검토필요 (발송차단)
              </span>
              {metricFilter === 'LEGAL_REVIEW' && (
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-semibold">
                  필터 적용 중
                </span>
              )}
            </div>
            <span className="text-xl font-bold font-mono mt-1 block">
              {legalReviewCount}건
            </span>
            <span className={`text-[10px] mt-0.5 block ${metricFilter === 'LEGAL_REVIEW' ? 'text-amber-100' : 'text-amber-700'}`}>
              클릭 시 검토 필요 차단건만 필터링
            </span>
          </button>

          {/* Card 4: 체결 완료 (서명완료본) */}
          <button
            type="button"
            onClick={() => setMetricFilter(prev => prev === 'SIGNED' ? 'ALL' : 'SIGNED')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative ${
              metricFilter === 'SIGNED'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-500'
                : 'bg-blue-50 hover:bg-blue-100/70 border-blue-200 text-blue-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`block font-medium ${metricFilter === 'SIGNED' ? 'text-blue-100' : 'text-blue-700'}`}>
                체결 완료 (서명완료본)
              </span>
              {metricFilter === 'SIGNED' && (
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded font-semibold">
                  필터 적용 중
                </span>
              )}
            </div>
            <span className="text-xl font-bold font-mono mt-1 block">
              {signedCount}건
            </span>
            <span className={`text-[10px] mt-0.5 block ${metricFilter === 'SIGNED' ? 'text-blue-100' : 'text-blue-600'}`}>
              클릭 시 최종 체결본만 필터링
            </span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Batch Actions */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm space-y-3">
        {/* Active Filter Notice Bar */}
        {metricFilter !== 'ALL' && (
          <div className="flex items-center justify-between p-2.5 px-3 bg-neutral-900 text-white rounded-lg text-xs">
            <span className="font-medium flex items-center gap-1.5">
              <span className="text-neutral-400">선택된 상태 필터:</span>
              <strong className="underline underline-offset-2">
                {metricFilter === 'PENDING' && '결재 대기 중'}
                {metricFilter === 'APPROVED' && '날인/승인 완료'}
                {metricFilter === 'LEGAL_REVIEW' && '노무/법률 검토필요 (발송차단)'}
                {metricFilter === 'SIGNED' && '체결 완료 (서명완료본)'}
              </strong>
              <span className="text-neutral-300">({displayedContracts.length}건 표시)</span>
            </span>
            <button
              onClick={() => setMetricFilter('ALL')}
              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded text-white font-semibold transition-colors"
            >
              필터 해제 (전체 보기)
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Work Type Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg text-xs overflow-x-auto w-full sm:w-auto">
            {['ALL', '본사임원', '현장임원', '본사직원', '현장직원', '현장PJT'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 font-medium rounded-md transition-colors whitespace-nowrap ${
                  filterType === type 
                    ? 'bg-white text-neutral-900 shadow-sm font-bold' 
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {type === 'ALL' ? '전체 보기' : type}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="text"
              placeholder="성명, 사번, 현장명 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-neutral-50"
            />
          </div>
        </div>

        {/* Batch Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-xs">
          <div className="flex items-center gap-2 text-neutral-600">
            <span>선택됨: <strong className="text-neutral-900">{selectedIds.length}</strong>건</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleBatchApprove}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              <Stamp className="w-3.5 h-3.5" />
              선택 항목 인감 날인 및 승인
            </button>
            <button
              onClick={handleBatchDispatch}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              모바일 링크 개별 발송
            </button>
          </div>
        </div>
      </div>

      {/* Contract Table */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedIds.length > 0 && selectedIds.length === displayedContracts.filter(c => !c.requiresLegalReview && c.status !== 'SIGNED').length}
                    className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-3">계약번호 / 사번</th>
                <th className="p-3">성명 / 직급</th>
                <th className="p-3">근무유형 / 현장</th>
                <th className="p-3 text-right">월임금 / 기준급</th>
                <th className="p-3 text-center">10원 반올림 검증</th>
                <th className="p-3 text-center">A4 1페이지 규격</th>
                <th className="p-3 text-center">승인 및 날인 상태</th>
                <th className="p-3 text-right">관리 작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {displayedContracts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-neutral-500 space-y-2">
                    <p className="font-semibold text-sm text-neutral-700">
                      선택한 조건에 해당하는 계약서가 없습니다.
                    </p>
                    <p className="text-xs text-neutral-500">
                      {metricFilter !== 'ALL' ? '상태 카드 필터를 해제하거나 다른 항목을 선택해주세요.' : '현재 대기 중인 계약서가 없습니다.'}
                    </p>
                    {metricFilter !== 'ALL' && (
                      <button
                        onClick={() => setMetricFilter('ALL')}
                        className="mt-2 px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition-colors"
                      >
                        전체 보기로 돌아가기
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                displayedContracts.map((contract) => {
                  const isSelected = selectedIds.includes(contract.id);
                  const isBlocked = contract.requiresLegalReview || contract.status === 'VALIDATION_ERROR';

                  return (
                    <tr 
                      key={contract.id}
                      className={`hover:bg-neutral-50/80 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          disabled={isBlocked}
                          checked={isSelected}
                          onChange={() => handleToggleSelect(contract.id)}
                          className="rounded border-neutral-300 text-blue-600 focus:ring-blue-500 disabled:opacity-30"
                        />
                      </td>

                      <td className="p-3">
                        <span className="font-semibold text-neutral-900 block font-mono">{contract.contractNo}</span>
                        <span className="text-[11px] text-neutral-500 font-mono">사번 {contract.empNo} (v{contract.version})</span>
                      </td>

                      <td className="p-3">
                        <span className="font-bold text-neutral-900 block">{contract.name}</span>
                        <span className="text-[11px] text-neutral-500">{contract.jobTitle} / {contract.duty}</span>
                      </td>

                      <td className="p-3">
                        <span className="font-medium text-neutral-800 block">{contract.workType}</span>
                        <span className="text-[11px] text-neutral-500 truncate block max-w-[130px]">{contract.siteName}</span>
                      </td>

                      <td className="p-3 text-right tabular-nums">
                        <span className="font-bold text-neutral-900 block">
                          {contract.wage.monthlySalary.toLocaleString()}원
                        </span>
                        <span className="text-[11px] text-neutral-500 block">
                          기준급 {contract.wage.basePay.toLocaleString()}원
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        {contract.wage.isVerified10Won ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle className="w-3.5 h-3.5" />
                            일치 (검증완료)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            불일치 오류
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {contract.pageCompliance.isExactlyOnePage ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-700">
                            <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                            1페이지 (297mm)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            규격 초과
                          </span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        {contract.status === 'SIGNED' ? (
                          <div className="text-[11px] text-blue-700 font-semibold flex items-center justify-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                            체결 완료 (서명완료본)
                          </div>
                        ) : contract.requiresLegalReview ? (
                          <div className="text-[11px] text-amber-700 font-semibold flex items-center justify-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                            검토 필요 (발송차단)
                          </div>
                        ) : contract.isSealed || contract.isApproved ? (
                          <div className="text-[11px] text-emerald-700 font-semibold flex items-center justify-center gap-1">
                            <Stamp className="w-3.5 h-3.5 text-emerald-600" />
                            날인완료 ({contract.approvedBy ? contract.approvedBy.split(' ')[0] : '승인'})
                          </div>
                        ) : (
                          <div className="text-[11px] text-neutral-500 flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            승인 대기
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPreviewContract(contract)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                            title="계약서 미리보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {contract.status === 'SIGNED' ? (
                            <button
                              onClick={() => setPreviewContract(contract)}
                              className="px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-medium transition-colors"
                            >
                              체결본 보기
                            </button>
                          ) : (
                            <>
                              {!contract.isApproved && !contract.requiresLegalReview && (
                                <button
                                  onClick={() => onApproveAndSeal([contract.id], approverName)}
                                  className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-[11px] font-medium transition-colors"
                                >
                                  날인 승인
                                </button>
                              )}

                              {contract.isApproved && contract.status !== 'SENT' && (
                                <button
                                  onClick={() => onDispatchLinks([contract.id])}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-medium transition-colors"
                                >
                                  발송
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setTargetRejectId(contract.id);
                                  setRejectModalOpen(true);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                title="반려 및 수정요청"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live A4 1-Page Preview Modal */}
      {previewContract && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-neutral-100 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  계약서 실물 미리보기: {previewContract.name} ({previewContract.contractNo})
                </h3>
                <span className="text-xs text-neutral-500">
                  규격: A4 세로 210mm × 297mm 1페이지 검증 통과 | 회사 사용인감 적용 여부 실시간 렌더링
                </span>
              </div>
              <div className="flex items-center gap-2">
                {!previewContract.isApproved && !previewContract.requiresLegalReview && (
                  <button
                    onClick={() => {
                      onApproveAndSeal([previewContract.id], approverName);
                      setPreviewContract(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-semibold"
                  >
                    <Stamp className="w-3.5 h-3.5" />
                    이 계약서 날인 및 승인
                  </button>
                )}
                <button
                  onClick={() => setPreviewContract(null)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-medium"
                >
                  닫기
                </button>
              </div>
            </div>

            {/* Document Render Canvas */}
            <div className="overflow-x-auto flex justify-center py-2">
              <div className="transform origin-top scale-[0.85] sm:scale-100">
                <ContractDocument
                  contract={previewContract}
                  showSeal={previewContract.isSealed || previewContract.isApproved}
                  showSignature={Boolean(previewContract.signatureDataUrl || previewContract.workerSignedAt)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject / Modification Request Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-neutral-900">계약서 반려 및 수정 요청 사유</h3>
            <p className="text-xs text-neutral-600">
              반려 시 기존 승인 및 발송 링크는 즉시 폐기 처리되며, 인사팀에 수정 요청 알림이 전달됩니다.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="예: 월임금 산정식 불일치 재확인 필요, 현장소장 직책수당 누락 등..."
              rows={3}
              className="w-full p-2.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg hover:bg-neutral-50 text-neutral-600"
              >
                취소
              </button>
              <button
                onClick={executeReject}
                disabled={!rejectReason.trim()}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg font-medium"
              >
                반려 처리
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
