
import React, { useState, useEffect } from 'react';
import { Battery, Wifi, Clock, LogOut, Shield, Radio } from 'lucide-react';
import { AuthState } from '../types.ts';

interface Props {
  children: React.ReactNode;
  auth: AuthState;
  onLogout: () => void;
}

const HUDLayout: React.FC<Props> = ({ children, auth, onLogout }) => {
  const [time, setTime] = useState(new Date());
  const [battery, setBattery] = useState(100);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden select-none bg-black">
      {/* HUD Header Otimizado */}
      <header className="h-16 border-b-4 border-amber-500 bg-black flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <Shield className="w-8 h-8 text-amber-500" />
          <h1 className="font-orbitron font-black text-2xl tracking-tighter text-amber-500">
            COMANDOS <span className="text-xs bg-amber-500 text-black px-1 ml-2">HQ-LINK</span>
          </h1>
        </div>

        <div className="flex items-center gap-6 font-black text-xs text-amber-500">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse text-green-500" />
            <span className="hidden md:inline">SAT_LINK: UP</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>{time.toLocaleTimeString([], { hour12: false })}</span>
          </div>
          {auth.isAuthenticated && (
            <button 
              onClick={onLogout}
              className="ml-4 flex items-center gap-2 px-4 py-2 bg-amber-500 text-black font-black border-2 border-black active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span>LOGOUT</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 relative overflow-auto p-4 flex flex-col items-center">
        <div className="max-w-4xl w-full h-full">
          {children}
        </div>
      </main>

      {/* HUD Frame Borders */}
      <div className="fixed top-20 left-4 w-10 h-10 border-t-8 border-l-8 border-amber-900 pointer-events-none opacity-40"></div>
      <div className="fixed top-20 right-4 w-10 h-10 border-t-8 border-r-8 border-amber-900 pointer-events-none opacity-40"></div>
      <div className="fixed bottom-4 left-4 w-10 h-10 border-b-8 border-l-8 border-amber-900 pointer-events-none opacity-40"></div>
      <div className="fixed bottom-4 right-4 w-10 h-10 border-b-8 border-r-8 border-amber-900 pointer-events-none opacity-40"></div>
    </div>
  );
};

export default HUDLayout;
