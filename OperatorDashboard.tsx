
import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Map as MapIcon, 
  FileText, 
  ChevronRight, 
  QrCode, 
  Clock, 
  Target,
  CheckCircle2,
  XCircle,
  Maximize2,
  User,
  Zap,
  AlertTriangle,
  Layers,
  ChevronDown
} from 'lucide-react';
import { OperationState, Operator, Mission, MissionStatus, MissionType } from '../types.ts';
import { getRankFromScore, VALIDATION_DELAY_MS } from '../constants.ts';

interface Props {
  opState: OperationState;
  operator: Operator;
  onUpdateOperator: (op: Operator) => void;
  onUpdateMissions: (missions: Mission[]) => void;
}

const OperatorDashboard: React.FC<Props> = ({ opState, operator, onUpdateOperator, onUpdateMissions }) => {
  const [activeTab, setActiveTab] = useState<'briefing' | 'map' | 'ranking'>('briefing');
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [validationCode, setValidationCode] = useState('');
  const [feedback, setFeedback] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const canValidate = Date.now() - (operator.joinDate || Date.now()) >= VALIDATION_DELAY_MS;
  const timeRemainingForValidation = Math.max(0, Math.ceil((VALIDATION_DELAY_MS - (Date.now() - operator.joinDate)) / 1000 / 60));

  const handleValidate = (missionId: string, code: string) => {
    if (!canValidate) {
      setFeedback({ msg: `PROTOCOLO: AGUARDE ${timeRemainingForValidation} MIN`, type: 'error' });
      return;
    }
    const mission = opState.missions.find(m => m.id === missionId);
    if (mission && mission.validationCode.toUpperCase() === code.trim().toUpperCase()) {
      const updatedMissions = opState.missions.map(m => 
        m.id === missionId ? { ...m, status: MissionStatus.COMPLETED } : m
      );
      onUpdateMissions(updatedMissions);
      const newScore = operator.score + mission.points;
      onUpdateOperator({ ...operator, score: newScore, rank: getRankFromScore(newScore) });
      setFeedback({ msg: 'OBJETIVO CUMPRIDO.', type: 'success' });
      setTimeout(() => {
        setSelectedMission(null);
        setValidationCode('');
        setFeedback(null);
      }, 1500);
    } else {
      setFeedback({ msg: 'CÓDIGO INVÁLIDO.', type: 'error' });
    }
  };

  const primaryMissions = opState.missions.filter(m => !m.parentId);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Header com Alto Contraste */}
      <div className="bg-black border-4 border-amber-500 p-5 flex items-center justify-between military-clip">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 border-4 border-amber-500 flex items-center justify-center bg-amber-500">
            <User className="w-10 h-10 text-black" />
          </div>
          <div>
            <h2 className="font-orbitron font-black text-2xl text-amber-500">{operator.callsign}</h2>
            <p className="text-xs font-bold tracking-widest text-amber-500 opacity-100 uppercase bg-black px-1 inline-block">
              {operator.rank}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black">PONTOS TÁTICOS</p>
          <div className="flex items-center gap-2 justify-end">
            <Zap className="w-6 h-6 fill-amber-500" />
            <span className="font-orbitron text-4xl font-black text-amber-500">{operator.score}</span>
          </div>
        </div>
      </div>

      {/* Navegação de Abas - Botões Maiores e Sólidos */}
      <div className="flex gap-2 font-orbitron">
        {[
          { id: 'briefing', icon: FileText, label: 'MISSÕES' },
          { id: 'map', icon: MapIcon, label: 'MAPA' },
          { id: 'ranking', icon: Trophy, label: 'RANK' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-5 flex flex-col items-center justify-center gap-1 border-4 transition-all ${
              activeTab === tab.id 
                ? 'bg-amber-500 text-black border-amber-500' 
                : 'bg-black text-amber-500 border-amber-900'
            }`}
          >
            <tab.icon className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo Otimizado */}
      <div className="flex-1 overflow-auto pb-6">
        {activeTab === 'briefing' && (
          <div className="space-y-6">
            {primaryMissions.map(mission => {
              const subMissions = opState.missions.filter(m => m.parentId === mission.id);
              return (
                <div key={mission.id} className="space-y-2">
                  {/* Primary Card */}
                  <div 
                    onClick={() => mission.status === MissionStatus.ACTIVE && setSelectedMission(mission)}
                    className={`p-5 border-4 group transition-all cursor-pointer ${
                      mission.status === MissionStatus.COMPLETED 
                        ? 'border-green-600 bg-black' 
                        : 'border-amber-500 bg-black'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black px-2 py-1 border-2 bg-amber-500 text-black border-amber-500">
                        OBJETIVO PRIMÁRIO
                      </span>
                      <div className="flex items-center gap-2">
                        {mission.status === MissionStatus.COMPLETED ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <div className="flex items-center gap-1 bg-amber-500 text-black px-2 py-1 text-[10px] font-black">
                            <Clock className="w-4 h-4" /> ATIVA
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className="font-orbitron font-black text-xl mb-2 uppercase">{mission.title}</h3>
                    <div className="flex justify-between items-center border-t-2 border-amber-900 pt-3">
                       <div className="flex items-center gap-2 text-amber-500 font-black">
                         <Zap className="w-5 h-5 fill-amber-500" />
                         <span className="text-lg">+{mission.points}</span>
                       </div>
                       <div className="bg-amber-500 text-black px-3 py-1 font-black text-xs">DETALHES</div>
                    </div>
                  </div>

                  {/* Indicated Sub Missions */}
                  {subMissions.length > 0 && (
                    <div className="ml-8 space-y-2 border-l-4 border-amber-900 pl-4">
                      <p className="text-[10px] font-black text-amber-700 uppercase mb-1">Sub-objetivos táticos</p>
                      {subMissions.map(sub => (
                        <div 
                          key={sub.id}
                          onClick={() => sub.status === MissionStatus.ACTIVE && setSelectedMission(sub)}
                          className={`p-3 border-2 flex items-center justify-between cursor-pointer transition-all ${
                            sub.status === MissionStatus.COMPLETED 
                              ? 'border-green-800 bg-black' 
                              : 'border-blue-900 bg-black hover:border-blue-500'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Layers className={`w-4 h-4 ${sub.status === MissionStatus.COMPLETED ? 'text-green-500' : 'text-blue-500'}`} />
                            <div>
                              <h4 className={`text-xs font-black uppercase ${sub.status === MissionStatus.COMPLETED ? 'text-green-600' : 'text-amber-500'}`}>
                                {sub.title}
                              </h4>
                              <p className="text-[9px] font-bold text-amber-700">RECOMPENSA: +{sub.points} PT</p>
                            </div>
                          </div>
                          {sub.status === MissionStatus.COMPLETED && (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-[400px] border-4 border-amber-500 relative bg-black overflow-hidden">
            <img src={opState.mapUrl} alt="Tactical Map" className="w-full h-full object-cover grayscale brightness-150 contrast-150" />
            <div className="absolute inset-0 border-[16px] border-black/20 pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <Target className="w-16 h-16 text-amber-500 opacity-80" />
            </div>
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="space-y-3">
            {opState.operators.sort((a,b) => b.score - a.score).map((op, idx) => (
              <div key={op.id} className={`flex items-center justify-between p-4 border-4 bg-black ${op.id === operator.id ? 'border-amber-500 scale-[1.02]' : 'border-amber-900'}`}>
                <div className="flex items-center gap-5">
                  <span className="font-orbitron text-2xl font-black text-amber-900 w-10">#{idx + 1}</span>
                  <div>
                    <p className="font-black text-lg text-amber-500">{op.callsign}</p>
                    <p className="text-[10px] font-bold text-amber-700">{op.rank}</p>
                  </div>
                </div>
                <div className="bg-amber-500 text-black px-4 py-2 font-orbitron font-black text-xl">
                  {op.score}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Validação */}
      {selectedMission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-black animate-in zoom-in-95 duration-200">
          <div className="w-full h-full max-w-2xl bg-black border-[6px] border-amber-500 p-6 flex flex-col relative overflow-y-auto">
            <button 
              onClick={() => { setSelectedMission(null); setFeedback(null); setValidationCode(''); }}
              className="absolute top-4 right-4 bg-amber-500 text-black p-2"
            >
              <XCircle className="w-10 h-10" />
            </button>

            <div className="mt-8 mb-4">
              <span className={`px-3 py-1 font-black text-xs ${selectedMission.parentId ? 'bg-blue-600 text-black' : 'bg-amber-500 text-black'}`}>
                {selectedMission.parentId ? 'SUB-OBJETIVO OPERACIONAL' : 'OBJETIVO PRIMÁRIO'}
              </span>
              <h2 className="font-orbitron text-3xl font-black mt-4 text-amber-500 leading-none uppercase">{selectedMission.title}</h2>
            </div>
            
            <div className="bg-amber-900/20 border-l-8 border-amber-500 p-5 mb-6">
              <p className="text-lg font-bold leading-tight text-amber-500">
                {selectedMission.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 border-4 border-amber-500 bg-amber-500 text-black">
                <p className="text-[10px] font-black mb-1">RECOMPENSA</p>
                <div className="flex items-center gap-2 text-3xl font-black font-orbitron">
                   <Zap className="w-8 h-8 fill-black" />
                   <span>{selectedMission.points}</span>
                </div>
              </div>
              <div className="p-4 border-4 border-amber-500">
                <p className="text-[10px] font-black mb-1 text-amber-500">ALVO</p>
                <div className="flex items-center gap-2 text-2xl font-black text-amber-500">
                   <Target className="w-8 h-8" />
                   <span>VALIDAR</span>
                </div>
              </div>
            </div>

            {feedback && (
              <div className={`mb-6 p-4 border-4 font-black text-center ${
                feedback.type === 'success' ? 'border-green-500 bg-green-500 text-black' : 'border-red-500 bg-red-500 text-black'
              }`}>
                {feedback.msg}
              </div>
            )}

            <div className="mt-auto space-y-4 pb-10">
              <input 
                type="text"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
                placeholder="CÓDIGO MANUAL"
                className="w-full bg-black border-4 border-amber-500 p-5 text-center text-3xl font-black tracking-[0.3em] text-amber-500 placeholder:opacity-30 outline-none"
              />
              
              <div className="flex gap-4 h-24">
                <button 
                  onClick={() => handleValidate(selectedMission.id, validationCode)}
                  disabled={!validationCode || !canValidate}
                  className="flex-1 bg-amber-500 text-black font-orbitron font-black text-2xl disabled:opacity-30 disabled:bg-amber-900 transition-all active:scale-95 shadow-[0_6px_0_#996a00]"
                >
                  CONFIRMAR
                </button>
                <button 
                  disabled={!canValidate}
                  className="w-24 border-4 border-amber-500 flex items-center justify-center bg-black disabled:opacity-30 active:bg-amber-950"
                >
                  <QrCode className="w-12 h-12 text-amber-500" />
                </button>
              </div>

              {!canValidate && (
                <div className="flex items-center justify-center gap-2 bg-red-600 text-black p-3 font-black text-sm border-2 border-red-900">
                  <AlertTriangle className="w-5 h-5" />
                  PROTOCOLO DE SEGURANÇA: {timeRemainingForValidation}m PARA LIBERAÇÃO
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorDashboard;
