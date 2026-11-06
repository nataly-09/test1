import React from 'react';
import { Volume2, VolumeX, MousePointer, Camera, HelpCircle } from 'lucide-react';
import { InputMode } from '../types';

interface NavbarProps {
  score: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  inputMode: InputMode;
  onToggleInputMode: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHelp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  score,
  currentQuestionIndex,
  totalQuestions,
  inputMode,
  onToggleInputMode,
  soundEnabled,
  onToggleSound,
  onOpenHelp,
}) => {
  return (
    <header className="w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-sm">
            Q
          </div>
          <span className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
            모션 사이언스 퀴즈
          </span>
        </div>

        {/* Zone 2: Informational links & Progress indicators */}
        <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 tabular-nums">
            <span className="text-slate-400">진행도:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {currentQuestionIndex + 1} / {totalQuestions}
            </span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 tabular-nums">
            <span className="text-slate-400">현재 점수:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
              {score}점
            </span>
          </div>

          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors whitespace-nowrap cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>손가락 제스처 가이드</span>
          </button>
        </div>

        {/* Zone 3: Interactive Controls (Sound + Mode Switcher) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title={soundEnabled ? '효과음 끄기' : '효과음 켜기'}
            aria-label="효과음 토글"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>

          {/* Mode Toggle Button */}
          <button
            onClick={onToggleInputMode}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              inputMode === 'gesture'
                ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-500'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
            title="손가락 인식 / 마우스 클릭 모드 전환"
          >
            {inputMode === 'gesture' ? (
              <>
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">카메라 모드</span>
                <span className="sm:hidden">카메라</span>
              </>
            ) : (
              <>
                <MousePointer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">클릭 모드</span>
                <span className="sm:hidden">클릭</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
