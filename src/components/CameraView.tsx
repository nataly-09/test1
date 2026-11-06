import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import { analyzeHandPose, HAND_CONNECTIONS, LandmarkPoint } from '../utils/fingerDetector';
import { playTickSound, playSelectLockSound } from '../utils/audio';
import { Camera, CameraOff, RefreshCw, ShieldCheck, AlertCircle, Sparkles, MousePointer } from 'lucide-react';

interface CameraViewProps {
  onChoiceDetected: (choice: 1 | 2 | 3 | 4 | null, progress: number) => void;
  onChoiceConfirmed: (choice: 1 | 2 | 3 | 4) => void;
  isQuestionAnswered: boolean;
  onSwitchToMouse: () => void;
  onAdvanceNext?: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onChoiceDetected,
  onChoiceConfirmed,
  isQuestionAnswered,
  onSwitchToMouse,
  onAdvanceNext
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameId = useRef<number | null>(null);

  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(true);
  const [modelLoadProgress, setModelLoadProgress] = useState<string>('AI 모델 엔진 초기화 중...');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  
  // Gesture tracking state
  const holdStartTimeRef = useRef<number | null>(null);
  const currentCountRef = useRef<number | null>(null);
  const lastSoundTickRef = useRef<number>(0);
  const isQuestionAnsweredRef = useRef(isQuestionAnswered);
  isQuestionAnsweredRef.current = isQuestionAnswered;

  const [detectedFingerCount, setDetectedFingerCount] = useState<number>(0);
  const [isHandVisible, setIsHandVisible] = useState<boolean>(false);
  const [gestureProgress, setGestureProgress] = useState<number>(0);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  // Initialize MediaPipe Vision Tasks HandLandmarker
  useEffect(() => {
    let isCancelled = false;

    const initMediaPipe = async () => {
      try {
        setIsLoadingModel(true);
        setModelLoadProgress('WebAssembly 비전 엔진 로딩 중...');

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm'
        );

        if (isCancelled) return;
        setModelLoadProgress('손가락 랜드마크 신경망 로드 중...');

        let landmarker: HandLandmarker | null = null;
        try {
          // Attempt GPU delegate first for smooth 60fps
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.6,
            minHandPresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });
        } catch {
          // Fallback to CPU if GPU delegate is restricted in browser
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.6,
            minHandPresenceConfidence: 0.6,
            minTrackingConfidence: 0.6,
          });
        }

        if (isCancelled) return;
        landmarkerRef.current = landmarker;
        setIsLoadingModel(false);
      } catch (err: unknown) {
        console.error('MediaPipe initialization failed:', err);
        if (!isCancelled) {
          setIsLoadingModel(false);
          setCameraError('AI 비전 모델을 로드하는 중 문제가 발생했습니다. 마우스 모드로 퀴즈를 즐기실 수 있습니다.');
        }
      }
    };

    initMediaPipe();

    return () => {
      isCancelled = true;
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
        landmarkerRef.current = null;
      }
    };
  }, []);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('이 브라우저는 카메라 스트림을 지원하지 않습니다.');
      }

      // Stop previous stream if running
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setCameraActive(true);
          }).catch((e) => {
            console.error('Video play error:', e);
          });
        };
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err);
      setCameraActive(false);
      const errorMsg =
        (err as { name?: string })?.name === 'NotAllowedError'
          ? '카메라 사용 권한이 거부되었습니다. 브라우저 주소창 설정에서 권한을 허용하거나, 마우스 클릭 모드로 즉시 진행하세요.'
          : (err as { name?: string })?.name === 'NotFoundError'
          ? '사용 가능한 웹캠 카메라 장치를 찾을 수 없습니다. 마우스 클릭 모드를 이용해 주세요.'
          : '카메라에 연결할 수 없습니다. 다른 앱에서 카메라를 사용 중인지 확인하거나 마우스 모드로 풀어보세요.';
      setCameraError(errorMsg);
    }
  }, [facingMode]);

  // Stop Camera
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setIsHandVisible(false);
    setDetectedFingerCount(0);
    setGestureProgress(0);
    onChoiceDetected(null, 0);
  }, [onChoiceDetected]);

  // Auto-start camera once model is ready
  useEffect(() => {
    if (!isLoadingModel && !cameraActive && !cameraError) {
      startCamera();
    }
  }, [isLoadingModel, cameraActive, cameraError, startCamera]);

  // Frame detection loop
  useEffect(() => {
    let lastVideoTime = -1;

    const renderLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;

      if (video && canvas && landmarker && video.readyState >= 2) {
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;

        if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
          canvas.width = videoWidth;
          canvas.height = videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          const currentTime = video.currentTime;
          if (currentTime !== lastVideoTime) {
            lastVideoTime = currentTime;
            const startTimeMs = performance.now();
            const detections = landmarker.detectForVideo(video, startTimeMs);

            if (detections.landmarks && detections.landmarks.length > 0) {
              const landmarks = detections.landmarks[0] as LandmarkPoint[];
              setIsHandVisible(true);

              const analysis = analyzeHandPose(landmarks);
              const count = analysis ? analysis.fingerCount : 0;
              setDetectedFingerCount(count);

              // Draw skeleton overlay (Mirrored for natural selfie view)
              ctx.save();
              // Mirror coordinate system horizontally for canvas rendering
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);

              // 1. Draw connections
              ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)'; // Emerald line
              ctx.lineWidth = 3.5;
              ctx.lineCap = 'round';
              ctx.lineJoin = 'round';

              for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
                const p1 = landmarks[startIdx];
                const p2 = landmarks[endIdx];
                if (p1 && p2) {
                  ctx.beginPath();
                  ctx.moveTo(p1.x * canvas.width, p1.y * canvas.height);
                  ctx.lineTo(p2.x * canvas.width, p2.y * canvas.height);
                  ctx.stroke();
                }
              }

              // 2. Draw landmarks
              landmarks.forEach((p, idx) => {
                const isTip = [4, 8, 12, 16, 20].includes(idx);
                ctx.beginPath();
                ctx.arc(p.x * canvas.width, p.y * canvas.height, isTip ? 6.5 : 4, 0, 2 * Math.PI);

                if (isTip) {
                  ctx.fillStyle = '#06B6D4'; // Cyan tip
                  ctx.strokeStyle = '#FFFFFF';
                  ctx.lineWidth = 2;
                  ctx.fill();
                  ctx.stroke();
                } else {
                  ctx.fillStyle = '#10B981'; // Emerald joint
                  ctx.fill();
                }
              });

              ctx.restore();

              // Gesture Confirmation Logic (1.5 seconds hold)
              const isValidChoice = count >= 1 && count <= 4;
              const now = Date.now();

              if (isValidChoice && !isQuestionAnsweredRef.current) {
                const choiceNum = count as 1 | 2 | 3 | 4;

                if (currentCountRef.current === choiceNum) {
                  const elapsed = now - (holdStartTimeRef.current || now);
                  const progress = Math.min(1, elapsed / 1500);
                  setGestureProgress(progress);
                  onChoiceDetected(choiceNum, progress);

                  // Subtle audio tick during hold
                  if (now - lastSoundTickRef.current > 300 && progress > 0.1 && progress < 0.95) {
                    playTickSound(progress);
                    lastSoundTickRef.current = now;
                  }

                  // 1.5s completed -> Lock in the answer!
                  if (progress >= 1) {
                    playSelectLockSound();
                    onChoiceConfirmed(choiceNum);
                    // Reset hold state
                    holdStartTimeRef.current = null;
                    currentCountRef.current = null;
                    setGestureProgress(0);
                    onChoiceDetected(null, 0);
                  }
                } else {
                  // Switch to new finger count
                  currentCountRef.current = choiceNum;
                  holdStartTimeRef.current = now;
                  setGestureProgress(0);
                  onChoiceDetected(choiceNum, 0);
                }
              } else if (isQuestionAnsweredRef.current && count === 5 && onAdvanceNext) {
                // If question is answered and user shows 5 open fingers for 1.5s, advance to next question!
                if (currentCountRef.current === 5) {
                  const elapsed = now - (holdStartTimeRef.current || now);
                  const progress = Math.min(1, elapsed / 1200);
                  setGestureProgress(progress);
                  if (progress >= 1) {
                    playSelectLockSound();
                    onAdvanceNext();
                    holdStartTimeRef.current = null;
                    currentCountRef.current = null;
                    setGestureProgress(0);
                  }
                } else {
                  currentCountRef.current = 5;
                  holdStartTimeRef.current = now;
                }
              } else {
                // Not a valid 1-4 choice or hand lost
                currentCountRef.current = null;
                holdStartTimeRef.current = null;
                setGestureProgress(0);
                onChoiceDetected(null, 0);
              }
            } else {
              // No hand detected in frame
              setIsHandVisible(false);
              setDetectedFingerCount(0);
              currentCountRef.current = null;
              holdStartTimeRef.current = null;
              setGestureProgress(0);
              onChoiceDetected(null, 0);
            }
          }
        }
      }

      animationFrameId.current = requestAnimationFrame(renderLoop);
    };

    animationFrameId.current = requestAnimationFrame(renderLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [onChoiceConfirmed, onChoiceDetected, onAdvanceNext]);

  return (
    <div className="flex flex-col gap-3">
      {/* Video Container Box */}
      <div className="relative w-full aspect-4/3 max-w-md mx-auto bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Real-time Video Stream (Mirrored) */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover scale-x-[-1] ${!cameraActive ? 'hidden' : 'block'}`}
          playsInline
          autoPlay
          muted
        />

        {/* Real-time Skeleton Overlay Canvas */}
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full pointer-events-none ${!cameraActive ? 'hidden' : 'block'}`}
        />

        {/* Loading Spinner for Model */}
        {isLoadingModel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-900 text-white text-center">
            <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-200">{modelLoadProgress}</p>
            <p className="text-xs text-slate-400 mt-2">최초 1회 WebAssembly AI 가속 엔진을 로드합니다.</p>
          </div>
        )}

        {/* Camera Permission / Device Error Banner */}
        {cameraError && !isLoadingModel && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-900/95 text-white text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-100 mb-1">카메라 연결 안내</h4>
            <p className="text-xs text-slate-300 max-w-xs mb-4 leading-relaxed">{cameraError}</p>
            
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={startCamera}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                카메라 다시 시도
              </button>
              <button
                onClick={onSwitchToMouse}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <MousePointer className="w-3.5 h-3.5" />
                마우스 클릭으로 풀기
              </button>
            </div>
          </div>
        )}

        {/* Real-time Hand Recognition HUD Overlay */}
        {cameraActive && !isLoadingModel && (
          <>
            {/* Top Status Bar */}
            <div className="absolute top-3 inset-x-3 flex items-center justify-between text-xs font-medium text-white pointer-events-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md">
                <span className={`w-2 h-2 rounded-full ${isHandVisible ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
                <span>{isHandVisible ? '손 인식 활성' : '카메라 앞에 손을 올려주세요'}</span>
              </div>

              {detectedFingerCount > 0 && (
                <div className="px-2.5 py-1 rounded-md bg-emerald-500/90 text-white font-bold backdrop-blur-md flex items-center gap-1">
                  <span>손가락 {detectedFingerCount}개</span>
                </div>
              )}
            </div>

            {/* Hold Confirmation Circular Progress Ring (when counting 1~4) */}
            {detectedFingerCount >= 1 && detectedFingerCount <= 4 && !isQuestionAnswered && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 text-white shadow-lg pointer-events-none">
                {/* SVG Progress Circle */}
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <svg className="w-8 h-8 -rotate-90">
                    <circle
                      cx="16"
                      cy="16"
                      r="13"
                      fill="transparent"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="3"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="13"
                      fill="transparent"
                      stroke="#10B981"
                      strokeWidth="3"
                      strokeDasharray={2 * Math.PI * 13}
                      strokeDashoffset={2 * Math.PI * 13 * (1 - gestureProgress)}
                      strokeLinecap="round"
                      className="transition-all duration-75"
                    />
                  </svg>
                  <span className="absolute text-xs font-bold text-emerald-400">{detectedFingerCount}</span>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-white leading-tight">
                    {detectedFingerCount}번 선택 중...
                  </span>
                  <span className="text-[11px] text-slate-300">
                    1.5초 유지 시 자동 확정 ({(gestureProgress * 1.5).toFixed(1)}s / 1.5s)
                  </span>
                </div>
              </div>
            )}

            {/* Answered State Tip */}
            {isQuestionAnswered && (
              <div className="absolute bottom-3 inset-x-3 text-center pointer-events-none">
                <span className="inline-block text-[11px] px-3 py-1 rounded-md bg-black/75 text-emerald-300 backdrop-blur-md border border-emerald-500/30">
                  ✋ 손바닥을 1.2초 펴거나 [다음 문제] 버튼을 누르세요
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Camera Controls & Security Statement */}
      <div className="flex flex-col gap-2 max-w-md mx-auto w-full">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            {cameraActive ? (
              <button
                onClick={stopCamera}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="카메라 일시 정지"
              >
                <CameraOff className="w-3.5 h-3.5 text-slate-500" />
                <span>카메라 끄기</span>
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors"
                title="카메라 켜기"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>카메라 켜기</span>
              </button>
            )}

            <button
              onClick={() => {
                const nextMode = facingMode === 'user' ? 'environment' : 'user';
                setFacingMode(nextMode);
                if (cameraActive) {
                  stopCamera();
                  setTimeout(() => startCamera(), 100);
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="전면/후면 카메라 전환"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              <span>전환</span>
            </button>
          </div>

          <button
            onClick={onSwitchToMouse}
            className="flex items-center gap-1 px-2.5 py-1.5 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>마우스 모드로 전환</span>
          </button>
        </div>

        {/* Privacy & Safety Note (Required by User Prompt) */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <p className="leading-tight">
            <strong>로컬 온디바이스 처리:</strong> 카메라 영상은 외부 서버로 전송되지 않으며, 사용자 기기 브라우저에서만 실시간 분석됩니다.
          </p>
        </div>
      </div>
    </div>
  );
};
