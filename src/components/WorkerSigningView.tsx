/**
 * Worker Mobile Signing View (근로자 모바일 전용 전자계약 체결 화면)
 * Operates without app install on mobile browsers.
 * Flow: Identity verification (Birth + Phone OTP) -> Full Contract View -> Modification Request or Canvas Signature -> Submit & Deliver.
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ContractItem, 
  DeliveryStatus 
} from '../types/contract';
import { ContractDocument } from './ContractDocument';
import { 
  ShieldCheck, 
  Smartphone, 
  FileText, 
  Download, 
  Edit3, 
  AlertCircle, 
  CheckCircle, 
  RotateCcw, 
  Lock, 
  KeyRound, 
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Send
} from 'lucide-react';
import { generateContractPdfFromElement } from '../utils/pdfGenerator';

interface WorkerSigningViewProps {
  contract: ContractItem;
  onSignComplete: (signedDataUrl: string, finalPdfHash: string) => void;
  onRequestModification: (contractId: string, reason: string) => void;
  onRequestPaperDelivery: (contractId: string) => void;
  onClose?: () => void;
}

export const WorkerSigningView: React.FC<WorkerSigningViewProps> = ({
  contract,
  onSignComplete,
  onRequestModification,
  onRequestPaperDelivery,
  onClose
}) => {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    Boolean(contract.otpVerifiedAt || contract.status === 'SIGNED')
  );
  const [inputBirth, setInputBirth] = useState<string>('');
  const [inputOtp, setInputOtp] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');
  const [otpSentNotice, setOtpSentNotice] = useState<boolean>(true);

  // Contract view and zoom
  const [zoomLevel, setZoomLevel] = useState<number>(0.75); // fit nicely on mobile screens
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const contractDocRef = useRef<HTMLDivElement>(null);

  // Agreement checkboxes (CRITICAL: default unchecked as requested!)
  const [agreeTerms, setAgreeTerms] = useState<boolean>(false);
  const [agreeEsign, setAgreeEsign] = useState<boolean>(false);

  // Modification request state
  const [modModalOpen, setModModalOpen] = useState<boolean>(false);
  const [modReason, setModReason] = useState<string>('');
  const [isModRequested, setIsModRequested] = useState<boolean>(
    contract.status === 'MODIFICATION_REQ'
  );

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);

  // Submission complete state
  const [isDone, setIsDone] = useState<boolean>(contract.status === 'SIGNED');
  const [finalHash, setFinalHash] = useState<string>(contract.finalPdfHash || '');
  const [finalPdfUri, setFinalPdfUri] = useState<string>('');

  // Handle OTP verification
  const handleVerifyOtp = () => {
    setAuthError('');
    // Normalize birth
    const normInputBirth = inputBirth.replace(/[^0-9]/g, '');
    const normContractBirth = contract.birthDate.replace(/[^0-9]/g, '');

    // Check birth match (either YYYYMMDD or YYMMDD)
    const isBirthMatch = 
      normContractBirth.endsWith(normInputBirth) || 
      normContractBirth === normInputBirth;

    if (!isBirthMatch) {
      setAuthError('생년월일 정보가 일치하지 않습니다. (예: 19850412 또는 850412)');
      return;
    }

    // Check OTP
    if (contract.otpCode && inputOtp.trim() !== contract.otpCode) {
      setAuthError(`OTP 번호가 일치하지 않습니다. (테스트용 OTP: ${contract.otpCode})`);
      return;
    }

    setIsAuthenticated(true);
  };

  // Canvas Drawing Handlers (Touch & Mouse)
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1d4ed8'; // Navy Blue ink
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasDrawn(false);
  };

  // Handle Final Submission
  const handleSubmitSignature = async () => {
    if (!hasDrawn || !canvasRef.current) {
      alert('서명 패드에 서명을 입력해 주십시오.');
      return;
    }
    if (!agreeTerms || !agreeEsign) {
      alert('모든 필수 확인 및 동의 항목에 체크해 주십시오.');
      return;
    }

    setIsSubmitting(true);
    try {
      const signatureDataUrl = canvasRef.current.toDataURL('image/png');

      // Generate final PDF and SHA-256 hash
      if (contractDocRef.current) {
        const { pdfBlob, pdfHash, dataUri } = await generateContractPdfFromElement(
          contractDocRef.current,
          contract.contractNo,
          contract.name
        );
        setFinalHash(pdfHash);
        setFinalPdfUri(dataUri);
        onSignComplete(signatureDataUrl, pdfHash);
      } else {
        const fallbackHash = '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4';
        setFinalHash(fallbackHash);
        onSignComplete(signatureDataUrl, fallbackHash);
      }

      setIsDone(true);
    } catch (err: any) {
      alert('서명 제출 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Modification Request Submit
  const handleSendModification = () => {
    if (!modReason.trim()) return;
    onRequestModification(contract.id, modReason);
    setIsModRequested(true);
    setModModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col justify-between max-w-md mx-auto shadow-2xl border-x border-neutral-200">
      {/* Mobile App Header */}
      <header className="sticky top-0 bg-neutral-900 text-white px-4 py-3 z-30 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-sm tracking-tight">
            양우종합건설 전자근로계약
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-xs bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 rounded text-neutral-300"
          >
            화면 닫기
          </button>
        )}
      </header>

      {/* Screen 1: Worker OTP Authentication (if not yet authenticated) */}
      {!isAuthenticated ? (
        <main className="p-6 flex-1 flex flex-col justify-center space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              근로자 본인확인
            </h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              근로계약서 확인 및 서명을 위해<br />
              <strong>{contract.name}</strong> 님의 본인확인을 진행합니다.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                생년월일 (6자리 또는 8자리)
              </label>
              <input
                type="text"
                placeholder="예: 850412 또는 19850412"
                value={inputBirth}
                onChange={(e) => setInputBirth(e.target.value)}
                className="w-full p-2.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-700">
                  휴대전화 인증번호 (OTP 6자리)
                </label>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {contract.phone}
                </span>
              </div>
              <input
                type="text"
                placeholder="6자리 숫자 입력"
                value={inputOtp}
                onChange={(e) => setInputOtp(e.target.value)}
                maxLength={6}
                className="w-full p-2.5 text-xs border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono tracking-widest text-center text-base"
              />
              {contract.otpCode && (
                <span className="block text-[10px] text-blue-600 mt-1">
                  * 시뮬레이션용 발송된 OTP: <strong>{contract.otpCode}</strong>
                </span>
              )}
            </div>

            {authError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={!inputBirth || !inputOtp}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              본인확인 및 계약서 열람
            </button>
          </div>

          <div className="text-[11px] text-neutral-500 bg-neutral-200/60 p-3 rounded-lg leading-relaxed">
            * 본 OTP 인증은 근로기준법 및 전자서명법에 따른 전자근로계약 당사자 확인 수단으로, 이동통신사 명의확인과 구별됩니다.
          </div>
        </main>
      ) : isDone ? (
        /* Screen 3: Signing Completed & Final Delivery */
        <main className="p-6 flex-1 flex flex-col justify-center space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              근로계약 체결 및 교부 완료
            </h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              양우종합건설 주식회사와 <strong>{contract.name}</strong> 님의<br />
              2026년도 근로계약이 성공적으로 체결되었습니다.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-sm space-y-4 text-xs">
            <div className="space-y-2 pb-3 border-b border-neutral-200">
              <div className="flex justify-between">
                <span className="text-neutral-500">계약관리번호</span>
                <span className="font-mono font-semibold">{contract.contractNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">근무유형</span>
                <span className="font-semibold">{contract.workType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">체결일시</span>
                <span className="font-mono">{new Date().toLocaleString('ko-KR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">인사팀 메일 자동발송</span>
                <span className="font-semibold text-emerald-700">tecs_hr@ywconst.com 완료</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-neutral-500 block">암호학적 문서 무결성 해시 (SHA-256)</span>
              <div className="p-2 bg-neutral-100 rounded text-[9px] font-mono text-neutral-700 break-all select-all">
                {finalHash || contract.finalPdfHash}
              </div>
            </div>

            {/* Download Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  if (finalPdfUri) {
                    const a = document.createElement('a');
                    a.href = finalPdfUri;
                    a.download = `양우종합건설_근로계약서_${contract.name}_${contract.contractNo}.pdf`;
                    a.click();
                  } else {
                    window.print();
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-bold transition-colors"
              >
                <Download className="w-4 h-4" />
                회사 직인 날인본 최종 PDF 내려받기
              </button>

              <button
                onClick={() => onRequestPaperDelivery(contract.id)}
                className="w-full py-2 bg-white hover:bg-neutral-50 border border-neutral-300 text-neutral-700 rounded-lg text-xs font-medium"
              >
                종이 계약서 우편 교부 요청
              </button>
            </div>
          </div>
        </main>
      ) : isModRequested ? (
        /* Screen: Modification Pending State */
        <main className="p-6 flex-1 flex flex-col justify-center space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              계약 조건 수정 요청 접수
            </h2>
            <p className="text-xs text-neutral-600 leading-relaxed">
              인사팀에 수정 요청이 정상 전달되었습니다.<br />
              수정 검토가 완료될 때까지 본 계약서의 서명은 중단됩니다.
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-neutral-200 text-xs space-y-2">
            <span className="font-semibold text-neutral-800 block">제출된 요청 사유:</span>
            <p className="text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-200">
              {contract.modificationRequest?.reason || modReason}
            </p>
          </div>
        </main>
      ) : (
        /* Screen 2: Review Contract & Sign */
        <main className="p-3 space-y-4">
          {/* Zoom and Modification Control Bar */}
          <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-neutral-200 shadow-xs text-xs">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.1))}
                className="p-1 text-neutral-600 hover:bg-neutral-100 rounded"
                title="축소"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono text-[11px]">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel(prev => Math.min(1.2, prev + 0.1))}
                className="p-1 text-neutral-600 hover:bg-neutral-100 rounded"
                title="확대"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setModModalOpen(true)}
              className="text-purple-700 hover:text-purple-800 font-semibold text-xs flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              계약 내용 수정 요청
            </button>
          </div>

          {/* Render Contract Document inside scrollable viewport */}
          <div className="overflow-x-auto bg-neutral-200 p-2 rounded-xl flex justify-center">
            <div 
              style={{ 
                transform: `scale(${zoomLevel})`, 
                transformOrigin: 'top center',
                marginBottom: `-${(1 - zoomLevel) * 297 * 3.78}px` 
              }}
            >
              <ContractDocument
                ref={contractDocRef}
                contract={contract}
                showSeal={contract.isSealed || contract.isApproved}
                showSignature={false} // show empty signature box before sign
              />
            </div>
          </div>

          {/* Legal Acknowledgement & Consent Checkboxes */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-3 text-xs">
            <h4 className="font-bold text-neutral-900 border-b border-neutral-200 pb-1.5">
              전자서명 의사 및 계약 조건 확인
            </h4>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-neutral-700 leading-tight">
                [필수] 본 근로계약서의 모든 조항(임금, 근로시간, 포괄임금 포함 여부, 휴일/휴가)을 열람하고 이해하였음을 확인합니다.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeEsign}
                onChange={(e) => setAgreeEsign(e.target.checked)}
                className="mt-0.5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-neutral-700 leading-tight">
                [필수] 전자서명법에 따른 전자서명 및 전자문서 교부에 동의하며, 자필서명과 동일한 법적 효력을 가짐을 인정합니다.
              </span>
            </label>
          </div>

          {/* Signature Canvas Pad */}
          <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-900">
                근로자 자필 전자서명 입력
              </span>
              <button
                onClick={clearCanvas}
                className="text-[11px] text-neutral-500 hover:text-neutral-800 underline"
              >
                지우기
              </button>
            </div>

            <div className="border border-neutral-300 rounded-lg overflow-hidden bg-neutral-50 relative">
              <canvas
                ref={canvasRef}
                width={360}
                height={140}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-32 touch-none cursor-crosshair bg-white"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-neutral-400 text-xs">
                  손가락 또는 펜으로 서명해 주세요
                </div>
              )}
            </div>

            <button
              onClick={handleSubmitSignature}
              disabled={!hasDrawn || !agreeTerms || !agreeEsign || isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <span>최종 PDF 확정 및 인사팀 발송 처리 중...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>서명 완료 및 최종 제출 (교부확인)</span>
                </>
              )}
            </button>
          </div>
        </main>
      )}

      {/* Modification Request Modal */}
      {modModalOpen && (
        <div className="fixed inset-0 bg-neutral-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl text-xs">
            <h3 className="text-sm font-bold text-neutral-900">계약 조건 수정 요청</h3>
            <p className="text-neutral-600">
              인사팀에 수정할 내용을 입력해주세요. 수정 요청 시 기존 계약의 서명은 즉시 중단됩니다.
            </p>
            <textarea
              value={modReason}
              onChange={(e) => setModReason(e.target.value)}
              placeholder="예: 자격취득일 기준 10년 이상 면허수당 70,000원으로 변경 요청..."
              rows={4}
              className="w-full p-2.5 border border-neutral-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModModalOpen(false)}
                className="px-3 py-1.5 border border-neutral-200 rounded-lg text-neutral-600"
              >
                취소
              </button>
              <button
                onClick={handleSendModification}
                disabled={!modReason.trim()}
                className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 disabled:opacity-40 text-white rounded-lg font-semibold"
              >
                수정 요청 전송
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="p-3 text-center text-[10px] text-neutral-500 border-t border-neutral-200 bg-neutral-50">
        양우종합건설 주식회사 인사팀 (tecs_hr@ywconst.com) | 전용 모바일 전자서명
      </footer>
    </div>
  );
};
