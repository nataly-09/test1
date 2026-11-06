export type ScienceCategory = '물리' | '화학' | '생물' | '지구과학';

export interface QuizQuestion {
  id: number;
  category: ScienceCategory;
  grade: '중1' | '중2' | '중3';
  topic: string;
  question: string;
  contextSnippet?: string;
  options: [string, string, string, string];
  correctIndex: 1 | 2 | 3 | 4;
  explanation: string;
  keyTakeaway: string;
}

export interface UserAnswerRecord {
  questionId: number;
  selectedOption: 1 | 2 | 3 | 4;
  isCorrect: boolean;
  timeTakenSec: number;
  inputMethod: 'gesture' | 'click';
}

export type InputMode = 'gesture' | 'mouse';

export interface GestureDetectionState {
  isHandDetected: boolean;
  fingerCount: number; // 0 to 5
  activeChoice: 1 | 2 | 3 | 4 | null;
  progress: number; // 0 to 1 (1.5s countdown)
  detectionMessage: string;
  confidence: number;
}
