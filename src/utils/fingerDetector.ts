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
  handAngleDeg: number;
  handednessEstimated: 'left' | 'right';
  confidence: number;
  boundingBox: { minX: number; minY: number; maxX: number; maxY: number };
}

// 2D Vector utilities
const dist = (p1: LandmarkPoint, p2: LandmarkPoint): number => {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const dotProduct = (v1: { x: number; y: number }, v2: { x: number; y: number }): number => {
  return v1.x * v2.x + v1.y * v2.y;
};

const normalize = (v: { x: number; y: number }): { x: number; y: number } => {
  const len = Math.sqrt(v.x * v.x + v.y * v.y);
  if (len < 1e-6) return { x: 0, y: -1 };
  return { x: v.x / len, y: v.y / len };
};

/**
 * Rotation-invariant & Left/Right aware hand pose analysis
 */
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

  // Palm center
  const palmCenter = {
    x: (wrist.x + indexMcp.x + middleMcp.x + ringMcp.x + pinkyMcp.x) / 5,
    y: (wrist.y + indexMcp.y + middleMcp.y + ringMcp.y + pinkyMcp.y) / 5,
  };

  // 1. Hand Long Axis Vector (from wrist to middle MCP)
  const handVec = {
    x: middleMcp.x - wrist.x,
    y: middleMcp.y - wrist.y,
  };
  const handLen = Math.sqrt(handVec.x * handVec.x + handVec.y * handVec.y);
  const uHand = normalize(handVec); // Hand pointing direction

  // Hand tilt angle relative to screen vertical (0 deg is pointing straight up)
  const handAngleRad = Math.atan2(uHand.x, -uHand.y);
  const handAngleDeg = (handAngleRad * 180) / Math.PI;

  // 2. Lateral Vector (perpendicular to hand long axis)
  // (-uHand.y, uHand.x) gives vector rotated 90 deg clockwise
  const uLat = { x: -uHand.y, y: uHand.x };

  // 3. Determine left/right orientation from landmarks
  // Vector across palm from index MCP to pinky MCP
  const palmWidthVec = {
    x: pinkyMcp.x - indexMcp.x,
    y: pinkyMcp.y - indexMcp.y,
  };
  const pinkySide = dotProduct(palmWidthVec, uLat);
  const handednessEstimated: 'left' | 'right' = pinkySide > 0 ? 'right' : 'left';

  // Vector pointing toward the thumb side from the palm
  const thumbBaseVec = {
    x: thumbMcp.x - middleMcp.x,
    y: thumbMcp.y - middleMcp.y,
  };
  // Project out the hand axis component so it's purely lateral
  const thumbLatProj = dotProduct(thumbBaseVec, uLat);
  const uThumbDir = thumbLatProj > 0 ? uLat : { x: -uLat.x, y: -uLat.y };

  // 4. Rotation-Invariant Finger Extension Check (Index, Middle, Ring, Pinky)
  const checkFingerExtension = (
    mcp: LandmarkPoint,
    pip: LandmarkPoint,
    dip: LandmarkPoint,
    tip: LandmarkPoint
  ): boolean => {
    // Vector from MCP to TIP
    const mcpToTip = { x: tip.x - mcp.x, y: tip.y - mcp.y };
    const mcpToPip = { x: pip.x - mcp.x, y: pip.y - mcp.y };

    // Projection along hand pointing direction
    const projForwardTip = dotProduct(mcpToTip, uHand);
    const projForwardPip = dotProduct(mcpToPip, uHand);

    // Distance checks
    const distWristTip = dist(tip, wrist);
    const distWristPip = dist(pip, wrist);
    const distMcpTip = dist(tip, mcp);
    const distMcpPip = dist(pip, mcp);
    const distPipTip = dist(tip, pip);

    // When extended:
    // - TIP is far ahead of PIP along the hand forward axis
    // - TIP distance to wrist is strictly greater than PIP distance to wrist
    // - TIP distance to MCP is large (not curled back toward palm)
    const isForward = projForwardTip > projForwardPip * 1.15;
    const isFartherFromWrist = distWristTip > distWristPip * 1.12;
    const isUncurled = distMcpTip > distMcpPip * 1.25 && distPipTip > distMcpPip * 0.7;

    return isForward && isFartherFromWrist && isUncurled;
  };

  const isIndex = checkFingerExtension(indexMcp, indexPip, indexDip, indexTip);
  const isMiddle = checkFingerExtension(middleMcp, middlePip, middleDip, middleTip);
  const isRing = checkFingerExtension(ringMcp, ringPip, ringDip, ringTip);
  const isPinky = checkFingerExtension(pinkyMcp, pinkyPip, pinkyDip, pinkyTip);

  // 5. Dedicated Thumb Detection Rule
  // The thumb moves sideways (abduction/adduction) rather than purely along the hand axis.
  const thumbTipToPinkyMcp = dist(thumbTip, pinkyMcp);
  const thumbIpToPinkyMcp = dist(thumbIp, pinkyMcp);
  const thumbTipToIndexMcp = dist(thumbTip, indexMcp);
  const thumbIpToIndexMcp = dist(thumbIp, indexMcp);

  // Lateral extension of thumb tip from thumb MCP along uThumbDir
  const thumbMcpToTip = { x: thumbTip.x - thumbMcp.x, y: thumbTip.y - thumbMcp.y };
  const thumbLatExtension = dotProduct(thumbMcpToTip, uThumbDir);
  const thumbMcpPipDist = dist(thumbMcp, thumbCmc);

  // Check if thumb is folded/tucked into the palm:
  // When folded: thumb tip is close to index MCP or middle MCP, and lateral extension is small.
  const isThumbTucked = thumbTipToIndexMcp < thumbMcpPipDist * 1.3 || thumbLatExtension < thumbMcpPipDist * 0.5;

  // When extended:
  // - Lateral extension along thumb direction is significant
  // - Thumb tip is far from pinky MCP and index MCP
  const isThumbExtended =
    !isThumbTucked &&
    thumbLatExtension > thumbMcpPipDist * 0.8 &&
    thumbTipToPinkyMcp > thumbIpToPinkyMcp * 1.15 &&
    dist(thumbTip, wrist) > dist(thumbMcp, wrist) * 1.15;

  // 6. Refined Finger Counting Logic
  const nonThumbCount = (isIndex ? 1 : 0) + (isMiddle ? 1 : 0) + (isRing ? 1 : 0) + (isPinky ? 1 : 0);
  let finalCount = 0;

  if (isThumbExtended) {
    if (nonThumbCount === 0) {
      // Only thumb is extended (e.g. thumbs up)
      finalCount = 1;
    } else if (nonThumbCount === 1) {
      // Thumb + 1 finger (usually thumb + index)
      finalCount = 2;
    } else if (nonThumbCount === 2) {
      // Thumb + 2 fingers (e.g. German style 3)
      finalCount = 3;
    } else if (nonThumbCount === 3) {
      // Thumb + 3 fingers
      finalCount = 4;
    } else if (nonThumbCount === 4) {
      // All 5 fingers extended
      finalCount = 5;
    }
  } else {
    // Thumb is folded: directly use the 4 main fingers
    finalCount = nonThumbCount;
  }

  // Calculate bounding box
  let minX = 1, minY = 1, maxX = 0, maxY = 0;
  landmarks.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  return {
    fingerCount: finalCount,
    isThumb: isThumbExtended,
    isIndex,
    isMiddle,
    isRing,
    isPinky,
    palmCenter,
    handAngleDeg,
    handednessEstimated,
    confidence: Math.min(1, Math.max(0, handLen * 3)),
    boundingBox: { minX, minY, maxX, maxY },
  };
};

/**
 * Rolling Window Temporal Filter for Finger Count Stabilization
 */
export class FingerCountStabilizer {
  private history: number[] = [];
  private windowSize: number;
  private currentStabilized: number = 0;

  constructor(windowSize: number = 8) {
    this.windowSize = windowSize;
  }

  public addSample(count: number): number {
    this.history.push(count);
    if (this.history.length > this.windowSize) {
      this.history.shift();
    }

    // Compute frequency mode in recent window
    const freqMap = new Map<number, number>();
    for (const val of this.history) {
      freqMap.set(val, (freqMap.get(val) || 0) + 1);
    }

    let bestCount = this.currentStabilized;
    let maxFreq = 0;
    freqMap.forEach((freq, val) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        bestCount = val;
      }
    });

    // If candidate has majority support (>= 60%), update stabilized count
    if (maxFreq >= Math.ceil(this.history.length * 0.6)) {
      this.currentStabilized = bestCount;
    }

    return this.currentStabilized;
  }

  public reset(): void {
    this.history = [];
    this.currentStabilized = 0;
  }

  public getStabilizedCount(): number {
    return this.currentStabilized;
  }
}

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
  [5, 9], [9, 13], [13, 17],
];
