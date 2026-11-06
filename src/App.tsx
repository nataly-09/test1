import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QUIZ_QUESTIONS } from './data/quizData';
import { UserAnswerRecord, InputMode } from './types';
import { CameraView } from './components/CameraView';
import { QuizCard } from './components/QuizCard';
import { ResultScreen } from './components/ResultScreen';
import { Navbar } from './components/Navbar';
import { GestureGuideModal } from './components/GestureGuideModal';
import {
  setSoundEnabled,
  getSoundEnabled,
  playCorrectSound,
  playWrongSound,
  playButtonClick,
} from './utils/audio';
import { Camera, MousePointer, ShieldCheck, HelpCircle } from 'lucide-react';

export default function App() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswerRecord[]>([]);
  const [activeGestureChoice, setActiveGestureChoice] = useState<1 | 2 | 3 | 4 | null>(null);
  const [gestureProgress, setGestureProgress] = useState<number>(0);
  const [inputMode, setInputMode] = useState<InputMode>('gesture');
  const [isQuizFinished, setIsQuizFinished] = useState<boolean>(false);
  const [soundOn, setSoundOn] = useState<boolean>(true);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);

  const questionStartTimeRef = useRef<number>(Date.now());
  const currentQuestion = QUIZ_QUESTIONS[currentQuestionIndex];
  const currentUserAnswer = userAnswers.find((a) => a.questionId === currentQuestion?.id) || null;

  // Track live score
  const score = userAnswers.filter((a) => a.isCorrect).length * 10;

  // Reset timer on question change
  useEffect(() => {
    questionStartTimeRef.current = Date.now();
    setActiveGestureChoice(null);
    setGestureProgress(0);
  }, [currentQuestionIndex]);

  // Handle answer selection (via gesture or mouse click)
  const handleSelectOption = useCallback(
    (optionNumber: 1 | 2 | 3 | 4, method: 'gesture' | 'click') => {
      if (currentUserAnswer) return; // Already answered

      const timeTakenSec = Math.max(0.5, (Date.now() - questionStartTimeRef.current) / 1000);
      const isCorrect = optionNumber === currentQuestion.correctIndex;

      if (isCorrect) {
        playCorrectSound();
      } else {
        playWrongSound();
      }

      const newRecord: UserAnswerRecord = {
        questionId: currentQuestion.id,
        selectedOption: optionNumber,
        isCorrect,
        timeTakenSec,
        inputMethod: method,
      };

      setUserAnswers((prev) => [...prev, newRecord]);
    },
    [currentUserAnswer, currentQuestion]
  );

  // Gesture hover callback from CameraView
  const handleGestureDetected = useCallback((choice: 1 | 2 | 3 | 4 | null, progress: number) => {
    setActiveGestureChoice(choice);
    setGestureProgress(progress);
  }, []);

  // Gesture confirmed callback (after 1.5s) from CameraView
  const handleGestureConfirmed = useCallback(
    (choice: 1 | 2 | 3 | 4) => {
      handleSelectOption(choice, 'gesture');
    },
    [handleSelectOption]
  );

  // Next Question
  const handleNextQuestion = useCallback(() => {
    playButtonClick();
    if (currentQuestionIndex < QUIZ_QUESTIONS.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setIsQuizFinished(true);
    }
  }, [currentQuestionIndex]);

  // Restart Quiz
  const handleRestartQuiz = useCallback(() => {
    playButtonClick();
    setUserAnswers([]);
    setCurrentQuestionIndex(0);
    setIsQuizFinished(false);
    questionStartTimeRef.current = Date.now();
  }, []);

  // Sound toggle
  const handleToggleSound = useCallback(() => {
    const nextVal = !soundOn;
    setSoundOn(nextVal);
    setSoundEnabled(nextVal);
  }, [soundOn]);

  // Input mode toggle
  const handleToggleInputMode = useCallback(() => {
    playButtonClick();
    setInputMode((prev) => (prev === 'gesture' ? 'mouse' : 'gesture'));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-900">
      {/* Top Bar Contract Navigation */}
      <Navbar
        score={score}
        currentQuestionIndex={currentQuestionIndex}
        totalQuestions={QUIZ_QUESTIONS.length}
        inputMode={inputMode}
        onToggleInputMode={handleToggleInputMode}
        soundEnabled={soundOn}
        onToggleSound={handleToggleSound}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 md:py-8">
        {isQuizFinished ? (
          <ResultScreen
            questions={QUIZ_QUESTIONS}
            answers={userAnswers}
            onRestart={handleRestartQuiz}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Primary Question & Choices Stage (7 Cols on desktop) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <QuizCard
                question={currentQuestion}
                currentIndex={currentQuestionIndex}
                totalQuestions={QUIZ_QUESTIONS.length}
                userAnswer={currentUserAnswer}
                activeGestureChoice={activeGestureChoice}
                gestureProgress={gestureProgress}
                onSelectOption={(opt, method) => handleSelectOption(opt, method)}
                onNextQuestion={handleNextQuestion}
                isLastQuestion={currentQuestionIndex === QUIZ_QUESTIONS.length - 1}
              />
            </div>

            {/* Camera / Gesture HUD & Input Stage (5 Cols on desktop) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              {inputMode === 'gesture' ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        AI 손가락 제스처 카메라
                      </h3>
                    </div>
                    <button
                      onClick={() => setIsHelpOpen(true)}
                      className="text-xs text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>가이드</span>
                    </button>
                  </div>

                  <CameraView
                    onChoiceDetected={handleGestureDetected}
                    onChoiceConfirmed={handleGestureConfirmed}
                    isQuestionAnswered={currentUserAnswer !== null}
                    onSwitchToMouse={() => setInputMode('mouse')}
                    onAdvanceNext={handleNextQuestion}
                  />

                  {/* Gesture Quick Helper Strip */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-1.5 text-center text-[11px]">
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block">1번</span>
                      <span className="text-slate-500">검지 1개</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block">2번</span>
                      <span className="text-slate-500">손가락 2개</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block">3번</span>
                      <span className="text-slate-500">손가락 3개</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 block">4번</span>
                      <span className="text-slate-500">손가락 4개</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mouse Mode Activated Card */
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col gap-4 text-center">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center">
                    <MousePointer className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      마우스 클릭 모드 활성화됨
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                      왼쪽 문제의 보기를 직접 마우스나 터치로 클릭하여 즉시 정답을 선택할 수 있습니다.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-left text-xs space-y-2">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">💡 팁:</p>
                    <p className="text-slate-600 dark:text-slate-400">
                      웹캠을 지원하는 환경이라면 상단 또는 아래 버튼을 눌러 손가락 제스처 모드로 언제든 전환할 수 있습니다.
                    </p>
                  </div>

                  <button
                    onClick={() => setInputMode('gesture')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    <span>카메라 제스처 모드로 전환</span>
                  </button>
                </div>
              )}

              {/* Security & System Info Card */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                    100% 로컬 프라이버시 보장
                  </h4>
                  <p className="leading-relaxed">
                    본 웹앱은 구글 MediaPipe WebAssembly 기술을 통해 사용자의 브라우저 내에서만 모든 비전 신경망 연산을 처리합니다. 카메라 영상 데이터는 서버로 절대 전송되지 않습니다.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Gesture Guide Modal */}
      <GestureGuideModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />
    </div>
  );
}
