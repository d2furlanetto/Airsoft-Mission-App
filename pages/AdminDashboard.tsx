
import React, { useState } from 'react';
import { 
  Settings, 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  RefreshCcw, 
  Target, 
  Zap, 
  Save,
  Skull,
  Upload,
  Layers,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { doc, setDoc, deleteDoc, collection } from "firebase/firestore";
import { db } from '../firebase';
import { OperationState, Mission, MissionType, MissionStatus } from '../types';

interface Props {
  opState: OperationState;
  onUpdateOp: (state: Partial<OperationState>) => void;
  onReset: () => void;
}

const AdminDashboard: React.FC<Props> = ({ opState, onUpdateOp, onReset }) => {
  const [activeView, setActiveView] = useState<'missions' | 'operators' | 'config'>('missions');
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<'none' | 'step1' | 'step2'>('none');

  const addMission = async (parentId?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newMission: any = {
      id,
      title: parentId ? 'SUB-OBJETIVO' : 'NOVO OBJETIVO',
      description: parentId ? 'DESCREVA A TAREFA SECUNDÁRIA.' : 'DESCREVA O OBJETIVO TÁTICO.',
      type: parentId ? MissionType.SECONDARY : MissionType.PRIMARY,
      status: MissionStatus.ACTIVE,
      points: parentId ? 50 : 100,
      validationCode: 'CODE-' + Math.floor(Math.random() * 9999),
      startTime: Date.now(),
      duration: 60,
    };
    
    // Only include parentId if it exists to avoid Firestore "undefined" error
    if (parentId) {
      newMission.parentId = parentId;
    }

    await setDoc(doc(db, "missions", id), newMission);
  };

  const removeMission = async (id: string) => {
    if(confirm("DELETAR MISSÃO PERMANENTEMENTE?")) {
      await deleteDoc(doc(db, "missions", id));
      // Remove sub-missões também
      const subs = opState.missions.filter(m => m.parentId === id);
      for (const sub of subs) {
        await deleteDoc(doc(db, "missions", sub.id));
      }
    }
  };

  const updateMission = async (updated: Mission) => {
    // Clean undefined fields (like optional parentId) before sending to Firestore
    const cleanData = JSON.parse(JSON.stringify(updated));
    await setDoc(doc(db, "missions", updated.id), cleanData, { merge: true });
    setEditingMission(null);
  };

  const updateOperatorScore = async (id: string, delta: number) => {
    const op = opState.operators.find(o => o.id === id);
    if (op) {
      await setDoc(doc(db, "operators", id), { score: Math.max(0, op.score + delta) }, { merge: true });
    }
  };

  const removeOperator = async (id: string) => {
    if(confirm("REMOVER OPERADOR E FORÇAR LOGOUT?")) {
      await deleteDoc(doc(db, "operators", id));
    }
  };

  const executeForcedReset = () => {
    onReset();
    setShowResetConfirm('none');
  };

  const primaryMissions = opState.missions.filter(m => !m.parentId);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-orbitron text-2xl font-black text-amber-500 uppercase flex items-center gap-3">
          <Settings className="w-8 h-8" />
          HQ COMMAND CENTER
        </h2>
        <button 
          onClick={() => setShowResetConfirm('step1')}
          className="bg-red-600 text-black px-4 py-2 font-black text-xs border-4 border-red-900 flex items-center gap-2 active:scale-95"
        >
          <RefreshCcw className="w-4 h-4" />
          FORCE RESET
        </button>
      </div>

      <div className="flex gap-2 font-orbitron">
        {[
          { id: 'missions', icon: Target, label: 'MISSÕES' },
          { id: 'operators', icon: Users, label: 'OPERADORES' },
          { id: 'config', icon: Settings, label: 'SISTEMA' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`flex-1 py-4 border-4 transition-all flex items-center justify-center gap-2 ${
              activeView === tab.id ? 'bg-amber-500 text-black border-amber-500' : 'bg-black text-amber-500 border-amber-900'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span className="font-black text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeView === 'missions' && (
          <div className="space-y-6">
             <button 
              onClick={() => addMission()}
              className="w-full py-5 border-4 border-dashed border-amber-500 bg-amber-500/10 text-amber-500 font-black font-orbitron hover:bg-amber-500 hover:text-black transition-all"
             >
                + ADICIONAR MISSÃO PRIMÁRIA
             </button>
             
             {primaryMissions.map(mission => {
               const subMissions = opState.missions.filter(m => m.parentId === mission.id);
               return (
                 <div key={mission.id} className="space-y-2">
                   {/* Primary Mission Item */}
                   <div className="p-4 border-4 border-amber-500 bg-black flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <ChevronDown className="w-6 h-6 text-amber-500" />
                        <div>
                          <h3 className="font-orbitron font-black text-amber-500 text-lg uppercase">{mission.title}</h3>
                          <p className="text-[10px] font-bold text-amber-700">CODE: {mission.validationCode} | VALOR: {mission.points} PT</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                       <button 
                        onClick={() => addMission(mission.id)} 
                        title="Adicionar Missão Secundária"
                        className="p-3 bg-blue-600 text-black"
                       >
                         <Plus className="w-5 h-5" />
                       </button>
                       <button onClick={() => setEditingMission(mission)} className="p-3 bg-amber-500 text-black"><Edit3 className="w-5 h-5" /></button>
                       <button onClick={() => removeMission(mission.id)} className="p-3 bg-red-600 text-black"><Trash2 className="w-5 h-5" /></button>
                     </div>
                   </div>

                   {/* Sub Missions List */}
                   {subMissions.length > 0 && (
                     <div className="ml-8 border-l-4 border-amber-900 pl-4 space-y-2">
                        {subMissions.map(sub => (
                           <div key={sub.id} className="p-3 border-4 border-amber-900 bg-black flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <Layers className="w-4 h-4 text-blue-500" />
                                <div>
                                  <h4 className="font-orbitron font-bold text-amber-500 text-sm uppercase">{sub.title}</h4>
                                  <p className="text-[9px] font-bold text-amber-700">CODE: {sub.validationCode} | VALOR: {sub.points} PT</p>
                                </div>
                             </div>
                             <div className="flex gap-2">
                               <button onClick={() => setEditingMission(sub)} className="p-2 bg-amber-500 text-black"><Edit3 className="w-4 h-4" /></button>
                               <button onClick={() => removeMission(sub.id)} className="p-2 bg-red-600 text-black"><Trash2 className="w-4 h-4" /></button>
                             </div>
                           </div>
                        ))}
                     </div>
                   )}
                 </div>
               );
             })}
          </div>
        )}

        {activeView === 'operators' && (
          <div className="space-y-3">
             {opState.operators.map(op => (
               <div key={op.id} className="p-4 border-4 border-amber-900 bg-black flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${op.status === 'ONLINE' ? 'bg-green-500' : 'bg-red-600'}`}></div>
                    <div>
                      <p className="font-black text-lg text-amber-500">{op.callsign}</p>
                      <p className="text-[10px] font-bold text-amber-700 uppercase">{op.rank} | SCORE: {op.score}</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => updateOperatorScore(op.id, 100)} className="px-3 py-1 border-2 border-amber-500 text-amber-500 font-black">+100</button>
                    <button onClick={() => removeOperator(op.id)} className="p-3 bg-red-600 text-black"><Skull className="w-5 h-5" /></button>
                 </div>
               </div>
             ))}
          </div>
        )}

        {activeView === 'config' && (
           <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-amber-700">NOME DA OPERAÇÃO</label>
                <input 
                  type="text" 
                  value={opState.name}
                  onChange={(e) => onUpdateOp({ name: e.target.value.toUpperCase() })}
                  className="w-full bg-black border-4 border-amber-900 p-4 text-amber-500 font-black text-xl outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-amber-700">MAPA TÁTICO (URL)</label>
                <input 
                  type="text" 
                  value={opState.mapUrl}
                  onChange={(e) => onUpdateOp({ mapUrl: e.target.value })}
                  className="w-full bg-black border-4 border-amber-900 p-4 text-amber-500 outline-none focus:border-amber-500 text-xs"
                />
              </div>
           </div>
        )}
      </div>

      {/* Modal de Dupla Confirmação de Reset */}
      {showResetConfirm !== 'none' && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4">
          <div className="w-full max-w-md border-[6px] border-red-600 bg-black p-8 flex flex-col items-center text-center space-y-6 military-clip">
            <div className="bg-red-600 text-black p-4 rounded-full animate-pulse">
              <AlertTriangle className="w-16 h-16" />
            </div>
            
            <h3 className="font-orbitron text-2xl font-black text-red-600 uppercase">
              {showResetConfirm === 'step1' ? 'PROTOCOLO DE EXCLUSÃO' : 'CONFIRMAÇÃO FINAL'}
            </h3>
            
            <p className="text-red-500 font-bold leading-tight uppercase text-sm">
              {showResetConfirm === 'step1' 
                ? 'ESTE COMANDO IRÁ RESETAR TODAS AS MISSÕES, APAGAR PONTUAÇÕES E EXPULSAR TODOS OS OPERADORES DO CAMPO.' 
                : 'AÇÃO IRREVERSÍVEL. O SISTEMA SERÁ REINICIADO AO ESTADO DE OPERAÇÃO INICIAL.'}
            </p>

            <div className="w-full space-y-3">
              {showResetConfirm === 'step1' ? (
                <button 
                  onClick={() => setShowResetConfirm('step2')}
                  className="w-full bg-red-600 text-black py-4 font-orbitron font-black text-xl active:scale-95 shadow-[0_4px_0_#991b1b]"
                >
                  PROSSEGUIR
                </button>
              ) : (
                <button 
                  onClick={executeForcedReset}
                  className="w-full bg-red-600 text-black py-4 font-orbitron font-black text-xl active:scale-95 shadow-[0_4px_0_#991b1b] animate-pulse"
                >
                  EXECUTAR RESET TOTAL
                </button>
              )}
              
              <button 
                onClick={() => setShowResetConfirm('none')}
                className="w-full border-4 border-amber-900 text-amber-700 py-3 font-black text-sm uppercase hover:text-amber-500"
              >
                CANCELAR PROTOCOLO
              </button>
            </div>
          </div>
        </div>
      )}

      {editingMission && (
        <div className="fixed inset-0 z-[110] bg-black p-4 flex items-center justify-center">
          <div className="w-full max-w-lg border-8 border-amber-500 p-8 space-y-6 bg-black shadow-2xl">
             <h2 className="font-orbitron text-2xl font-black text-amber-500 uppercase">EDITOR DE MISSÃO</h2>
             <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-black text-amber-700 uppercase">Título do Objetivo</label>
                 <input 
                    className="w-full bg-black border-4 border-amber-900 p-4 text-amber-500 font-black uppercase"
                    value={editingMission.title}
                    onChange={e => setEditingMission({...editingMission, title: e.target.value.toUpperCase()})}
                    placeholder="TÍTULO"
                 />
               </div>
               <div>
                 <label className="text-[10px] font-black text-amber-700 uppercase">Dossiê da Missão</label>
                 <textarea 
                    className="w-full bg-black border-4 border-amber-900 p-4 text-amber-500 h-24"
                    value={editingMission.description}
                    onChange={e => setEditingMission({...editingMission, description: e.target.value})}
                    placeholder="DESCRIÇÃO"
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-[10px] font-black text-amber-700 uppercase">Código de Validação</label>
                   <input 
                      className="w-full bg-black border-4 border-amber-900 p-4 text-amber-500 font-mono font-black"
                      value={editingMission.validationCode}
                      onChange={e => setEditingMission({...editingMission, validationCode: e.target.value.toUpperCase()})}
                      placeholder="CÓDIGO"
                   />
                 </div>
                 <div>
                   <label className="text-[10px] font-black text-amber-700 uppercase">Pontuação</label>
                   <input 
                      type="number"
                      className="w-full bg-black border-4 border-amber-900 p-4 text-amber-500 font-black"
                      value={editingMission.points}
                      onChange={e => setEditingMission({...editingMission, points: parseInt(e.target.value) || 0})}
                      placeholder="PONTOS"
                   />
                 </div>
               </div>
             </div>
             <div className="flex gap-4">
               <button onClick={() => updateMission(editingMission)} className="flex-1 py-4 bg-amber-500 text-black font-black text-lg shadow-[0_4px_0_#996a00]">SALVAR</button>
               <button onClick={() => setEditingMission(null)} className="flex-1 py-4 border-4 border-amber-900 text-amber-700 font-black">CANCELAR</button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
