
import React, { useState } from 'react';
import { Target, Lock, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { ADMIN_PASSWORD } from '../constants';

interface Props {
  onLogin: (user: any) => Promise<{ success: boolean; error?: string }>;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [callsign, setCallsign] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (isAdmin) {
      if (password === ADMIN_PASSWORD) {
        await onLogin({ isAdmin: true });
      } else {
        setError('PROTOCOLO: ACESSO NEGADO');
        setIsLoading(false);
      }
    } else {
      if (callsign.length < 3) {
        setError('PROTOCOLO: CALLSIGN MUITO CURTO (MIN. 3 CARAC.)');
        setIsLoading(false);
      } else {
        const result = await onLogin({ callsign: callsign.toUpperCase(), isAdmin: false });
        if (!result.success) {
          setError(result.error || 'ERRO DE AUTENTICAÇÃO');
          setIsLoading(false);
        }
        // Se sucesso, o App.tsx redirecionará via estado
      }
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-12 max-w-md mx-auto px-4">
      <div className="text-center space-y-4">
        <h2 className="font-orbitron text-5xl font-black text-amber-500 leading-none">COMANDOS</h2>
        <div className="bg-amber-500 text-black px-4 py-1 font-black text-sm tracking-widest inline-block">
          AUTENTICAÇÃO REQUERIDA
        </div>
      </div>

      <div className="w-full bg-black border-[6px] border-amber-500 p-8 military-clip">
        <form onSubmit={handleSubmit} className="space-y-8">
          {!isAdmin ? (
            <div className="space-y-3">
              <label className="text-sm font-black uppercase text-amber-500">Callsign do Operador</label>
              <div className="relative">
                <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-500" />
                <input
                  type="text"
                  value={callsign}
                  disabled={isLoading}
                  onChange={(e) => setCallsign(e.target.value)}
                  className="w-full bg-black border-4 border-amber-900 focus:border-amber-500 p-5 pl-14 text-2xl text-amber-500 outline-none uppercase font-black tracking-widest placeholder:opacity-20 disabled:opacity-50"
                  placeholder="ALPHA-1"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm font-black uppercase text-amber-500">Senha de Comando</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-amber-500" />
                <input
                  type="password"
                  value={password}
                  disabled={isLoading}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black border-4 border-amber-900 focus:border-amber-500 p-5 pl-14 text-2xl text-amber-500 outline-none font-black tracking-widest disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 bg-red-600 text-black p-4 font-black text-xs border-4 border-red-900 animate-pulse">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-amber-500 text-black py-6 font-orbitron font-black text-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_8px_0_#996a00] disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <span>ENTRAR</span>
                <ChevronRight className="w-8 h-8" />
              </>
            )}
          </button>
        </form>

        <button
          onClick={() => { setIsAdmin(!isAdmin); setError(''); }}
          disabled={isLoading}
          className="w-full mt-10 p-3 bg-black border-2 border-amber-900 text-amber-700 font-black text-xs uppercase hover:text-amber-500 transition-colors disabled:opacity-30"
        >
          {isAdmin ? 'MUDAR PARA OPERADOR' : 'MUDAR PARA HQ ADMIN'}
        </button>
      </div>

      <p className="text-[10px] text-amber-900 font-black text-center uppercase tracking-tighter">
        SISTEMA PROTEGIDO POR CRIPTOGRAFIA DE NÍVEL MILITAR.<br/>
        VIGILÂNCIA DE CAMPO ATIVA.
      </p>
    </div>
  );
};

export default Login;
