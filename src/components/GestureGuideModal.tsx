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
              <span><strong>1.5초 유지 확정 & 즉시 리셋:</strong> 손가락 개수를 1.5초간 유지하면 답안이 자동 확정되며, 유지 도중 손을 내리거나 화면을 벗어나면 타이머가 즉시 0초로 초기화됩니다.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>회전 방향 & 엄지 특화 판정:</strong> 손이 좌우로 기울어져 있어도 손 축과 엄지 벡터를 자동 보정하며, 프레임 안정화 필터로 떨림 없이 정확하게 인식합니다.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>다음 문제 모션 이동:</strong> 정답 확인 후 책장을 넘기듯 손을 옆으로 휙 넘기거나(스와이프 💨), 엄지 척(👍)을 하면 다음 문제로 즉각 넘어갑니다.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>제출 후 중복 방지:</strong> 문제를 푼 직후에는 추가 선택이 잠기므로 안심하고 손을 내리실 수 있습니다.</span>
            </div>
            <div className="flex items-start gap-2">
              <MousePointer className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
              <span><strong>마우스 클릭 대체:</strong> 보기를 직접 마우스나 터치로 클릭하여 풀 수도 있습니다.</span>
            </div>
            <div className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>브라우저 온디바이스 처리:</strong> 웹캠 영상은 외부 서버로 전송되지 않고 브라우저 내부에서만 실시간 분석됩니다.</span>
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
