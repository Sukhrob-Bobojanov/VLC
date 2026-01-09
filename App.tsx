
import React, { useState, useEffect } from 'react';
import { AppMode, DecodedMessage } from './types';
import Transmitter from './components/Transmitter';
import Receiver from './components/Receiver';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.IDLE);
  const [message, setMessage] = useState('SECURE-LINK-ESTABLISHED');
  const [logs, setLogs] = useState<DecodedMessage[]>([]);

  const handleMessage = (msg: DecodedMessage) => {
    setLogs(prev => [msg, ...prev]);
  };

  return (
    <div className="min-h-screen bg-cyber-bg flex flex-col items-center px-4 py-6 md:p-12">
      {/* Responsive Header */}
      <header className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8 md:mb-12">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-white flex items-center justify-center rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.2)] flex-shrink-0">
            <i className="fas fa-signature text-black text-2xl md:text-3xl"></i>
          </div>
          <div>
             <h1 className="text-2xl md:text-4xl font-black italic tracking-tighter leading-none mb-1">LuxSignal <span className="text-cyber-accent">VLC</span></h1>
             <p className="text-[9px] md:text-[10px] font-mono text-slate-600 tracking-[0.2em] md:tracking-[0.4em] uppercase">Optical Data Bridge</p>
          </div>
        </div>
        
        <div className="w-full sm:w-auto flex flex-row sm:flex-col justify-between items-center sm:items-end border-t border-white/5 pt-4 sm:pt-0 sm:border-0">
          <div className="text-[9px] font-mono text-cyber-accent uppercase tracking-widest mb-1">System Status</div>
          <div className="flex items-center gap-2 justify-end">
             <span className="w-2 h-2 bg-cyber-success rounded-full animate-pulse"></span>
             <span className="text-[10px] md:text-xs font-bold font-mono">ENCRYPT_READY</span>
          </div>
        </div>
      </header>

      {/* Main Command Center - Grid that stacks on mobile */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
        
        {/* Left Control Column */}
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
           <section className="glass-panel rounded-3xl p-6 md:p-8">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4 md:mb-6">Device Role</h2>
              <div className="grid grid-cols-1 gap-3 md:gap-4">
                 <button 
                  onClick={() => setMode(AppMode.TRANSMIT)}
                  className={`group p-4 md:p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    mode === AppMode.TRANSMIT ? 'border-white bg-white/5' : 'border-slate-800 hover:border-slate-700'
                  }`}
                 >
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-colors ${mode === AppMode.TRANSMIT ? 'bg-white text-black' : 'bg-slate-900 text-slate-500'}`}>
                       <i className="fas fa-upload text-lg md:text-xl"></i>
                    </div>
                    <div className="text-left">
                       <div className={`font-black text-base md:text-lg ${mode === AppMode.TRANSMIT ? 'text-white' : 'text-slate-500'}`}>TRANSMITTER</div>
                       <div className="text-[8px] md:text-[9px] text-slate-600 font-mono">BEAM OPTICAL DATA</div>
                    </div>
                 </button>

                 <button 
                  onClick={() => setMode(AppMode.RECEIVE)}
                  className={`group p-4 md:p-6 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                    mode === AppMode.RECEIVE ? 'border-cyber-accent bg-cyber-accent/5' : 'border-slate-800 hover:border-slate-700'
                  }`}
                 >
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-colors ${mode === AppMode.RECEIVE ? 'bg-cyber-accent text-black' : 'bg-slate-900 text-slate-500'}`}>
                       <i className="fas fa-download text-lg md:text-xl"></i>
                    </div>
                    <div className="text-left">
                       <div className={`font-black text-base md:text-lg ${mode === AppMode.RECEIVE ? 'text-cyber-accent' : 'text-slate-500'}`}>RECEIVER UNIT</div>
                       <div className="text-[8px] md:text-[9px] text-slate-600 font-mono">CAPTURE PULSE STREAM</div>
                    </div>
                 </button>
              </div>
           </section>

           {mode === AppMode.TRANSMIT && (
             <section className="glass-panel rounded-3xl p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Payload Content</h2>
                <textarea 
                  value={message}
                  onChange={(e) => setMessage(e.target.value.toUpperCase().slice(0, 100))}
                  className="w-full h-24 bg-black/50 border border-slate-800 rounded-xl p-4 text-white font-mono text-sm focus:outline-none focus:border-cyber-accent transition-colors resize-none"
                  placeholder="ENTER SECURE STRING..."
                />
                <div className="mt-2 text-[8px] md:text-[9px] text-slate-600 font-mono flex justify-between uppercase">
                   <span>Capacity: 100 chars</span>
                   <span>Hardware: AES-256 Mock</span>
                </div>
             </section>
           )}

           <section className="glass-panel rounded-3xl p-6 md:p-8 flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Interception Log</h2>
                <button onClick={() => setLogs([])} className="text-[10px] font-bold text-cyber-danger uppercase hover:underline">Flush</button>
              </div>
              <div className="space-y-4 max-h-[300px] md:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.length === 0 ? (
                  <div className="text-center py-12 md:py-20 opacity-20 flex flex-col items-center">
                    <i className="fas fa-radar text-3xl md:text-4xl mb-4"></i>
                    <span className="text-[10px] font-mono uppercase tracking-widest">Awaiting Link Establishment...</span>
                  </div>
                ) : (
                  logs.map(log => (
                    <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/10 animate-in zoom-in-95">
                      <div className="flex justify-between text-[8px] font-mono text-slate-500 mb-2 uppercase tracking-tighter">
                         <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                         <span className={log.confidence > 0.8 ? 'text-cyber-success' : 'text-cyber-danger'}>Confidence: {Math.round(log.confidence * 100)}%</span>
                      </div>
                      <div className="text-base md:text-lg font-black font-mono tracking-tighter text-white break-words">{log.text}</div>
                    </div>
                  ))
                )}
              </div>
           </section>
        </div>

        {/* Right Active Channel Column - Stays on top or scrolls with stack */}
        <div className="lg:col-span-8 order-first lg:order-last">
           <div className="min-h-[400px] md:min-h-[600px] lg:h-full glass-panel rounded-[2.5rem] relative flex items-center justify-center overflow-hidden">
              {mode === AppMode.IDLE && (
                <div className="text-center space-y-6 md:space-y-8 max-w-sm md:max-w-md p-8 md:p-12">
                   <div className="relative inline-block">
                      <div className="w-24 h-24 md:w-32 md:h-32 border-2 border-dashed border-slate-800 rounded-full animate-[spin_20s_linear_infinite]"></div>
                      <i className="fas fa-satellite-dish text-4xl md:text-6xl text-slate-800 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"></i>
                   </div>
                   <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Select Interface Role</h2>
                   <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">
                     LuxSignal uses point-to-point optical pulses to exchange data without radio interference. 
                     Align hardware sensors to begin.
                   </p>
                </div>
              )}

              {mode === AppMode.TRANSMIT && <Transmitter message={message} onFinished={() => {}} />}
              {mode === AppMode.RECEIVE && <Receiver onMessageReceived={handleMessage} />}
           </div>
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="w-full max-w-6xl mt-12 mb-8 pt-8 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-[8px] md:text-[9px] font-mono text-slate-700 uppercase tracking-[0.3em] md:tracking-[0.5em] text-center sm:text-left">
         <span>VLC CORE v4.2.0-PRODUCTION</span>
         <span className="hidden lg:inline">PROPRIETARY OPTICAL BRIDGE PROTOCOL</span>
         <span>&copy; 2025 LUXSIGNAL</span>
      </footer>
    </div>
  );
};

export default App;
