
import React, { useState, useRef, useEffect } from 'react';
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
  ChevronDown,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';
import { OperationState, Operator, Mission, MissionStatus, MissionType } from '../types';
import { getRankFromScore, VALIDATION_DELAY_MS } from '../constants';

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

  // Estados para Navegação do Mapa
  const [mapScale, setMapScale] = useState(1);
  const [mapPos, setMapPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const isMissionCompleted = (id: string) => operator.completedMissions?.includes(id);

  const canValidate = Date.now() - (operator.joinDate || Date.now()) >= VALIDATION_DELAY_MS;
  const timeRemainingForValidation = Math.max(0, Math.ceil((VALIDATION_DELAY_MS - (Date.now() - operator.joinDate)) / 1000 / 60));

  const handleValidate = (missionId: string, code: string) => {
    if (!canValidate) {
      setFeedback({ msg: `PROTOCOLO: AGUARDE ${timeRemainingForValidation} MIN`, type: 'error' });
      return;
    }

    if (isMissionCompleted(missionId)) {
      setFeedback({ msg: 'MISSÃO JÁ CONCLUÍDA POR VOCÊ.', type: 'error' });
      return;
    }

    const mission = opState.missions.find(m => m.id === missionId);
    if (mission && mission.validationCode.toUpperCase() === code.trim().toUpperCase()) {
      // Progresso Individual: Atualiza apenas o Operador
      const newScore = operator.score + mission.points;
      const newCompleted = [...(operator.completedMissions || []), missionId];
      
      onUpdateOperator({ 
        ...operator, 
        score: newScore, 
        rank: getRankFromScore(newScore),
        completedMissions: newCompleted
      });

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

  // Funções de Navegação do Mapa
  const handleZoom = (delta: number) => {
    setMapScale(prev => Math.min(Math.max(prev + delta, 0.5), 5));
  };

  const handleResetMap = () => {
    setMapScale(1);
    setMapPos({ x: 0, y: 0 });
  };

  const onMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - mapPos.x, y: clientY - mapPos.y });
  };

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setMapPos({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y
    });
  };

  const onMouseUp = () => setIsDragging(false);

  const primaryMissions = opState.missions.filter(m => !m.parentId);

  return (
    <div className="h-full flex flex-col gap-4">
      {/* HEADER HUD */}
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

      {/* TABS HUD */}
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

      {/* CONTEÚDO DINÂMICO */}
      <div className="flex-1 overflow-auto pb-6">
        {activeTab === 'briefing' && (
          <div className="space-y-6">
            {primaryMissions.map(mission => {
              const subMissions = opState.missions.filter(m => m.parentId === mission.id);
              const completed = isMissionCompleted(mission.id);
              
              return (
                <div key={mission.id} className="space-y-2">
                  <div 
                    onClick={() => !completed && setSelectedMission(mission)}
                    className={`p-5 border-4 group transition-all cursor-pointer ${
                      completed 
                        ? 'border-green-600 bg-black/40 opacity-80' 
                        : 'border-amber-500 bg-black'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-black px-2 py-1 border-2 ${completed ? 'bg-green-600 border-green-600 text-black' : 'bg-amber-500 border-amber-500 text-black'}`}>
                        OBJETIVO PRIMÁRIO
                      </span>
                      <div className="flex items-center gap-2">
                        {completed ? (
                          <div className="flex items-center gap-1 text-green-500 text-[10px] font-black uppercase">
                            <CheckCircle2 className="w-5 h-5" /> CONCLUÍDO
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-amber-500 text-black px-2 py-1 text-[10px] font-black">
                            <Clock className="w-4 h-4" /> ATIVA
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 className={`font-orbitron font-black text-xl mb-2 uppercase ${completed ? 'text-green-500' : 'text-amber-500'}`}>
                      {mission.title}
                    </h3>
                    <div className={`flex justify-between items-center border-t-2 pt-3 ${completed ? 'border-green-900' : 'border-amber-900'}`}>
                       <div className={`flex items-center gap-2 font-black ${completed ? 'text-green-700' : 'text-amber-500'}`}>
                         <Zap className={`w-5 h-5 ${completed ? 'fill-green-700' : 'fill-amber-500'}`} />
                         <span className="text-lg">+{mission.points}</span>
                       </div>
                       <div className={`${completed ? 'bg-green-900 text-green-500' : 'bg-amber-500 text-black'} px-3 py-1 font-black text-xs uppercase`}>
                         {completed ? 'VISTO' : 'DETALHES'}
                       </div>
                    </div>
                  </div>

                  {subMissions.length > 0 && (
                    <div className="ml-8 space-y-2 border-l-4 border-amber-900 pl-4">
                      {subMissions.map(sub => {
                        const subCompleted = isMissionCompleted(sub.id);
                        return (
                          <div 
                            key={sub.id}
                            onClick={() => !subCompleted && setSelectedMission(sub)}
                            className={`p-3 border-2 flex items-center justify-between cursor-pointer transition-all ${
                              subCompleted 
                                ? 'border-green-800 bg-black/20 opacity-60' 
                                : 'border-blue-900 bg-black hover:border-blue-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Layers className={`w-4 h-4 ${subCompleted ? 'text-green-500' : 'text-blue-500'}`} />
                              <div>
                                <h4 className={`text-xs font-black uppercase ${subCompleted ? 'text-green-600' : 'text-amber-500'}`}>
                                  {sub.title}
                                </h4>
                                <p className="text-[9px] font-bold text-amber-700">RECOMPENSA: +{sub.points} PT</p>
                              </div>
                            </div>
                            {subCompleted && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'map' && (
          <div className="h-[450px] border-4 border-amber-500 relative bg-black overflow-hidden military-clip select-none">
            <div className="absolute inset-0 pointer-events-none z-10 opacity-20" 
                 style={{ 
                   backgroundImage: `linear-gradient(var(--amber) 1px, transparent 1px), linear-gradient(90deg, var(--amber) 1px, transparent 1px)`,
                   backgroundSize: '40px 40px'
                 }}>
            </div>

            <div 
              ref={mapContainerRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onTouchStart={onMouseDown}
              onTouchMove={onMouseMove}
              onTouchEnd={onMouseUp}
            >
              <div 
                className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                style={{ 
                  transform: `translate(${mapPos.x}px, ${mapPos.y}px) scale(${mapScale})`
                }}
              >
                {opState.mapUrl ? (
                  <img 
                    src={opState.mapUrl} 
                    alt="Tactical Map" 
                    className="max-w-none grayscale brightness-125 contrast-125 pointer-events-none" 
                    style={{ width: 'auto', height: '100%' }}
                  />
                ) : (
                  <div className="text-amber-900 font-black uppercase flex flex-col items-center gap-4">
                    <MapIcon className="w-16 h-16 opacity-20" />
                    Aguardando Transmissão de Satélite
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-4 right-4 z-20 flex flex-col gap-2">
              <button onClick={() => handleZoom(0.2)} className="p-3 bg-black border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-colors">
                <Plus className="w-6 h-6" />
              </button>
              <button onClick={() => handleZoom(-0.2)} className="p-3 bg-black border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-colors">
                <Minus className="w-6 h-6" />
              </button>
              <button onClick={handleResetMap} className="p-3 bg-black border-2 border-amber-500 text-amber-500 hover:bg-amber-500 hover:text-black transition-colors mt-2">
                <RefreshCw className="w-6 h-6" />
              </button>
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 opacity-40">
              <div className="relative w-12 h-12">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-amber-500"></div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-amber-500"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-amber-500"></div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-0.5 bg-amber-500"></div>
                <div className="absolute inset-2 border-2 border-amber-500 rounded-full"></div>
              </div>
            </div>

            <div className="absolute top-4 left-4 z-20 bg-black/80 border-2 border-amber-900 p-2">
              <p className="text-[10px] font-black text-amber-500 uppercase">SAT_SIGNAL: {opState.mapUrl ? 'STABLE' : 'SEARCHING'}</p>
              <p className="text-[9px] font-bold text-amber-700">ZOOM: {Math.round(mapScale * 100)}%</p>
            </div>
          </div>
        )}

        {activeTab === 'ranking' && (
          <div className="space-y-3">
            {opState.operators.sort((a,b) => b.score - a.score).map((op, idx) => (
              <div key={op.id} className={`flex items-center justify-between p-4 border-4 bg-black transition-all ${op.id === operator.id ? 'border-amber-500 scale-[1.02] shadow-[0_0_15px_rgba(255,176,0,0.3)]' : 'border-amber-900'}`}>
                <div className="flex items-center gap-5">
                  <span className="font-orbitron text-2xl font-black text-amber-900 w-10">#{idx + 1}</span>
                  <div>
                    <p className="font-black text-lg text-amber-500">{op.callsign}</p>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">{op.rank}</p>
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

      {selectedMission && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-black/95 animate-in zoom-in-95 duration-200 backdrop-blur-sm">
          <div className="w-full h-full max-w-2xl bg-black border-[6px] border-amber-500 p-6 flex flex-col relative overflow-y-auto military-clip shadow-[0_0_100px_rgba(255,176,0,0.2)]">
            <button 
              onClick={() => { setSelectedMission(null); setFeedback(null); setValidationCode(''); }}
              className="absolute top-4 right-4 bg-amber-500 text-black p-2 hover:bg-amber-400 transition-colors"
            >
              <XCircle className="w-10 h-10" />
            </button>
            <div className="mt-8 mb-4">
              <span className={`px-3 py-1 font-black text-xs uppercase ${selectedMission.parentId ? 'bg-blue-600 text-black' : 'bg-amber-500 text-black'}`}>
                {selectedMission.parentId ? 'SUB-OBJETIVO OPERACIONAL' : 'OBJETIVO PRIMÁRIO'}
              </span>
              <h2 className="font-orbitron text-3xl font-black mt-4 text-amber-500 uppercase">{selectedMission.title}</h2>
            </div>
            <div className="bg-amber-900/20 border-l-8 border-amber-500 p-5 mb-6">
              <p className="text-lg font-bold text-amber-500">{selectedMission.description}</p>
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
                <p className="text-[10px] font-black mb-1 text-amber-500 uppercase">Ação Requerida</p>
                <div className="flex items-center gap-2 text-2xl font-black text-amber-500">
                   <Target className="w-8 h-8" />
                   <span>VALIDAR</span>
                </div>
              </div>
            </div>

            {feedback && (
              <div className={`p-4 mb-4 border-4 font-black uppercase text-center animate-pulse ${feedback.type === 'success' ? 'bg-green-600 border-green-900 text-black' : 'bg-red-600 border-red-900 text-black'}`}>
                {feedback.msg}
              </div>
            )}

            <div className="mt-auto space-y-4 pb-10">
              <div className="relative">
                <input 
                  type="text"
                  value={validationCode}
                  onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
                  placeholder="DIGITAR CÓDIGO HQ"
                  className="w-full bg-black border-4 border-amber-500 p-5 text-center text-3xl font-black text-amber-500 outline-none focus:bg-amber-500/5 transition-colors tracking-widest"
                />
              </div>
              <button 
                onClick={() => handleValidate(selectedMission.id, validationCode)}
                disabled={!validationCode || !canValidate}
                className="w-full bg-amber-500 text-black py-6 font-orbitron font-black text-2xl disabled:opacity-30 active:scale-95 transition-all shadow-[0_8px_0_#996a00]"
              >
                ENVIAR RELATÓRIO
              </button>
              {!canValidate && (
                <p className="text-[10px] text-amber-700 font-black text-center uppercase">
                  BLOQUEIO TEMPORÁRIO DE SEGURANÇA: {timeRemainingForValidation} MIN RESTANTES
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperatorDashboard;
