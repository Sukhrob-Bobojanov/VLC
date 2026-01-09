
/**
 * Hardened Optical Protocol (HOP-v4) - Speed Optimized
 * Balanced for high-speed capture on modern smartphones.
 */

export const BIT_DURATION = 133; // 133ms (7.5 Hz) - Faster transfer
export const FRAME_RATE = 30;

/**
 * Preamble-v4: 
 * [0.8s CALIBRATION] + [8-bit SYNC]
 */
export const CALIBRATION_BIT_COUNT = 6; 
export const SYNC_PATTERN = [0, 0, 1, 1, 0, 1, 0, 1];

export function textToBinary(text: string): number[] {
  // 1. Fast Calibration
  const binary: number[] = Array(CALIBRATION_BIT_COUNT).fill(1);
  
  // 2. Stabilization Gap
  binary.push(0, 0);
  
  // 3. Sync Pattern
  binary.push(...SYNC_PATTERN);
  
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i);
    const charBinary = charCode.toString(2).padStart(8, '0');
    
    // Character Frame: [1] Start + [Data] + [0] Stop
    binary.push(1); 
    for (const bit of charBinary) {
      binary.push(bit === '1' ? 1 : 0);
    }
    binary.push(0);
  }
  
  // Short End-of-Stream signal
  binary.push(1, 0, 1, 0);
  return binary;
}
