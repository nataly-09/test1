export interface LandmarkPoint {
  x: number;
  y: number;
  z?: number;
}

export interface HandAnalysisResult {
  fingerCount: number;
  isThumb: boolean;
  isIndex: boolean;
  isMiddle: boolean;
  isRing: boolean;
  isPinky: boolean;
  palmCenter: { x: number; y: number };
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
}

// Euclidean distance between two points
const dist = (p1: LandmarkPoint, p2: LandmarkPoint): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const analyzeHandPose = (landmarks: LandmarkPoint[]): HandAnalysisResult | null => {
  if (!landmarks || landmarks.length < 21) return null;

  const wrist = landmarks[0];
  const thumbCmc = landmarks[1];
  const thumbMcp = landmarks[2];
  const thumbIp = landmarks[3];
  const thumbTip = landmarks[4];

  const indexMcp = landmarks[5];
  const indexPip = landmarks[6];
  const indexDip = landmarks[7];
  const indexTip = landmarks[8];

  const middleMcp = landmarks[9];
  const middlePip = landmarks[10];
  const middleDip = landmarks[11];
  const middleTip = landmarks[12];

  const ringMcp = landmarks[13];
  const ringPip = landmarks[14];
  const ringDip = landmarks[15];
  const ringTip = landmarks[16];

  const pinkyMcp = landmarks[17];
  const pinkyPip = landmarks[18];
  const pinkyDip = landmarks[19];
  const pinkyTip = landmarks[20];

  // Palm center approximation
  const palmCenter = {
    x: (wrist.x + indexMcp.x + pinkyMcp.x) / 3,
    y: (wrist.y + indexMcp.y + pinkyMcp.y) / 3,
  };

  // Check 4 main fingers (Index, Middle, Ring, Pinky)
  // A finger is extended when tip distance to palm center is significantly greater than PIP distance to palm center
  // and tip.y is above pip.y in normal upright pose
  const isExtended = (tip: LandmarkPoint, pip: LandmarkPoint, dip: LandmarkPoint, mcp: LandmarkPoint) => {
    const distToPalmTip = dist(tip, palmCenter);
    const distToPalmPip = dist(pip, palmCenter);
    const distToWristTip = dist(tip, wrist);
    const distToWristPip = dist(pip, wrist);

    // Tip should be further from wrist/palm than PIP
    const isFarther = distToPalmTip > distToPalmPip * 1.18 && distToWristTip > distToWristPip * 1.15;
    // Straightness: distance MCP->TIP should be close to (MCP->PIP + PIP->DIP + DIP->TIP)
    const isAbovePip = tip.y < pip.y || isFarther;

    return isFarther && isAbovePip;
  };

  const isIndex = isExtended(indexTip, indexPip, indexDip, indexMcp);
  const isMiddle = isExtended(middleTip, middlePip, middleDip, middleMcp);
  const isRing = isExtended(ringTip, ringPip, ringDip, ringMcp);
  const isPinky = isExtended(pinkyTip, pinkyPip, pinkyDip, pinkyMcp);

  // Thumb detection:
  // Thumb opens laterally. Distance to pinky base (17) is large when thumb is extended outwards.
  const thumbToPinkyBase = dist(thumbTip, pinkyMcp);
  const thumbIpToPinkyBase = dist(thumbIp, pinkyMcp);
  const thumbToWrist = dist(thumbTip, wrist);
  const thumbMcpToWrist = dist(thumbMcp, wrist);

  const isThumb = thumbToPinkyBase > thumbIpToPinkyBase * 1.25 && thumbToWrist > thumbMcpToWrist * 1.2;

  // Calculate total extended fingers
  // In standard gesture counting:
  // 1 finger: usually Index (or Thumb)
  // 2 fingers: Index + Middle (or Thumb + Index)
  // 3 fingers: Index + Middle + Ring (or Thumb + Index + Middle)
  // 4 fingers: 4 fingers (Index + Middle + Ring + Pinky) or any 4 fingers
  // 5 fingers: all 5
  let count = 0;
  if (isThumb) count++;
  if (isIndex) count++;
  if (isMiddle) count++;
  if (isRing) count++;
  if (isPinky) count++;

  // Refined mapping for common gestures:
  // If user folds thumb and extends 1, 2, 3, 4 fingers:
  const nonThumbCount = (isIndex ? 1 : 0) + (isMiddle ? 1 : 0) + (isRing ? 1 : 0) + (isPinky ? 1 : 0);
  
  // If nonThumbCount is between 1 and 4 and thumb is slightly ambiguous, prioritize nonThumbCount
  let finalCount = count;
  if (!isThumb && nonThumbCount >= 1 && nonThumbCount <= 4) {
    finalCount = nonThumbCount;
  } else if (isThumb && nonThumbCount === 0) {
    // Only thumb is up: count as 1
    finalCount = 1;
  } else if (isThumb && nonThumbCount === 1) {
    // Thumb + 1 other finger: count as 2
    finalCount = 2;
  } else if (isThumb && nonThumbCount === 2) {
    // Thumb + 2 other fingers: count as 3
    finalCount = 3;
  } else if (isThumb && nonThumbCount === 3) {
    // Thumb + 3 other fingers: count as 4
    finalCount = 4;
  }

  // Calculate bounding box
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  landmarks.forEach(p => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  return {
    fingerCount: finalCount,
    isThumb,
    isIndex,
    isMiddle,
    isRing,
    isPinky,
    palmCenter,
    boundingBox: { minX, minY, maxX, maxY },
  };
};

// Hand landmarks connection pairs for drawing skeleton
export const HAND_CONNECTIONS: [number, number][] = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [0, 9], [9, 10], [10, 11], [11, 12],
  // Ring
  [0, 13], [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm connections
  [5, 9], [9, 13], [13, 17]
];
