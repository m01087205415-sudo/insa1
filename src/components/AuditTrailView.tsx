/**
 * Audit Trail & Email Dispatch Logs (전자서명 감사증적 및 이메일 발송 로그)
 * Chronological records, cryptographic SHA-256 hashes, and email dispatch status to tecs_hr@ywconst.com.
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Mail, 
  FileCheck2, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink,
  Download,
  Filter
} from 'lucide-react';
import { AuditLog, ContractItem } from '../types/contract';
import { generateAuditCertificatePdf } from '../utils/pdfGenerator';

interface AuditTrailViewProps {
  contracts: ContractItem[];
  auditLogs: AuditLog[];
  onRetryEmail: (contractId: string) => void;
  onDownloadAuditCert: (contract: ContractItem) => void;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  contracts,
  auditLogs,
  onRetryEmail,
  onDownloadAuditCert
}) => {
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'EMAIL'>('AUDIT');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredLogs = auditLogs.filter(log => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      log.contractNo.toLowerCase().includes(q) ||
      log.actor.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.eventType.toLowerCase().includes(q)
    );
  });

  const emailContracts = contracts.filter(c => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.contractNo.toLowerCase().includes(q) ||
      c.empNo.toLowerCase().includes(q) ||
      c.siteName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              전자서명 감사증적 및 인사팀 이메일 발송 관리
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              전자서명법 제18조 및 근로기준법 제42조에 따른 서명 전후 SHA-256 해시, OTP 인증, IP/UserAgent 감사기록과 인사팀(tecs_hr@ywconst.com) 발송 현황을 투명하게 관리합니다.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'AUDIT'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              전자서명 증적 로그 ({auditLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('EMAIL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'EMAIL'
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
              }`}
            >
              인사팀 이메일 전송 ({contracts.length})
            </button>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
          <input
            type="text"
            placeholder="계약번호, 성명, 이벤트 내용 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-neutral-50"
          />
        </div>

        <span className="text-xs text-neutral-500">
          * 법정 보존기간: 근로계약 체결일로부터 3년 (자동 영구보존 모드 적용 중)
        </span>
      </div>

      {/* Tab 1: Audit Logs Table */}
      {activeTab === 'AUDIT' ? (
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                  <th className="p-3 w-40">발생 시각 (KST)</th>
                  <th className="p-3">계약번호 / 버전</th>
                  <th className="p-3">이벤트 유형</th>
                  <th className="p-3">작업 주체 / 역할</th>
                  <th className="p-3">상세 기록 내용</th>
                  <th className="p-3">접속 IP / 단말</th>
                  <th className="p-3 text-right">감사증명서</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-neutral-500">
                      등록된 감사 기록이 없습니다.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => {
                    const contract = contracts.find(c => c.id === log.contractId);

                    return (
                      <tr key={log.id} className="hover:bg-neutral-50/80 transition-colors">
                        <td className="p-3 font-mono text-neutral-600">
                          {log.timestamp.slice(0, 19).replace('T', ' ')}
                        </td>

                        <td className="p-3">
                          <span className="font-semibold text-neutral-900 font-mono block">{log.contractNo}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">v{log.version}.0</span>
                        </td>

                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-neutral-100 text-neutral-800 border border-neutral-200">
                            {log.eventType}
                          </span>
                        </td>

                        <td className="p-3">
                          <span className="font-medium text-neutral-900 block">{log.actor}</span>
                          <span className="text-[10px] text-neutral-500">{log.actorRole}</span>
                        </td>

                        <td className="p-3 text-neutral-800">
                          <p className="line-clamp-2 max-w-md">{log.details}</p>
                          {log.documentHash && (
                            <span className="text-[9px] font-mono text-blue-700 block truncate max-w-sm mt-0.5">
                              Hash: {log.documentHash}
                            </span>
                          )}
                        </td>

                        <td className="p-3 font-mono text-[11px] text-neutral-500">
                          <span>{log.clientIp || '127.0.0.1'}</span>
                        </td>

                        <td className="p-3 text-right">
                          {contract && (
                            <button
                              onClick={() => onDownloadAuditCert(contract)}
                              className="px-2.5 py-1 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                              title="감사증명서 다운로드"
                            >
                              <Download className="w-3 h-3 text-neutral-500" />
                              증명서
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab 2: HR Email Dispatch Log */
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                  <th className="p-3">계약번호 / 성명</th>
                  <th className="p-3">수신 이메일 주소</th>
                  <th className="p-3">이메일 제목 형식</th>
                  <th className="p-3 text-center">전송 상태</th>
                  <th className="p-3">전송 시각</th>
                  <th className="p-3 text-right">관리 작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {emailContracts.map((c) => {
                  const subjectExample = `[근로계약 체결완료] ${c.siteName}_${c.empNo}_${c.name}_${c.contractNo}`;
                  const isSent = c.emailStatus === 'DELIVERED' || c.emailStatus === 'DEV_MODE_SIMULATED' || c.emailStatus === 'SENT';

                  return (
                    <tr key={c.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="p-3">
                        <span className="font-bold text-neutral-900 block">{c.name}</span>
                        <span className="text-[11px] font-mono text-neutral-500">{c.contractNo} ({c.empNo})</span>
                      </td>

                      <td className="p-3 font-mono text-neutral-800">
                        tecs_hr@ywconst.com
                      </td>

                      <td className="p-3">
                        <span className="text-neutral-700 truncate block max-w-sm font-medium">
                          {subjectExample}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          첨부: 회사 직인 및 근로자 서명 합성 최종 PDF 1부
                        </span>
                      </td>

                      <td className="p-3 text-center">
                        {isSent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            전송 완료
                          </span>
                        ) : c.emailStatus === 'FAILED' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                            전송 실패
                          </span>
                        ) : (
                          <span className="text-neutral-400 text-[11px]">대기 중 (서명 후 자동발송)</span>
                        )}
                      </td>

                      <td className="p-3 font-mono text-neutral-500">
                        {c.emailSentAt ? c.emailSentAt.slice(0, 19).replace('T', ' ') : '-'}
                      </td>

                      <td className="p-3 text-right">
                        <button
                          onClick={() => onRetryEmail(c.id)}
                          className="px-2.5 py-1 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 rounded text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className="w-3 h-3 text-neutral-500" />
                          수동 재발송
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
