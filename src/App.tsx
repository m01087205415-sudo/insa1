/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  ContractItem, 
  AuditLog, 
  CompanyConfig, 
  UserRole 
} from './types/contract';
import { INITIAL_CONTRACTS, INITIAL_AUDIT_LOGS } from './utils/sampleData';
import { ReviewApprovalInbox } from './components/ReviewApprovalInbox';
import { ContractDashboard } from './components/ContractDashboard';
import { ExcelUploadModal } from './components/ExcelUploadModal';
import { WorkerSigningView } from './components/WorkerSigningView';
import { SealManagement } from './components/SealManagement';
import { AuditTrailView } from './components/AuditTrailView';
import { ComplianceTestRunner } from './components/ComplianceTestRunner';
import { ContractManualModal } from './components/ContractManualModal';
import { ContractDocument } from './components/ContractDocument';
import { 
  generateContractPdfFromElement, 
  generateAuditCertificatePdf, 
  computeSha256 
} from './utils/pdfGenerator';
import { 
  Upload, 
  ShieldCheck, 
  Stamp, 
  Smartphone, 
  HelpCircle, 
  Building, 
  Check, 
  BookOpen,
  FileText,
  UserCheck
} from 'lucide-react';

export default function App() {
  // Navigation State
  type TabKey = 'INBOX' | 'DASHBOARD' | 'SEAL' | 'AUDIT' | 'TESTS';
  const [currentTab, setCurrentTab] = useState<TabKey>('INBOX');

  // Role & Dev Mode
  const [currentRole, setCurrentRole] = useState<UserRole>('APPROVER'); // default to APPROVER to showcase the priority inbox
  const [devMode, setDevMode] = useState<boolean>(true);

  // Contracts & Audit State
  const [contracts, setContracts] = useState<ContractItem[]>(INITIAL_CONTRACTS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Modals & Panels
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState<boolean>(false);
  const [mobileSignContract, setMobileSignContract] = useState<ContractItem | null>(null);
  const [viewingContract, setViewingContract] = useState<ContractItem | null>(null);

  // Offscreen element for PDF rendering
  const offscreenDocRef = useRef<HTMLDivElement>(null);
  const [pdfGeneratingContract, setPdfGeneratingContract] = useState<ContractItem | null>(null);

  // Company Configuration
  const [companyConfig, setCompanyConfig] = useState<CompanyConfig>({
    companyName: '양우종합건설 주식회사',
    ceoName: '고예림',
    businessNumber: '123-45-67890',
    hrEmail: 'tecs_hr@ywconst.com',
    sealPath: '/seal_stamp.png',
    sealVersion: 'YW-SEAL-2026-01',
    salaryCalculationVersion: 'v2026.04-STD',
    minWageHourly2026: 10030,
    devMode: true
  });

  // Action: Add Audit Log
  const addAuditLog = (params: {
    contractId: string;
    contractNo: string;
    version: number;
    eventType: AuditLog['eventType'];
    details: string;
    documentHash?: string;
  }) => {
    const newLog: AuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      contractId: params.contractId,
      contractNo: params.contractNo,
      version: params.version,
      eventType: params.eventType,
      actor: currentRole === 'APPROVER' ? '대표이사 고예림' : currentRole === 'HR_MANAGER' ? '인사팀 담당자' : '시스템 관리자',
      actorRole: currentRole,
      clientIp: '192.168.1.10',
      userAgent: navigator.userAgent,
      details: params.details,
      documentHash: params.documentHash,
      timestamp: new Date().toISOString()
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Action: Approve & Seal Contracts
  const handleApproveAndSeal = (contractIds: string[], approverName: string) => {
    setContracts(prev => prev.map(c => {
      if (contractIds.includes(c.id)) {
        addAuditLog({
          contractId: c.id,
          contractNo: c.contractNo,
          version: c.version,
          eventType: 'APPROVED',
          details: `결재권자(${approverName}) 계약 승인 및 회사 사용인감(${c.sealVersion}) 날인 완료`
        });

        return {
          ...c,
          isApproved: true,
          approvedBy: approverName,
          approvedAt: new Date().toISOString(),
          approvalVersion: c.version,
          isSealed: true,
          sealedBy: approverName,
          sealedAt: new Date().toISOString(),
          status: 'APPROVED',
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));
  };

  // Action: Dispatch Mobile Sign Links
  const handleDispatchLinks = (contractIds: string[]) => {
    setContracts(prev => prev.map(c => {
      if (contractIds.includes(c.id)) {
        const token = `sign_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        addAuditLog({
          contractId: c.id,
          contractNo: c.contractNo,
          version: c.version,
          eventType: 'LINK_DISPATCHED',
          details: `휴대전화(${c.phone})로 전자서명 링크 및 OTP(6자리) 발송 완료 (유효기간: 7일)`
        });

        return {
          ...c,
          status: 'SENT',
          signToken: token,
          tokenExpiresAt: expires,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));
  };

  // Action: Reject or Revoke Approval
  const handleRejectOrRevoke = (contractId: string, reason: string) => {
    setContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        addAuditLog({
          contractId: c.id,
          contractNo: c.contractNo,
          version: c.version,
          eventType: 'LINK_REVOKED',
          details: `계약서 반려 및 기존 승인/링크 무효화 처리 (사유: ${reason})`
        });

        return {
          ...c,
          isApproved: false,
          isSealed: false,
          status: 'REVIEW_PENDING',
          signToken: undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));
  };

  // Action: Worker Signed Complete
  const handleWorkerSignComplete = (signatureDataUrl: string, finalPdfHash: string) => {
    if (!mobileSignContract) return;

    const contractId = mobileSignContract.id;
    const nowIso = new Date().toISOString();

    setContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        addAuditLog({
          contractId: c.id,
          contractNo: c.contractNo,
          version: c.version,
          eventType: 'SIGNED',
          details: `근로자(${c.name}) 본인확인 및 전자서명 제출 완료 (SHA-256 해시 확정)`,
          documentHash: finalPdfHash
        });

        addAuditLog({
          contractId: c.id,
          contractNo: c.contractNo,
          version: c.version,
          eventType: 'EMAIL_DISPATCHED',
          details: `인사팀 메일(tecs_hr@ywconst.com)로 최종 완성본 PDF 자동 첨부 발송 완료`
        });

        addAuditLog({
          contractId: c.id,
          contractNo: c.contractNo,
          version: c.version,
          eventType: 'DELIVERY_CONFIRMED',
          details: `근로자에게 동일한 완성본 계약서 PDF 다운로드 교부 완료`
        });

        const updated: ContractItem = {
          ...c,
          status: 'SIGNED',
          signatureDataUrl,
          finalPdfHash,
          workerSignedAt: nowIso,
          emailStatus: 'DELIVERED',
          emailSentAt: nowIso,
          deliveryStatus: 'ELECTRONIC_DELIVERED',
          deliveredAt: nowIso,
          updatedAt: nowIso
        };

        setMobileSignContract(updated);
        return updated;
      }
      return c;
    }));
  };

  // Action: Worker Modification Request
  const handleWorkerModification = (contractId: string, reason: string) => {
    setContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        addAuditLog({
          contractId: c.id,
          contractNo: c.contractNo,
          version: c.version,
          eventType: 'MODIFICATION_REQUESTED',
          details: `근로자 수정 요청 접수: "${reason}" (기존 서명 진행 일시 중단)`
        });

        const updated: ContractItem = {
          ...c,
          status: 'MODIFICATION_REQ',
          modificationRequest: {
            requestedAt: new Date().toISOString(),
            reason,
            status: 'PENDING'
          },
          updatedAt: new Date().toISOString()
        };

        if (mobileSignContract && mobileSignContract.id === contractId) {
          setMobileSignContract(updated);
        }
        return updated;
      }
      return c;
    }));
  };

  // Action: Request Paper Delivery
  const handleRequestPaperDelivery = (contractId: string) => {
    setContracts(prev => prev.map(c => {
      if (c.id === contractId) {
        addAuditLog({
          contractId: c.id,
          contractNo: c.contractNo,
          version: c.version,
          eventType: 'DELIVERY_CONFIRMED',
          details: `근로자가 종이 계약서 우편 교부를 별도 신청함`
        });

        return {
          ...c,
          deliveryStatus: 'PAPER_REQUESTED',
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));
    alert('종이 계약서 우편 교부 요청이 인사팀에 전달되었습니다.');
  };

  // Action: Retry Email
  const handleRetryEmail = (contractId: string) => {
    const c = contracts.find(item => item.id === contractId);
    if (!c) return;

    addAuditLog({
      contractId: c.id,
      contractNo: c.contractNo,
      version: c.version,
      eventType: 'EMAIL_DISPATCHED',
      details: `인사팀 메일(tecs_hr@ywconst.com) 수동 재발송 처리 완료`
    });

    setContracts(prev => prev.map(item => 
      item.id === contractId 
        ? { ...item, emailStatus: 'DELIVERED', emailSentAt: new Date().toISOString() } 
        : item
    ));
    alert(`[근로계약 체결완료] ${c.siteName}_${c.empNo}_${c.name}_${c.contractNo} 메일이 tecs_hr@ywconst.com 으로 재발송되었습니다.`);
  };

  // Action: Download Contract PDF
  const handleDownloadPdf = async (contract: ContractItem) => {
    setPdfGeneratingContract(contract);
    // Give DOM a frame to render
    setTimeout(async () => {
      if (offscreenDocRef.current) {
        const { dataUri } = await generateContractPdfFromElement(
          offscreenDocRef.current,
          contract.contractNo,
          contract.name
        );
        const a = document.createElement('a');
        a.href = dataUri;
        a.download = `양우종합건설_근로계약서_${contract.name}_${contract.contractNo}.pdf`;
        a.click();
      }
      setPdfGeneratingContract(null);
    }, 150);
  };

  // Action: Download Audit Certificate
  const handleDownloadAuditCert = async (contract: ContractItem) => {
    const { pdfBlob } = await generateAuditCertificatePdf({
      contract,
      auditLogs,
      approverName: contract.approvedBy || companyConfig.ceoName
    });
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `양우종합건설_전자서명_감사증명서_${contract.contractNo}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Action: Excel Import Success
  const handleUploadSuccess = (imported: ContractItem[]) => {
    setContracts(prev => [...imported, ...prev]);
    for (const c of imported) {
      addAuditLog({
        contractId: c.id,
        contractNo: c.contractNo,
        version: c.version,
        eventType: 'EXCEL_VALIDATED',
        details: `엑셀 일괄 등록 완료 (월임금: ${c.wage.monthlySalary.toLocaleString()}원, 기준급: ${c.wage.basePay.toLocaleString()}원, 10원 검증 통과)`
      });
    }
    setCurrentTab('INBOX'); // switch directly to review inbox
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col font-sans text-neutral-900">
      {/* Top Bar (conforming strictly to Top Bar Contract) */}
      <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-xs">
        {/* Zone 1: Brand title, one line */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-white font-bold text-xs">
            YW
          </div>
          <a href="/" className="text-base font-bold tracking-tight text-neutral-950 whitespace-nowrap shrink-0">
            양우종합건설 전자근로계약
          </a>
        </div>

        {/* Zone 2: 4-5 nav links, single-line (with Review & Approval Inbox priority) */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-neutral-600">
          <button
            onClick={() => setCurrentTab('INBOX')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 relative ${
              currentTab === 'INBOX' 
                ? 'text-blue-600 font-bold border-b-2 border-blue-600' 
                : 'hover:text-neutral-950'
            }`}
          >
            검토 및 승인 대기함
            {contracts.filter(c => c.status === 'REVIEW_PENDING').length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full text-[10px] font-mono">
                {contracts.filter(c => c.status === 'REVIEW_PENDING').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentTab('DASHBOARD')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'DASHBOARD' 
                ? 'text-blue-600 font-bold border-b-2 border-blue-600' 
                : 'hover:text-neutral-950'
            }`}
          >
            계약 관리 대시보드
          </button>

          <button
            onClick={() => setCurrentTab('SEAL')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'SEAL' 
                ? 'text-blue-600 font-bold border-b-2 border-blue-600' 
                : 'hover:text-neutral-950'
            }`}
          >
            사용인감 및 서식관리
          </button>

          <button
            onClick={() => setCurrentTab('AUDIT')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'AUDIT' 
                ? 'text-blue-600 font-bold border-b-2 border-blue-600' 
                : 'hover:text-neutral-950'
            }`}
          >
            감사증적·이메일 로그
          </button>

          <button
            onClick={() => setCurrentTab('TESTS')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              currentTab === 'TESTS' 
                ? 'text-blue-600 font-bold border-b-2 border-blue-600' 
                : 'hover:text-neutral-950'
            }`}
          >
            14대 자동검증
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>엑셀 일괄 업로드</span>
          </button>
        </div>
      </header>

      {/* Secondary Operational Strip: Role Switcher & Manual */}
      <div className="bg-neutral-50 border-b border-neutral-200 px-6 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Mobile Navigation Tabs for small screens */}
        <div className="flex lg:hidden items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setCurrentTab('INBOX')}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${currentTab === 'INBOX' ? 'bg-blue-600 text-white' : 'text-neutral-600'}`}
          >
            승인대기함
          </button>
          <button
            onClick={() => setCurrentTab('DASHBOARD')}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${currentTab === 'DASHBOARD' ? 'bg-blue-600 text-white' : 'text-neutral-600'}`}
          >
            대시보드
          </button>
          <button
            onClick={() => setCurrentTab('SEAL')}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${currentTab === 'SEAL' ? 'bg-blue-600 text-white' : 'text-neutral-600'}`}
          >
            인감/서식
          </button>
          <button
            onClick={() => setCurrentTab('AUDIT')}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${currentTab === 'AUDIT' ? 'bg-blue-600 text-white' : 'text-neutral-600'}`}
          >
            감사증적
          </button>
          <button
            onClick={() => setCurrentTab('TESTS')}
            className={`px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap ${currentTab === 'TESTS' ? 'bg-blue-600 text-white' : 'text-neutral-600'}`}
          >
            14대 검증
          </button>
        </div>

        {/* Role Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-neutral-500 text-[11px] font-medium">현재 접속 권한:</span>
          <div className="flex items-center gap-1 p-0.5 bg-neutral-200 rounded-lg">
            {(['APPROVER', 'HR_MANAGER', 'ADMIN'] as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setCurrentRole(r)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                  currentRole === r 
                    ? 'bg-white text-neutral-900 shadow-2xs font-bold' 
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {r === 'APPROVER' && '승인권자 (대표이사)'}
                {r === 'HR_MANAGER' && '인사 담당자'}
                {r === 'ADMIN' && '시스템 관리자'}
              </button>
            ))}
          </div>
        </div>

        {/* Right side utility buttons */}
        <div className="flex items-center gap-3">
          {/* Worker Simulation Direct Button */}
          <button
            onClick={() => setMobileSignContract(contracts[0])}
            className="flex items-center gap-1 text-[11px] text-blue-700 hover:text-blue-800 font-semibold"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>근로자 모바일 서명 화면 체험</span>
          </button>

          {/* Operational Manual Modal Button */}
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-1 text-[11px] text-neutral-600 hover:text-neutral-900 font-medium"
          >
            <BookOpen className="w-3.5 h-3.5 text-neutral-500" />
            <span>운영·법률 매뉴얼</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {currentTab === 'INBOX' && (
          <ReviewApprovalInbox
            contracts={contracts}
            onApproveAndSeal={handleApproveAndSeal}
            onRejectOrRevoke={handleRejectOrRevoke}
            onDispatchLinks={handleDispatchLinks}
            onSelectForView={(c) => setViewingContract(c)}
            currentRole={currentRole}
          />
        )}

        {currentTab === 'DASHBOARD' && (
          <ContractDashboard
            contracts={contracts}
            onSelectContract={(c) => setViewingContract(c)}
            onOpenMobileSign={(c) => setMobileSignContract(c)}
            onResendLink={(id) => handleDispatchLinks([id])}
            onRetryEmail={handleRetryEmail}
            onDownloadPdf={handleDownloadPdf}
            onDownloadAuditCert={handleDownloadAuditCert}
            currentRole={currentRole}
            devMode={devMode}
            onToggleDevMode={() => setDevMode(!devMode)}
          />
        )}

        {currentTab === 'SEAL' && (
          <SealManagement
            companyConfig={companyConfig}
            currentRole={currentRole}
            onUpdateConfig={(cfg) => setCompanyConfig(prev => ({ ...prev, ...cfg }))}
          />
        )}

        {currentTab === 'AUDIT' && (
          <AuditTrailView
            contracts={contracts}
            auditLogs={auditLogs}
            onRetryEmail={handleRetryEmail}
            onDownloadAuditCert={handleDownloadAuditCert}
          />
        )}

        {currentTab === 'TESTS' && (
          <ComplianceTestRunner />
        )}
      </main>

      {/* Excel Upload Modal */}
      <ExcelUploadModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onUploadSuccess={handleUploadSuccess}
      />

      {/* Contract Manual Modal */}
      <ContractManualModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
      />

      {/* Worker Mobile Signing View Modal / Simulator */}
      {mobileSignContract && (
        <div className="fixed inset-0 bg-neutral-900/80 backdrop-blur-xs flex items-center justify-center p-2 z-50 overflow-y-auto">
          <div className="w-full max-w-md my-4">
            <WorkerSigningView
              contract={mobileSignContract}
              onSignComplete={handleWorkerSignComplete}
              onRequestModification={handleWorkerModification}
              onRequestPaperDelivery={handleRequestPaperDelivery}
              onClose={() => setMobileSignContract(null)}
            />
          </div>
        </div>
      )}

      {/* Single Contract Full Preview Modal */}
      {viewingContract && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-neutral-100 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  계약서 열람: {viewingContract.name} ({viewingContract.contractNo})
                </h3>
                <span className="text-xs text-neutral-500">
                  {viewingContract.workType} | {viewingContract.siteName} | 규격: A4 세로 210mm × 297mm 1페이지
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(viewingContract)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  <FileText className="w-3.5 h-3.5" />
                  PDF 내려받기
                </button>
                <button
                  onClick={() => setViewingContract(null)}
                  className="px-3 py-1.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-lg text-xs font-medium"
                >
                  닫기
                </button>
              </div>
            </div>

            <div className="overflow-x-auto flex justify-center py-2">
              <div className="transform origin-top scale-[0.85] sm:scale-100">
                <ContractDocument
                  contract={viewingContract}
                  showSeal={viewingContract.isSealed || viewingContract.isApproved}
                  showSignature={Boolean(viewingContract.signatureDataUrl || viewingContract.workerSignedAt)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Offscreen A4 container for crisp canvas PDF generation */}
      {pdfGeneratingContract && (
        <div className="fixed left-[-9999px] top-[-9999px] z-[-1] pointer-events-none">
          <ContractDocument
            ref={offscreenDocRef}
            contract={pdfGeneratingContract}
            showSeal={pdfGeneratingContract.isSealed || pdfGeneratingContract.isApproved}
            showSignature={Boolean(pdfGeneratingContract.signatureDataUrl || pdfGeneratingContract.workerSignedAt)}
          />
        </div>
      )}
    </div>
  );
}
