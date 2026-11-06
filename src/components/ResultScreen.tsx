import React, { useEffect, useState } from 'react';
import { QuizQuestion, UserAnswerRecord } from '../types';
import confetti from 'canvas-confetti';
import { playCompletionSound } from '../utils/audio';
import { Award, CheckCircle2, XCircle, RotateCcw, ChevronDown, ChevronUp, Clock, Target, Hand } from 'lucide-react';

interface ResultScreenProps {
  questions: QuizQuestion[];
  answers: UserAnswerRecord[];
  onRestart: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  questions,
  answers,
  onRestart,
}) => {
  const [expandedQuestionId, setExpandedQuestionId] = useState<number | null>(null);

  // Compute stats
  const totalQuestions = questions.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const score = Math.round((correctCount / totalQuestions) * 100);
  const totalSeconds = answers.reduce((acc, cur) => acc + cur.timeTakenSec, 0);
  const gestureCount = answers.filter((a) => a.inputMethod === 'gesture').length;
  const gestureRatio = Math.round((gestureCount / Math.max(1, answers.length)) * 100);

  // Category breakdown
  const categoryStats = ['물리', '화학', '생물', '지구과학'].map((cat) => {
    const qIds = questions.filter((q) => q.category === cat).map((q) => q.id);
    const catAnswers = answers.filter((a) => qIds.includes(a.questionId));
    const catCorrect = catAnswers.filter((a) => a.isCorrect).length;
    return {
      category: cat,
      total: qIds.length,
      correct: catCorrect,
      pct: qIds.length > 0 ? Math.round((catCorrect / qIds.length) * 100) : 0,
    };
  });

  // Confetti & Audio on mount
  useEffect(() => {
    playCompletionSound();
    
    // Launch celebratory confetti
    const end = Date.now() + 1500;
    const colors = ['#10B981', '#06B6D4', '#F59E0B', '#6366F1'];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors,
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const getEvaluationTitle = (score: number) => {
    if (score === 100) return { title: '중학 과학 마스터! 🏆', desc: '10문제를 모두 완벽하게 맞혔습니다. 과학적 사고력과 제스처 센스가 탁월합니다!' };
    if (score >= 80) return { title: '우수한 과학 탐구자 🌟', desc: '대부분의 중학교 과학 개념을 정확히 이해하고 있습니다. 훌륭한 성과입니다!' };
    if (score >= 60) return { title: '유망한 과학 꿈나무 🌱', desc: '기초 개념이 탄탄합니다. 틀린 문제의 해설을 복습하면 백점에 도달할 수 있어요.' };
    return { title: '꾸준한 노력의 과학자 🚀', desc: '다양한 중학 과학 원리를 학습했습니다. 해설을 차근차근 살펴보며 다시 도전해 보세요!' };
  };

  const evalInfo = getEvaluationTitle(score);

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto py-4">
      {/* Score Hero Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-8 text-center shadow-sm relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center mb-4">
          <Award className="w-9 h-9" />
        </div>

        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {evalInfo.title}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto">
          {evalInfo.desc}
        </p>

        {/* Big Score Display */}
        <div className="my-6">
          <span className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
            {score}
          </span>
          <span className="text-xl md:text-2xl font-bold text-slate-400 ml-1">점 / 100점</span>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-100 dark:border-slate-800 text-left">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-500" />
              정답 수
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {correctCount} / {totalQuestions}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-sky-500" />
              총 소요 시간
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {Math.floor(totalSeconds / 60)}분 {Math.round(totalSeconds % 60)}초
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Hand className="w-3.5 h-3.5 text-amber-500" />
              제스처 활용률
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {gestureRatio}% ({gestureCount}문제)
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-indigo-500" />
              문제당 평균 시간
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-1 tabular-nums">
              {(totalSeconds / Math.max(1, answers.length)).toFixed(1)}초
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-8">
          <button
            onClick={onRestart}
            className="px-8 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>퀴즈 다시 풀기</span>
          </button>
        </div>
      </div>

      {/* Category Performance Breakdown */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
          과학 분야별 정답 현황
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categoryStats.map((item) => (
            <div key={item.category} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center justify-between text-xs font-semibold mb-2">
                <span className="text-slate-700 dark:text-slate-300">{item.category}</span>
                <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                  {item.correct}/{item.total} ({item.pct}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 10 Questions Detailed Review & Explanation */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 md:p-8 shadow-sm">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            문항별 상세 정답 및 해설 복습
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            클릭하여 상세 해설 확인
          </span>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const answer = answers.find((a) => a.questionId === q.id);
            const isCorrect = answer?.isCorrect ?? false;
            const isExpanded = expandedQuestionId === q.id;

            return (
              <div
                key={q.id}
                className={`rounded-xl border transition-all duration-200 ${
                  isExpanded
                    ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/10'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                {/* Question Summary Bar */}
                <button
                  type="button"
                  onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{q.category}</span>
                        <span aria-hidden="true">·</span>
                        <span>{q.topic}</span>
                        <span aria-hidden="true">·</span>
                        <span>{answer?.inputMethod === 'gesture' ? '손가락 제스처' : '마우스 클릭'}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {q.question}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="hidden sm:inline">정답</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                        <XCircle className="w-4 h-4" />
                        <span className="hidden sm:inline">오답</span>
                      </span>
                    )}

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Collapsible Explanation Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs md:text-sm">
                    {/* Choices Grid */}
                    <div className="grid grid-cols-1 gap-2 my-3">
                      {q.options.map((opt, optIdx) => {
                        const optNum = (optIdx + 1) as 1 | 2 | 3 | 4;
                        const isCorrectOpt = optNum === q.correctIndex;
                        const isUserChoice = answer?.selectedOption === optNum;

                        let rowStyle = 'bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60';
                        if (isCorrectOpt) {
                          rowStyle = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 font-medium';
                        } else if (isUserChoice && !isCorrectOpt) {
                          rowStyle = 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border border-rose-300 dark:border-rose-800';
                        }

                        return (
                          <div key={optIdx} className={`p-2.5 rounded-lg flex items-center justify-between gap-2 ${rowStyle}`}>
                            <span>
                              <strong>{optNum}번:</strong> {opt}
                            </span>
                            <div className="shrink-0 text-xs font-bold">
                              {isCorrectOpt && <span className="text-emerald-600 dark:text-emerald-400">정답</span>}
                              {isUserChoice && !isCorrectOpt && <span className="text-rose-600 dark:text-rose-400">내 선택</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Detailed Explanation */}
                    <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 mt-3 leading-relaxed text-slate-700 dark:text-slate-300">
                      <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">💡 상세 해설</p>
                      <p>{q.explanation}</p>
                      <p className="mt-2 text-emerald-700 dark:text-emerald-400 font-medium">
                        핵심 정리: {q.keyTakeaway}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
