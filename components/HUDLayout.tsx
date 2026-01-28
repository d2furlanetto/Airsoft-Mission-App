
import React, { useState, useEffect } from 'react';
import { Clock, LogOut, Shield, Radio } from 'lucide-react';
import { AuthState } from '../types';

interface Props {
  children: React.ReactNode;
  auth: AuthState;
  onLogout: () => void;
}

const HUDLayout: React.FC<Props> = ({ children, auth, onLogout }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-screen w-screen flex flex-col overflow-hidden select-none bg-black">
      <header className="h-16 border-b-4 border-amber-500 bg-black flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-4">
          <Shield className="w-8 h-8 text-amber-500" />
          <h1 className="font-orbitron font-black text-2xl text-amber-500">COMANDOS</h1>
        </div>
        <div className="flex items-center gap-6 text-amber-500">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 animate-pulse text-green-500" />
            <span className="text-xs font-black">SAT_LINK: UP</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span className="font-black">{time.toLocaleTimeString([], { hour12: false })}</span>
          </div>
          {auth.isAuthenticated && (
            <button onClick={onLogout} className="bg-amber-500 text-black px-4 py-2 font-black border-2 border-black">LOGOUT</button>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4 flex justify-center">
        <div className="max-w-4xl w-full">{children}</div>
      </main>
    </div>
  );
};

export default HUDLayout;
