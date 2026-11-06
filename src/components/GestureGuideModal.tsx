import React from 'react';
import { X, Hand, ShieldCheck, CheckCircle2, MousePointer } from 'lucide-react';

interface GestureGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GestureGuideModal: React.FC<GestureGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Hand className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              손가락 제스처 퀴즈 풀이 방법
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-4 text-xs md:text-sm text-slate-600 dark:text-slate-300">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">1번 선택</span>
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">검지 손가락 1개</p>
              <p className="text-[11px] text-slate-400 mt-0.5">손가락 1개를 펴세요</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">2번 선택</span>
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">검지 + 중지 (V자)</p>
              <p className="text-[11px] text-slate-400 mt-0.5">손가락 2개를 펴세요</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">3번 선택</span>
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">검지 + 중지 + 약지</p>
              <p className="text-[11px] text-slate-400 mt-0.5">손가락 3개를 펴세요</p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">4번 선택</span>
              <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">엄지 접고 4개 손가락</p>
              <p className="text-[11px] text-slate-400 mt-0.5">손가락 4개를 펴세요</p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>1.5초 유지 확정:</strong> 원하는 번호의 손가락 개수를 들고 1.5초간 유지하면 자동으로 해당 보기가 확정됩니다.</span>
            </div>
            <div className="flex items-start gap-2">
              <MousePointer className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <span><strong>마우스 클릭 대체:</strong> 카메라 인식이 불편하거나 조명이 어두우면 보기를 직접 클릭하여 언제든지 정답을 고를 수 있습니다.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>브라우저 온디바이스 처리:</strong> 웹캠 영상은 어떠한 외부 서버로도 전송되지 않으며, 사용자 PC/모바일 브라우저 내에서만 안전하게 실시간 계산됩니다.</span>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors cursor-pointer"
          >
            확인하고 문제 풀기
          </button>
        </div>
      </div>
    </div>
  );
};
