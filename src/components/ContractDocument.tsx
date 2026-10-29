/**
 * Precision A4 1-Page Contract Component for YW Construction (양우종합건설)
 * Faithfully renders the scanned PDF structure (Pages 3-7) into an exact 210mm x 297mm layout.
 */

import React, { forwardRef } from 'react';
import { ContractItem } from '../types/contract';
import { formatKoreanWonText } from '../utils/wageCalculator';
import { getContractPeriodClause } from '../utils/contractRules';

interface ContractDocumentProps {
  contract: ContractItem;
  showSeal?: boolean;
  showSignature?: boolean;
  watermarkText?: string;
  className?: string;
}

export const ContractDocument = forwardRef<HTMLDivElement, ContractDocumentProps>(
  ({ contract, showSeal = true, showSignature = true, watermarkText, className = '' }, ref) => {
    const isPjt = contract.workType === '현장PJT';
    const isHq = contract.workType === '본사임원' || contract.workType === '본사직원';
    const isExec = contract.workType === '본사임원' || contract.workType === '현장임원';

    const periodClause = getContractPeriodClause({
      workType: contract.workType,
      startDate: contract.contractStartDate,
      endDate: contract.contractEndDate,
      contractDateStr: contract.contractDate
    });

    const isSealed = showSeal && (contract.isSealed || contract.isApproved);
    const hasSignature = showSignature && Boolean(contract.signatureDataUrl || contract.workerSignedAt);

    // Format Korean date string (e.g. 2026년 4월 1일)
    const [year, month, day] = contract.contractDate.split('-').map(s => parseInt(s, 10));

    return (
      <div
        ref={ref}
        id={`contract-doc-${contract.contractNo}`}
        className={`a4-page relative mx-auto bg-white text-neutral-900 border border-neutral-300 shadow-lg print:border-none print:shadow-none select-none text-[9.5px] leading-[1.32] p-[10mm] flex flex-col justify-between ${className}`}
        style={{
          width: '210mm',
          height: '297mm',
          boxSizing: 'border-box'
        }}
      >
        {/* Optional Watermark */}
        {watermarkText && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 rotate-[-25deg] z-0">
            <span className="text-6xl font-bold border-4 border-red-600 px-8 py-3 text-red-600 tracking-wider">
              {watermarkText}
            </span>
          </div>
        )}

        {/* Top Header Section */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-1 pb-1 border-b border-neutral-400">
            <span className="text-[8px] text-neutral-500 font-mono tracking-tight">
              계약관리번호: {contract.contractNo} (v{contract.version}.0)
            </span>
            <span className="text-[8px] text-neutral-600 font-medium">
              양우종합건설 주식회사 표준근로계약서 [{contract.workType}]
            </span>
          </div>

          <div className="text-center relative mb-2">
            <h1 className="text-[20px] font-bold tracking-[0.4em] text-neutral-950 inline-block pl-[0.4em]">
              근 로 계 약 서
            </h1>
            <span className="absolute right-0 top-1 text-[9px] font-semibold text-neutral-700">
              {contract.workType === '본사임원' && '<본사 임원용>'}
              {contract.workType === '본사직원' && '<본사 직원용>'}
              {contract.workType === '현장임원' && '<현장 임원용>'}
              {contract.workType === '현장직원' && '<현장 직원용>'}
              {contract.workType === '현장PJT' && '<현장 PJT용>'}
            </span>
          </div>

          {/* 1. 근로자(을) 인적사항 */}
          <section className="mb-2">
            <h2 className="text-[10.5px] font-bold text-neutral-900 mb-0.5">
              1. 근로자(을) 인적사항
            </h2>
            <table className="w-full border-collapse border border-neutral-900 text-center text-[9px]">
              <tbody>
                <tr>
                  <th className="border border-neutral-900 bg-neutral-100 font-bold w-[16%] py-0.5">성 명</th>
                  <td className="border border-neutral-900 w-[34%] py-0.5 text-neutral-950 font-semibold">{contract.name}</td>
                  <th className="border border-neutral-900 bg-neutral-100 font-bold w-[16%] py-0.5">생년월일</th>
                  <td className="border border-neutral-900 w-[34%] py-0.5 font-mono">{contract.birthDate}</td>
                </tr>
                <tr>
                  <th className="border border-neutral-900 bg-neutral-100 font-bold py-0.5">근무장소</th>
                  <td className="border border-neutral-900 py-0.5 text-left px-2 truncate">
                    {contract.workLocation}
                  </td>
                  <th className="border border-neutral-900 bg-neutral-100 font-bold py-0.5">직 급</th>
                  <td className="border border-neutral-900 py-0.5 font-semibold">{contract.jobTitle}</td>
                </tr>
                <tr>
                  <th className="border border-neutral-900 bg-neutral-100 font-bold py-0.5">직책/직무</th>
                  <td className="border border-neutral-900 py-0.5">{contract.duty || '-'}</td>
                  <th className="border border-neutral-900 bg-neutral-100 font-bold py-0.5">주 소</th>
                  <td className="border border-neutral-900 py-0.5 text-left px-2 text-[8.5px] truncate">
                    {contract.address}
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* 2. 근로계약기간 */}
          <section className="mb-2">
            <h2 className="text-[10.5px] font-bold text-neutral-900 mb-0.5">
              2. 근로계약기간
            </h2>
            <div className="pl-1 space-y-0.5 text-neutral-800 text-[9px]">
              <p>{periodClause.clauseA}</p>
              {periodClause.clauseB && <p className="leading-tight">{periodClause.clauseB}</p>}
              {contract.probationEnabled && periodClause.clauseProbation && (
                <p>{periodClause.clauseProbation}</p>
              )}
            </div>
          </section>

          {/* 3. 임 금 */}
          <section className="mb-2">
            <div className="flex items-center justify-between mb-0.5">
              <h2 className="text-[10.5px] font-bold text-neutral-900">3. 임 금</h2>
              <span className="text-[8px] text-neutral-600">단위: 원</span>
            </div>

            {/* Salary Header Strip */}
            {!isPjt ? (
              <div className="grid grid-cols-12 border border-neutral-900 border-b-0 text-[9px] bg-neutral-50">
                <div className="col-span-2 border-r border-neutral-900 font-bold text-center py-0.5 bg-neutral-100">
                  연봉총액
                </div>
                <div className="col-span-3 border-r border-neutral-900 text-right px-2 py-0.5 font-bold tabular-nums">
                  금 {contract.wage.annualSalary.toLocaleString()} 원
                </div>
                <div className="col-span-3 border-r border-neutral-900 text-center py-0.5 font-semibold text-[8.5px]">
                  [{formatKoreanWonText(contract.wage.annualSalary)}]
                </div>
                <div className="col-span-2 border-r border-neutral-900 font-bold text-center py-0.5 bg-neutral-100">
                  연봉 계약기간
                </div>
                <div className="col-span-2 text-center py-0.5 font-mono text-[8.5px]">
                  {contract.annualSalaryStartDate} ~ {contract.annualSalaryEndDate}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-12 border border-neutral-900 border-b-0 text-[9px] bg-neutral-50">
                <div className="col-span-3 border-r border-neutral-900 font-bold text-center py-0.5 bg-neutral-100">
                  월임금(지급기준)
                </div>
                <div className="col-span-4 border-r border-neutral-900 text-right px-2 py-0.5 font-bold tabular-nums">
                  금 {contract.wage.monthlySalary.toLocaleString()} 원
                </div>
                <div className="col-span-5 text-center py-0.5 font-semibold text-[8.5px]">
                  [{formatKoreanWonText(contract.wage.monthlySalary)}] (PJT 공종별 월급제)
                </div>
              </div>
            )}

            {/* Allowance Table */}
            <table className="w-full border-collapse border border-neutral-900 text-[8.5px]">
              <thead>
                <tr className="bg-neutral-100 text-center font-bold">
                  <th className="border border-neutral-900 w-[18%] py-0.5">구성항목</th>
                  <th className="border border-neutral-900 w-[50%] py-0.5">산정내역</th>
                  <th className="border border-neutral-900 w-[12%] py-0.5">시 간</th>
                  <th className="border border-neutral-900 w-[20%] py-0.5">월임금</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-neutral-900 text-center font-medium py-0.5">기 준 급</td>
                  <td className="border border-neutral-900 px-2 py-0.5 text-center">
                    (1주 40시간 * 4.345주) + (주휴 8시간 * 4.345주)
                  </td>
                  <td className="border border-neutral-900 text-center tabular-nums">209</td>
                  <td className="border border-neutral-900 text-right px-2 tabular-nums font-semibold">
                    {contract.wage.basePay.toLocaleString()}
                  </td>
                </tr>

                {contract.wage.performanceBonus > 0 && (
                  <tr>
                    <td className="border border-neutral-900 text-center font-medium py-0.5">성 과 급</td>
                    <td className="border border-neutral-900 px-2 py-0.5 text-center">직급별 기준 성과급 ({contract.jobTitle})</td>
                    <td className="border border-neutral-900 text-center">-</td>
                    <td className="border border-neutral-900 text-right px-2 tabular-nums">
                      {contract.wage.performanceBonus.toLocaleString()}
                    </td>
                  </tr>
                )}

                {contract.wage.licenseAllowance > 0 && (
                  <tr>
                    <td className="border border-neutral-900 text-center font-medium py-0.5">면허수당</td>
                    <td className="border border-neutral-900 px-2 py-0.5 text-center">
                      보유 기술자격 인정 수당 ({contract.license?.name || '자격증'} {contract.license?.grade})
                    </td>
                    <td className="border border-neutral-900 text-center">-</td>
                    <td className="border border-neutral-900 text-right px-2 tabular-nums">
                      {contract.wage.licenseAllowance.toLocaleString()}
                    </td>
                  </tr>
                )}

                {contract.wage.siteAllowance > 0 && (
                  <tr>
                    <td className="border border-neutral-900 text-center font-medium py-0.5">현장수당</td>
                    <td className="border border-neutral-900 px-2 py-0.5 text-center">건설공사 현장 근무 수당</td>
                    <td className="border border-neutral-900 text-center">-</td>
                    <td className="border border-neutral-900 text-right px-2 tabular-nums">
                      {contract.wage.siteAllowance.toLocaleString()}
                    </td>
                  </tr>
                )}

                {contract.wage.positionAllowance > 0 && (
                  <tr>
                    <td className="border border-neutral-900 text-center font-medium py-0.5">직책수당</td>
                    <td className="border border-neutral-900 px-2 py-0.5 text-center">현장 책임자 직무수당 ({contract.duty})</td>
                    <td className="border border-neutral-900 text-center">-</td>
                    <td className="border border-neutral-900 text-right px-2 tabular-nums">
                      {contract.wage.positionAllowance.toLocaleString()}
                    </td>
                  </tr>
                )}

                <tr>
                  <td className="border border-neutral-900 text-center font-medium py-0.5">고정OT수당</td>
                  <td className="border border-neutral-900 px-2 py-0.5 text-center">
                    1주 7.5시간 * 4.345주 * 1.5배 (10원 단위 반올림)
                  </td>
                  <td className="border border-neutral-900 text-center tabular-nums">48</td>
                  <td className="border border-neutral-900 text-right px-2 tabular-nums">
                    {contract.wage.fixedOtPay.toLocaleString()}
                  </td>
                </tr>

                <tr>
                  <td className="border border-neutral-900 text-center font-medium py-0.5">고정휴일수당</td>
                  <td className="border border-neutral-900 px-2 py-0.5 text-center">
                    (1주 4시간 * 4.345주 * 1.5배) + (1주 0.5시간 * 4.345주 * 2배)
                  </td>
                  <td className="border border-neutral-900 text-center tabular-nums">30</td>
                  <td className="border border-neutral-900 text-right px-2 tabular-nums">
                    {contract.wage.fixedHolidayPay.toLocaleString()}
                  </td>
                </tr>

                <tr>
                  <td className="border border-neutral-900 text-center font-medium py-0.5">연차수당</td>
                  <td className="border border-neutral-900 px-2 py-0.5 text-center">
                    연 12일 * 8시간(1일) / 12개월
                  </td>
                  <td className="border border-neutral-900 text-center tabular-nums">8</td>
                  <td className="border border-neutral-900 text-right px-2 tabular-nums">
                    {contract.wage.annualLeavePay.toLocaleString()}
                  </td>
                </tr>

                {contract.wage.mealAllowance > 0 && (
                  <tr>
                    <td className="border border-neutral-900 text-center font-medium py-0.5">식 대</td>
                    <td className="border border-neutral-900 px-2 py-0.5 text-center">200,000원 / 월 (비과세 식대)</td>
                    <td className="border border-neutral-900 text-center">-</td>
                    <td className="border border-neutral-900 text-right px-2 tabular-nums">
                      {contract.wage.mealAllowance.toLocaleString()}
                    </td>
                  </tr>
                )}

                <tr className="bg-neutral-100 font-bold">
                  <td className="border border-neutral-900 text-center py-0.5">계</td>
                  <td className="border border-neutral-900 px-2 py-0.5 text-center text-[8px] text-neutral-600">
                    산정기준시간 295시간 기준
                  </td>
                  <td className="border border-neutral-900 text-center tabular-nums">295</td>
                  <td className="border border-neutral-900 text-right px-2 tabular-nums text-neutral-950 font-bold">
                    {contract.wage.monthlySalary.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Wage subclauses */}
            <div className="pl-1 mt-1 space-y-0.5 text-[8.5px] text-neutral-800">
              {!isPjt && (
                <p>
                  가. "을"에게 지급되는 월 임금은 연봉제에 따라 산정된 것으로, 연봉계약기간 만료시 별도의 연봉 협상이 없을 경우 본 계약내용으로 갱신한다.
                </p>
              )}
              <div className="flex items-center justify-between">
                <p>
                  나. 월임금에 법정제수당(고정OT수당, 고정휴일수당, 연차수당)을 포함하여 지급하는 포괄임금방식에 동의한다.
                </p>
                <span className="text-[8px] font-semibold text-neutral-700 whitespace-nowrap pl-2">
                  (을 서명확인)
                </span>
              </div>
              <p>
                다. 임금은 전월 21일부터 당월 20일까지의 임금을 당월 25일에 지급하며, 임금 지급시 세금(4대보험 포함) 등을 공제한 후 근로자 명의로 신고된 계좌에 지급한다.
              </p>
              {!isHq && (
                <p>
                  라. '본사 근무시 현장직 직원들에 한하여 지급하는 현장수당은 지급되지 않는다'는 규정을 적용한다.
                </p>
              )}
            </div>
          </section>

          {/* 4. 근로조건 */}
          <section className="mb-2">
            <h2 className="text-[10.5px] font-bold text-neutral-900 mb-0.5">
              4. 근로조건
            </h2>
            <div className="pl-1 mb-1 text-[8.5px] space-y-0.5">
              <div className="flex items-center justify-between">
                <p>가. 시간외근로 동의: 업무의 특성상 1주 12시간 이내의 시간외근로(연장, 야간, 휴일근로)에 동의한다.</p>
                <span className="text-[8px] font-semibold text-neutral-700 whitespace-nowrap pl-2">(동의확인)</span>
              </div>
              <div className="flex items-center justify-between">
                <p>나. 업무상 필요한 경우 근로시간·휴게시간·장소 및 업무내용 변경에 동의한다.</p>
                <span className="text-[8px] font-semibold text-neutral-700 whitespace-nowrap pl-2">(동의확인)</span>
              </div>
            </div>

            <table className="w-full border-collapse border border-neutral-900 text-center text-[8.5px] mb-1">
              <thead>
                <tr className="bg-neutral-100 font-bold">
                  <th className="border border-neutral-900 w-[20%] py-0.5">근로일</th>
                  <th className="border border-neutral-900 w-[30%] py-0.5">근로시간</th>
                  <th className="border border-neutral-900 w-[50%] py-0.5">휴게시간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-neutral-900 py-0.5">{contract.schedule.workDays}</td>
                  <td className="border border-neutral-900 py-0.5 font-mono">{contract.schedule.workHours}</td>
                  <td className="border border-neutral-900 py-0.5 text-[8px] font-mono">{contract.schedule.restHours}</td>
                </tr>
              </tbody>
            </table>

            {/* Leave & Holiday Details */}
            <div className="border border-neutral-400 p-1 rounded-none text-[7.8px] leading-[1.25] text-neutral-700 space-y-0.5">
              <p>
                <strong className="text-neutral-900">[휴가]</strong> 1. 1년간 8할 이상 출근 시 15개 연차유급휴가 부여(3년 초과시 2년마다 1개 가산). 2. 1년 미만자는 1개월 개근시 1개 부여. 3. 연차는 3일 전 신청. 4. 미사용시 익월 급여지급시 연차수당으로 포괄역산 지급.
              </p>
              <p>
                <strong className="text-neutral-900">[휴일]</strong> 1. 주휴일: 매주 일요일(필요시 대체). 2. 토요일: 무급휴일. 3. 법정공휴일·대체공휴일·근로자의날 유급휴일 부여.
              </p>
            </div>
          </section>

          {/* 5~8 Articles Compact Grid */}
          <section className="mb-2 text-[8px] leading-[1.25] text-neutral-800 space-y-0.5 border-t border-neutral-300 pt-1">
            <p>
              <strong>5. 사직절차:</strong> "을"은 사직 시 30일 전 사표 제출 및 후임자 업무인수인계 완료 필수. 무단 퇴직으로 "갑"이 손해를 입은 경우 손해배상을 청구할 수 있다.
            </p>
            <p>
              <strong>6. 계약해지사유:</strong> 5일 이상 결근 또는 월 10일 이상 무단결근, 정신·육체적 직무수행 불가 판정, 안전수칙 불이행 및 고의·중과실 손실 유발, 사내 폭력 및 풍기문란, 무단 겸업 등 취업규칙 위반 시 해지.
            </p>
            <p>
              <strong>7. 비밀유지의무:</strong> 재직 중 취득한 영업비밀·공사기법 일체 누설 금지. 임금 및 계약조건 상호 비교·누설 금지(위반 시 징계).
            </p>
            <p>
              <strong>8. 기타근로조건:</strong> 본 계약에 명시되지 않은 사항은 근로기준법 및 "갑"의 취업규칙에 따른다.
            </p>
          </section>
        </div>

        {/* Bottom Closing & Signatures */}
        <div className="relative z-10 border-t border-neutral-900 pt-1.5 mt-auto">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[8.5px] text-neutral-800">
              본 근로계약은 2부를 작성하여 갑과 을이 각각 1부씩 보관하기로 한다.
              <br />
              <strong>"을"은 본 계약서 1부를 교부받았음을 확인함.</strong>
            </p>
            <div className="border border-neutral-900 px-3 py-1 text-center bg-neutral-50 text-[8.5px]">
              교부확인 란 <span className="font-bold text-neutral-950">({contract.name})</span>
            </div>
          </div>

          <div className="text-center font-bold text-[11px] mb-2 tracking-wider">
            {year}년 {month}월 {day}일
          </div>

          <div className="grid grid-cols-2 gap-4 text-[9.5px]">
            {/* 사용자 (갑) */}
            <div className="border border-neutral-300 p-2 bg-neutral-50 relative flex flex-col justify-between h-[52px]">
              <div>
                <span className="font-bold text-neutral-900">사용자 (갑) :</span>
                <span className="ml-1 font-semibold">양우종합건설 주식회사</span>
              </div>
              <div className="flex items-center justify-between">
                <span>대표이사 <strong className="ml-1 tracking-widest text-[10.5px]">고 예 림</strong></span>
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <span className="text-neutral-400 text-[9px]">(인)</span>
                  {/* Official Company Seal Overlay */}
                  {isSealed && (
                    <img
                      src="/seal_stamp.png"
                      alt="양우종합건설 대표이사 인감"
                      className="absolute inset-0 w-12 h-12 object-contain pointer-events-none drop-shadow-sm select-none"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 근로자 (을) */}
            <div className="border border-neutral-300 p-2 bg-neutral-50 relative flex flex-col justify-between h-[52px]">
              <div>
                <span className="font-bold text-neutral-900">근로자 (을) :</span>
                <span className="ml-1 text-[8px] text-neutral-600 font-mono">사번 {contract.empNo}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>성 명 <strong className="ml-1 tracking-widest text-[10.5px]">{contract.name}</strong></span>
                <div className="relative w-20 h-11 flex items-center justify-center border border-dashed border-neutral-300 bg-white">
                  {hasSignature && contract.signatureDataUrl ? (
                    <img
                      src={contract.signatureDataUrl}
                      alt="근로자 서명"
                      className="max-w-full max-h-full object-contain pointer-events-none"
                    />
                  ) : hasSignature ? (
                    <span className="text-blue-700 font-serif font-bold text-sm tracking-widest">
                      {contract.name} (서명)
                    </span>
                  ) : (
                    <span className="text-neutral-400 text-[8px]">(서명 란)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic hash and integrity footer */}
          <div className="mt-1 pt-0.5 border-t border-neutral-200 flex items-center justify-between text-[7px] text-neutral-500 font-mono">
            <span>인증문서 해시: {contract.finalPdfHash ? contract.finalPdfHash.slice(0, 32) + '...' : '체결 시 SHA-256 자동 부여'}</span>
            <span>보존 기산점: 체결완료일로부터 근로기준법 제42조 3년 법정 보존</span>
          </div>
        </div>
      </div>
    );
  }
);

ContractDocument.displayName = 'ContractDocument';
