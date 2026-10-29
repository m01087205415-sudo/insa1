/**
 * Excel Batch Upload & Validation Modal
 * Parses .xlsx files with strict string preservation, row error tables, and calculation diff review.
 */

import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  FileDown, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { ContractItem } from '../types/contract';
import { 
  generateExcelTemplate, 
  parseAndValidateExcel, 
  exportErrorsToExcel, 
  ValidationErrorItem 
} from '../utils/excelTemplate';

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (importedContracts: ContractItem[]) => void;
}

export const ExcelUploadModal: React.FC<ExcelUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedContracts, setParsedContracts] = useState<ContractItem[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrorItem[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [hasValidated, setHasValidated] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle template download
  const handleDownloadTemplate = () => {
    const buffer = generateExcelTemplate();
    const blob = new Blob([buffer as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '양우종합건설_표준근로계약_일괄업로드_템플릿_v2026.04.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle errors download
  const handleDownloadErrors = () => {
    if (validationErrors.length === 0) return;
    const buffer = exportErrorsToExcel(validationErrors);
    const blob = new Blob([buffer as any], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `계약업로드_오류목록_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle file select and parsing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsProcessing(true);
    setHasValidated(false);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const result = parseAndValidateExcel(buffer);
      setParsedContracts(result.contracts);
      setValidationErrors(result.errors);
      setValidationWarnings(result.warnings);
      setHasValidated(true);
    } catch (err: any) {
      setValidationErrors([
        {
          rowNumber: 1,
          contractNo: '-',
          empNo: '-',
          name: '-',
          columnName: '파일형식',
          errorReason: `엑셀 파싱 오류: ${err.message || '올바른 .xlsx 파일 형식이 아닙니다.'}`,
          fixGuide: '제공된 템플릿 양식을 사용하여 다시 저장 후 업로드하세요.'
        }
      ]);
      setHasValidated(true);
    } finally {
      setIsProcessing(false);
    }
  };

  // Confirm import
  const handleConfirmImport = () => {
    if (parsedContracts.length > 0 && validationErrors.length === 0) {
      onUploadSuccess(parsedContracts);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-5 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">
                인사팀 엑셀 일괄 업로드 및 10원 단위 산식 검증
              </h3>
              <p className="text-xs text-neutral-500">
                엑셀 데이터를 행별로 분석하여 사번·휴대전화 앞자리 0 보존, 10원 단위 반올림 및 1페이지 규격을 사전 검증합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Download & Upload Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 1. Template Download Card */}
          <div className="border border-neutral-200 rounded-xl p-4 bg-neutral-50 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-900 block mb-1">
                공식 엑셀 서식 템플릿 (.xlsx)
              </span>
              <p className="text-[11px] text-neutral-600 leading-relaxed">
                근로계약입력 시트와 직급별 성과급·자격별 면허수당 코드표가 포함된 공식 템플릿입니다. 사번과 전화번호는 텍스트 서식으로 유지됩니다.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="mt-3 flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-neutral-100 border border-neutral-300 rounded-lg text-xs font-semibold text-neutral-800 transition-colors shadow-2xs"
            >
              <FileDown className="w-4 h-4 text-neutral-600" />
              표준 템플릿(.xlsx) 내려받기
            </button>
          </div>

          {/* 2. Upload Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-300 hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors bg-white hover:bg-blue-50/20 text-center"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <Upload className="w-6 h-6 text-neutral-400 mb-1.5" />
            <span className="text-xs font-semibold text-neutral-800">
              {file ? file.name : '작성된 엑셀 파일 선택 또는 드래그'}
            </span>
            <span className="text-[10px] text-neutral-500 mt-0.5">
              .xlsx 형식 지원 (매크로 및 임의 수식 실행 제외)
            </span>
          </div>
        </div>

        {/* Validation Result Section */}
        {hasValidated && (
          <div className="space-y-4 border-t border-neutral-200 pt-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
                <span className="text-neutral-500 block">총 분석 행수</span>
                <span className="text-lg font-bold text-neutral-900 font-mono">
                  {parsedContracts.length}건
                </span>
              </div>
              <div className={`p-3 rounded-lg border ${
                validationErrors.length === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <span className="block text-[11px]">검증 오류 (발송 차단)</span>
                <span className="text-lg font-bold font-mono">
                  {validationErrors.length}건
                </span>
              </div>
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-800">
                <span className="block text-[11px]">확인 필요 경고</span>
                <span className="text-lg font-bold font-mono">
                  {validationWarnings.length}건
                </span>
              </div>
            </div>

            {/* Warnings list */}
            {validationWarnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1 text-amber-800">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  주의 및 확인 경고 ({validationWarnings.length}건)
                </div>
                <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                  {validationWarnings.map((warn, i) => (
                    <li key={i}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Table if any */}
            {validationErrors.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                    오류 발생 행 목록 (수정 후 재업로드 필요)
                  </span>
                  <button
                    onClick={handleDownloadErrors}
                    className="flex items-center gap-1 text-xs text-neutral-700 hover:text-neutral-900 font-medium underline"
                  >
                    <Download className="w-3.5 h-3.5" />
                    오류 목록 엑셀 다운로드
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto border border-neutral-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-200 text-neutral-600">
                      <tr>
                        <th className="p-2 w-16 text-center">행번호</th>
                        <th className="p-2">계약번호 / 성명</th>
                        <th className="p-2">오류항목</th>
                        <th className="p-2">오류 사유</th>
                        <th className="p-2">조치 가이드</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {validationErrors.map((err, i) => (
                        <tr key={i} className="hover:bg-red-50/40">
                          <td className="p-2 text-center font-mono font-semibold text-red-700">
                            {err.rowNumber}행
                          </td>
                          <td className="p-2">
                            <span className="font-semibold block">{err.name}</span>
                            <span className="text-[10px] text-neutral-500 font-mono">{err.contractNo}</span>
                          </td>
                          <td className="p-2 font-medium text-neutral-800">{err.columnName}</td>
                          <td className="p-2 text-red-700">{err.errorReason}</td>
                          <td className="p-2 text-neutral-600 text-[11px]">{err.fixGuide}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Success Preview Table */
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  모든 데이터 행이 10원 단위 반올림 및 필수 규격 검증을 완벽히 통과했습니다!
                </div>

                <div className="max-h-56 overflow-y-auto border border-neutral-200 rounded-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-neutral-50 sticky top-0 border-b border-neutral-200 text-neutral-600">
                      <tr>
                        <th className="p-2">계약번호 / 사번</th>
                        <th className="p-2">성명 / 유형</th>
                        <th className="p-2 text-right">월임금</th>
                        <th className="p-2 text-right">계산된 기준급</th>
                        <th className="p-2 text-center">10원 일치여부</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {parsedContracts.map((c, i) => (
                        <tr key={i} className="hover:bg-neutral-50">
                          <td className="p-2 font-mono font-semibold">
                            {c.contractNo} <span className="text-neutral-500 font-normal">({c.empNo})</span>
                          </td>
                          <td className="p-2">
                            <span className="font-semibold block">{c.name}</span>
                            <span className="text-[10px] text-neutral-500">{c.workType}</span>
                          </td>
                          <td className="p-2 text-right font-mono tabular-nums">
                            {c.wage.monthlySalary.toLocaleString()}원
                          </td>
                          <td className="p-2 text-right font-mono tabular-nums font-semibold text-blue-700">
                            {c.wage.basePay.toLocaleString()}원
                          </td>
                          <td className="p-2 text-center text-emerald-700 font-semibold">
                            검증통과 (100%)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-xs">
          <span className="text-[11px] text-neutral-500">
            * 엑셀 입력값과 시스템 계산값이 다를 경우 자동 덮어쓰지 않고 명시적인 결재를 거치게 됩니다.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 rounded-lg text-neutral-700 font-medium"
            >
              닫기
            </button>
            <button
              onClick={handleConfirmImport}
              disabled={parsedContracts.length === 0 || validationErrors.length > 0}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors"
            >
              <span>검증 완료 {parsedContracts.length}건 등록</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
