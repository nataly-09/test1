import React from 'react';
import { QuizQuestion, UserAnswerRecord } from '../types';
import { CheckCircle2, XCircle, ArrowRight, Lightbulb, Sparkles, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuizCardProps {
  question: QuizQuestion;
  currentIndex: number;
  totalQuestions: number;
  userAnswer: UserAnswerRecord | null;
  activeGestureChoice: 1 | 2 | 3 | 4 | null;
  gestureProgress: number; // 0 to 1
  onSelectOption: (optionNumber: 1 | 2 | 3 | 4, inputMethod: 'gesture' | 'click') => void;
  onNextQuestion: () => void;
  isLastQuestion: boolean;
}

const CATEGORY_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  물리: { text: 'text-sky-700 dark:text-sky-300', bg: 'bg-sky-50 dark:bg-sky-950/50', border: 'border-sky-200 dark:border-sky-800' },
  화학: { text: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-950/50', border: 'border-amber-200 dark:border-amber-800' },
  생물: { text: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-950/50', border: 'border-emerald-200 dark:border-emerald-800' },
  지구과학: { text: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-50 dark:bg-indigo-950/50', border: 'border-indigo-200 dark:border-indigo-800' },
};

export const QuizCard: React.FC<QuizCardProps> = ({
  question,
  currentIndex,
  totalQuestions,
  userAnswer,
  activeGestureChoice,
  gestureProgress,
  onSelectOption,
  onNextQuestion,
  isLastQuestion,
}) => {
  const isAnswered = userAnswer !== null;
  const categoryStyle = CATEGORY_COLORS[question.category] || CATEGORY_COLORS['물리'];

  return (
    <div className="flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
      {/* Question Header & Clean Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span className={`px-2 py-0.5 rounded ${categoryStyle.bg} ${categoryStyle.text} border ${categoryStyle.border}`}>
            {question.category}
          </span>
          <span aria-hidden="true">·</span>
          <span>{question.grade}</span>
          <span aria-hidden="true">·</span>
          <span>{question.topic}</span>
        </div>

        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 tabular-nums">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            {String(currentIndex + 1).padStart(2, '0')}
          </span>
          {' '}/ {String(totalQuestions).padStart(2, '0')}
        </div>
      </div>

      {/* Question Title */}
      <div className="my-5">
        <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 leading-snug tracking-tight">
          {question.question}
        </h2>

        {question.contextSnippet && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs md:text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <BookOpen className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
            <span>{question.contextSnippet}</span>
          </div>
        )}
      </div>

      {/* 4 Choices Grid */}
      <div className="grid grid-cols-1 gap-3 my-2">
        {question.options.map((optionText, idx) => {
          const optionNumber = (idx + 1) as 1 | 2 | 3 | 4;
          const isSelected = isAnswered && userAnswer.selectedOption === optionNumber;
          const isCorrectChoice = optionNumber === question.correctIndex;
          const isHoveredByGesture = !isAnswered && activeGestureChoice === optionNumber;

          // Compute card appearance
          let cardStyle = 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50/50 dark:hover:bg-slate-800/50';
          let badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';

          if (isAnswered) {
            if (isCorrectChoice) {
              cardStyle = 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 ring-1 ring-emerald-500';
              badgeStyle = 'bg-emerald-600 text-white';
            } else if (isSelected && !isCorrectChoice) {
              cardStyle = 'border-rose-400 bg-rose-50/80 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 ring-1 ring-rose-400';
              badgeStyle = 'bg-rose-500 text-white';
            } else {
              cardStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 opacity-60';
              badgeStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-400';
            }
          } else if (isHoveredByGesture) {
            cardStyle = 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 text-slate-900 dark:text-white shadow-md ring-2 ring-emerald-400';
            badgeStyle = 'bg-emerald-500 text-white animate-pulse';
          }

          return (
            <button
              key={idx}
              type="button"
              disabled={isAnswered}
              onClick={() => onSelectOption(optionNumber, 'click')}
              className={`relative overflow-hidden w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between gap-4 cursor-pointer disabled:cursor-default ${cardStyle}`}
            >
              {/* Active Gesture Countdown Bar (Filling within 1.5s) */}
              {isHoveredByGesture && (
                <div
                  className="absolute left-0 bottom-0 top-0 bg-emerald-500/15 dark:bg-emerald-400/20 pointer-events-none transition-all duration-75"
                  style={{ width: `${Math.round(gestureProgress * 100)}%` }}
                />
              )}

              <div className="relative z-10 flex items-center gap-3.5">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${badgeStyle}`}>
                  {optionNumber}
                </span>
                <span className="text-sm md:text-base font-medium leading-relaxed">
                  {optionText}
                </span>
              </div>

              {/* Status Indicator Icon */}
              <div className="relative z-10 shrink-0">
                {isAnswered && isCorrectChoice && (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="hidden sm:inline">정답</span>
                  </span>
                )}
                {isAnswered && isSelected && !isCorrectChoice && (
                  <span className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <XCircle className="w-5 h-5" />
                    <span className="hidden sm:inline">오답</span>
                  </span>
                )}
                {isHoveredByGesture && (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                    유지 중... {Math.round(gestureProgress * 100)}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Answer Explanation & Next Question Section */}
      <AnimatePresence>
        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4"
          >
            {/* Feedback Alert */}
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              userAnswer.isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}>
              {userAnswer.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {userAnswer.isCorrect ? '정답입니다! 👏' : `오답입니다. 정답은 [${question.correctIndex}번] 입니다.`}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  입력 방식: {userAnswer.inputMethod === 'gesture' ? '손가락 제스처 (1.5초 유지)' : '마우스 클릭'} · 풀이 시간: {userAnswer.timeTakenSec.toFixed(1)}초
                </p>
              </div>
            </div>

            {/* Scientific Explanation Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>해설 및 과학적 원리</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {question.explanation}
              </p>
              
              <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-emerald-500 mt-0.5" />
                <span><strong>핵심 요약:</strong> {question.keyTakeaway}</span>
              </div>
            </div>

            {/* Advance to Next Question Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-400 dark:text-slate-500">
                ✋ 카메라에 손바닥을 1.2초 펴거나 버튼을 누르세요
              </span>

              <button
                type="button"
                onClick={onNextQuestion}
                className="w-full sm:w-auto px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isLastQuestion ? '최종 결과 확인하기' : '다음 문제 풀기'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
