
import React, { useState, useCallback, useRef } from 'react';
import { textToBinary, BIT_DURATION } from '../utils/encoding';

interface TransmitterProps {
  message: string;
  onFinished: () => void;
}

const Transmitter: React.FC<TransmitterProps> = ({ message, onFinished }) => {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentBit, setCurrentBit] = useState<number | null>(null);
  const [useScreen, setUseScreen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const setTorch = async (on: boolean) => {
    try {
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
      }
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities: any = track.getCapabilities();
      if (capabilities.torch) {
        await track.applyConstraints({ advanced: [{ torch: on }] } as any);
      }
    } catch (err) {
      if (!useScreen) setUseScreen(true);
    }
  };

  const runTransmission = async () => {
    if (isTransmitting) return;
    setIsTransmitting(true);
    const bits = textToBinary(message.toUpperCase());
    
    for (let i = 0; i < bits.length; i++) {
      const bit = bits[i];
      setCurrentBit(bit);
      setProgress((i / bits.length) * 100);
      
      if (!useScreen) await setTorch(bit === 1);
      
      await new Promise(r => setTimeout(r, BIT_DURATION));
    }
    
    await setTorch(false);
    setCurrentBit(null);
    setProgress(100);
    setIsTransmitting(false);
    onFinished();
    if ('vibrate' in navigator) navigator.vibrate([150, 50, 150]);
  };

  return (
    <div className={`flex flex-col h-full w-full items-center justify-center p-6 md:p-8 transition-all duration-75 ${
      (useScreen && currentBit === 1) ? 'bg-white' : 'bg-black'
    }`}>
      {/* HUD Info */}
      <div className="absolute top-8 left-8 md:top-12 md:left-12 flex flex-col gap-1">
        <div className="text-[8px] md:text-[10px] font-black text-cyber-accent uppercase tracking-widest leading-none">Optical Uplink</div>
        <div className="text-2xl md:text-4xl font-black italic tracking-tighter text-white">VLC_04</div>
      </div>

      {/* Transmitter Core Visualizer */}
      <div className="relative mb-12 md:mb-20">
        <div className={`w-48 h-48 md:w-64 md:h-64 rounded-[2.5rem] md:rounded-[3rem] border-2 transition-all duration-75 flex items-center justify-center ${
          currentBit === 1 
            ? 'bg-white border-white scale-110 shadow-[0_0_80px_rgba(255,255,255,0.6)]' 
            : 'bg-black border-white/5 shadow-inner'
        }`}>
          <div className={`w-24 h-24 md:w-32 md:h-32 rounded-2xl border-4 transition-transform duration-75 ${
            currentBit === 1 ? 'border-black scale-90 rotate-45' : 'border-white/10 rotate-0'
          }`}></div>
        </div>
      </div>

      {/* Control Surface */}
      <div className="w-full max-w-sm space-y-6 md:space-y-8 bg-white/5 p-6 md:p-8 rounded-[2rem] border border-white/5">
        <div className="flex justify-between items-end">
          <div>
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Payload Stream</div>
            <div className="text-[10px] md:text-xs font-bold text-white uppercase">{isTransmitting ? 'TRANSMITTING...' : 'READY'}</div>
          </div>
          <div className="text-right">
             <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mb-1">Clock</div>
             <div className="text-[10px] md:text-xs font-bold text-cyber-accent">7.5Hz (RAPID)</div>
          </div>
        </div>

        <div className="h-1 w-full bg-black rounded-full overflow-hidden border border-white/5">
          <div className="h-full bg-cyber-accent transition-all duration-100 shadow-[0_0_10px_#00f2ff]" style={{ width: `${progress}%` }}></div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <button 
            onClick={() => setUseScreen(!useScreen)}
            className={`py-3 md:py-4 rounded-xl md:rounded-2xl border font-black text-[8px] md:text-[9px] uppercase tracking-[0.1em] md:tracking-[0.2em] transition-all ${
              useScreen ? 'bg-cyber-accent text-black border-cyber-accent' : 'bg-transparent text-slate-500 border-white/10'
            }`}
          >
            {useScreen ? 'SCREEN: ON' : 'USE SCREEN'}
          </button>
          
          <button 
            onClick={runTransmission}
            disabled={isTransmitting}
            className="bg-white text-black py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[8px] md:text-[9px] uppercase tracking-[0.1em] md:tracking-[0.2em] hover:bg-cyber-accent transition-all disabled:opacity-20 shadow-xl"
          >
            {isTransmitting ? 'TX_ACTIVE' : 'START_BEAM'}
          </button>
        </div>
      </div>

      <div className="mt-8 md:mt-12 text-center text-[8px] md:text-[9px] font-mono text-slate-700 uppercase tracking-widest leading-loose">
        Protocol Status: SECURE<br/>
        Hardware Lock: RAPID_ISO-VLC
      </div>
    </div>
  );
};

export default Transmitter;
