
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SignalStatus, DecodedMessage } from '../types';
import { GeminiVLCService } from '../services/geminiService';
import { FRAME_RATE } from '../utils/encoding';

const ROI_SIZE = 120;
const HISTORY_SIZE = 60; // Shorter history for faster adaptation
const SILENCE_THRESHOLD = 25; // Trigger decoding after ~0.8s of silence (down from 3.3s)

const Receiver: React.FC<{ onMessageReceived: (msg: DecodedMessage) => void }> = ({ onMessageReceived }) => {
  const [status, setStatus] = useState<SignalStatus>(SignalStatus.WAITING);
  const [isArmed, setIsArmed] = useState(false);
  const [luma, setLuma] = useState(0);
  const [snr, setSnr] = useState(0);
  const [history, setHistory] = useState<number[]>([]);
  const [bitBuffer, setBitBuffer] = useState<number[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<number[]>([]);
  const captureBufferRef = useRef<number[]>([]);
  const inactivityRef = useRef(0);
  const gemini = useRef(new GeminiVLCService());

  const setupCamera = async () => {
    try {
      const constraints = {
        video: { 
          facingMode: 'environment', 
          width: { ideal: 1280 },
          frameRate: { ideal: 60 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        setTimeout(async () => {
          const track = stream.getVideoTracks()[0];
          const caps: any = track.getCapabilities();
          const settings: any = {};
          
          if (caps.exposureMode?.includes('manual')) settings.exposureMode = 'manual';
          if (caps.focusMode?.includes('manual')) settings.focusMode = 'manual';
          
          if (Object.keys(settings).length > 0) {
            try { await track.applyConstraints({ advanced: [settings] } as any); } catch(e) {}
          }
        }, 800);
      }
    } catch (e) {
      console.error("Camera Hardware Error:", e);
    }
  };

  const triggerDecode = async () => {
    // Only decode if we have a reasonable amount of data
    if (captureBufferRef.current.length < 30) {
      resetLink();
      return;
    }
    
    setStatus(SignalStatus.DECODING);
    setIsArmed(false);
    
    const bitString = captureBufferRef.current.join('');
    // Reset capture buffer immediately so we don't process it twice
    const samplesToProcess = bitString;
    captureBufferRef.current = []; 

    const result = await gemini.current.reconstructMessage(samplesToProcess);
    
    if (result.confidence > 0.3) {
      if ('vibrate' in navigator) navigator.vibrate([80, 40, 80]); 
      onMessageReceived({
        id: Math.random().toString(36).substr(2, 9),
        text: result.text,
        timestamp: Date.now(),
        confidence: result.confidence
      });
    }

    resetLink();
  };

  const resetLink = () => {
    captureBufferRef.current = [];
    inactivityRef.current = 0;
    setBitBuffer([]);
    setStatus(SignalStatus.WAITING);
  };

  const processFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || status === SignalStatus.DECODING) return;
    
    const video = videoRef.current;
    if (video.videoWidth === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const startX = (video.videoWidth - ROI_SIZE) / 2;
    const startY = (video.videoHeight - ROI_SIZE) / 2;
    ctx.drawImage(video, startX, startY, ROI_SIZE, ROI_SIZE, 0, 0, ROI_SIZE, ROI_SIZE);
    
    const { data } = ctx.getImageData(0, 0, ROI_SIZE, ROI_SIZE);
    let peak = 0;
    for (let i = 0; i < data.length; i += 4) {
      const val = (0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
      if (val > peak) peak = val;
    }

    setLuma(peak);
    historyRef.current.push(peak);
    if (historyRef.current.length > HISTORY_SIZE) historyRef.current.shift();
    setHistory([...historyRef.current]);

    const sorted = [...historyRef.current].sort((a, b) => a - b);
    const low = sorted[Math.floor(sorted.length * 0.1)] || 0;
    const high = sorted[Math.floor(sorted.length * 0.9)] || 0;
    const delta = high - low;
    setSnr(delta);

    const threshold = low + (delta * 0.55); // Slightly higher threshold for faster bits
    const bit = (delta > 35 && peak > threshold) ? 1 : 0;

    if (isArmed) {
      if (status === SignalStatus.WAITING && delta > 50) {
        // Shorter validation for start of stream
        const recent = historyRef.current.slice(-6); 
        if (recent.every(v => v > threshold)) {
          setStatus(SignalStatus.RECEIVING);
          if ('vibrate' in navigator) navigator.vibrate(30);
        }
      } else if (status === SignalStatus.RECEIVING) {
        captureBufferRef.current.push(bit);
        if (captureBufferRef.current.length % 5 === 0) {
          setBitBuffer([...captureBufferRef.current.slice(-40)]);
        }
        
        if (bit === 0) inactivityRef.current++;
        else inactivityRef.current = 0;

        // Fast trigger on silence
        if (inactivityRef.current > SILENCE_THRESHOLD) {
          triggerDecode();
        }
      }
    }
  }, [isArmed, status]);

  useEffect(() => {
    setupCamera();
    const timer = setInterval(processFrame, 1000 / FRAME_RATE);
    return () => clearInterval(timer);
  }, [processFrame]);

  const signalQuality = useMemo(() => {
    if (snr < 30) return { label: 'LOW', color: 'text-cyber-danger' };
    if (snr < 60) return { label: 'MID', color: 'text-yellow-400' };
    return { label: 'EXCELLENT', color: 'text-cyber-success' };
  }, [snr]);

  return (
    <div className="flex flex-col items-center glass-panel rounded-[2rem] md:rounded-[3rem] p-6 md:p-8 w-full max-w-md relative overflow-hidden border-white/5 shadow-2xl">
      <div className="absolute inset-0 scanline pointer-events-none opacity-20"></div>

      <div className="w-full flex justify-between items-end mb-6 md:mb-8 relative z-10">
        <div>
          <h3 className="text-xl md:text-3xl font-black italic text-white tracking-tighter leading-none mb-2">SIGNAL_LAB</h3>
          <div className="flex gap-2 items-center">
             <div className={`px-2 py-0.5 rounded bg-black/50 border border-white/10 text-[8px] font-mono ${signalQuality.color}`}>
                SNR_{signalQuality.label}
             </div>
             <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">RAPID_MODE</div>
          </div>
        </div>
        <div className={`px-4 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl border bg-black/60 transition-all duration-500 ${
          isArmed ? 'border-cyber-accent text-cyber-accent scale-105' : 'border-slate-800 text-slate-500'
        }`}>
          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.2em]">{status}</span>
        </div>
      </div>

      <div className="relative w-full aspect-square bg-slate-950 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden mb-6 md:mb-8 border border-white/5 shadow-2xl group">
        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-all duration-1000 ${
          isArmed ? 'opacity-100 contrast-125' : 'opacity-20 grayscale blur-lg'
        }`} />
        <canvas ref={canvasRef} width={ROI_SIZE} height={ROI_SIZE} className="hidden" />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <div className={`w-24 h-24 md:w-32 md:h-32 border-2 rounded-full transition-all duration-500 ${
             snr > 50 ? 'border-cyber-success scale-110' : 'border-white/10'
           }`}>
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-3 md:h-4 bg-cyber-accent/50"></div>
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-3 md:h-4 bg-cyber-accent/50"></div>
             <div className="absolute left-0 top-1/2 -translate-y-1/2 w-3 md:h-4 h-1 bg-cyber-accent/50"></div>
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 md:h-4 h-1 bg-cyber-accent/50"></div>
           </div>
           
           <div className={`w-3 h-3 md:w-4 md:h-4 rounded-full transition-all duration-150 ${
             snr > 50 ? 'bg-cyber-success shadow-[0_0_20px_#00ff9d]' : 'bg-white/10'
           }`}></div>
        </div>

        <div className="absolute bottom-4 md:bottom-8 left-0 right-0 px-6 md:px-10 text-center">
           {!isArmed ? (
             <div className="text-[9px] font-black text-white/40 uppercase tracking-widest animate-pulse">ARM_SENSOR</div>
           ) : status === SignalStatus.WAITING ? (
             <div className="text-[9px] font-black text-cyber-accent uppercase tracking-widest">ALIGING...</div>
           ) : (
             <div className="flex justify-center gap-0.5 md:gap-1 h-3 md:h-4">
                {bitBuffer.map((b, i) => (
                  <div key={i} className={`w-0.5 md:w-1 rounded-full ${b === 1 ? 'bg-cyber-accent' : 'bg-white/10'}`}></div>
                ))}
             </div>
           )}
        </div>
      </div>

      <div className="w-full space-y-4">
        <button
          onClick={() => {
            if (isArmed) resetLink();
            setIsArmed(!isArmed);
          }}
          disabled={status === SignalStatus.DECODING}
          className={`w-full py-4 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase italic tracking-[0.3em] md:tracking-[0.6em] transition-all relative overflow-hidden group shadow-2xl ${
            isArmed 
              ? 'bg-cyber-danger text-white' 
              : 'bg-cyber-accent text-black hover:scale-105 active:scale-95'
          } disabled:opacity-50`}
        >
          <span className="relative z-10 text-[10px] md:text-base">
            {status === SignalStatus.DECODING ? 'Quantizing...' : isArmed ? 'Terminate' : 'Initialize'}
          </span>
        </button>

        <p className="text-center text-[8px] font-mono text-slate-600 uppercase tracking-widest">
          Hardware: Silicon-Optic v4.0 (RAPID)
        </p>
      </div>

      {status === SignalStatus.DECODING && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/95 backdrop-blur-3xl">
           <div className="relative mb-8 md:mb-12">
              <div className="w-32 h-32 md:w-48 md:h-48 border-[1px] border-white/10 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                 <i className="fas fa-microchip text-4xl md:text-6xl text-cyber-accent animate-pulse"></i>
              </div>
           </div>
           <h4 className="text-2xl md:text-4xl font-black italic tracking-tighter text-white mb-2">NEURAL_DECODE</h4>
           <p className="text-cyber-accent text-[9px] md:text-[10px] font-mono animate-pulse tracking-[0.6em] md:tracking-[0.8em] uppercase text-center px-4">Processing Optical Bits...</p>
        </div>
      )}
    </div>
  );
};

export default Receiver;
