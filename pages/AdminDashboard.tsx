
import React, { useState } from 'react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Target, 
  Zap, 
  AlertTriangle,
  XCircle,
  Save
} from 'lucide-react';
import { doc, setDoc, deleteDoc, writeBatch } from "firebase/firestore";
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
  const [showResetConfirm, setShowResetConfirm] = useState<'none' | 'step1'>('none');

  const addMission = async (parentId?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newMission: any = {
      id,
      title: parentId ? 'SUB-OBJETIVO' : 'NOVO OBJETIVO',
      description: parentId ? 'TAREFA SECUNDÁRIA.' : 'OBJETIVO TÁTICO.',
      type: parentId ? MissionType.SECONDARY : MissionType.PRIMARY,
      status: MissionStatus.ACTIVE,
      points: parentId ? 50 : 100,
      validationCode: 'CODE-' + Math.floor(1000 + Math.random() * 9000),
      startTime: Date.now(),
      duration: 60,
    };
    if (parentId) newMission.parentId = parentId;
    
    try {
      await setDoc(doc(db, "missions", id), newMission);
    } catch (error) {
      console.error("Erro ao criar missão:", error);
      alert("ERRO NO ACESSO AO BANCO DE DADOS");
    }
  };

  const removeMission = async (id: string) => {
    // Busca a missão no estado atual para confirmar se existe
    const targetMission = opState.missions.find(m => m.id === id);
    if (!targetMission) {
      alert("ERRO: MISSÃO NÃO ENCONTRADA NO SISTEMA");
      return;
    }

    const confirmMsg = targetMission.parentId 
      ? "CONFIRMAR EXCLUSÃO DO SUB-OBJETIVO?" 
      : "ALERTA CRÍTICO: EXCLUIR OBJETIVO E TODOS OS SUB-OBJETIVOS VINCULADOS?";

    if (window.confirm(confirmMsg)) {
      try {
        const batch = writeBatch(db);
        
        // Deleta a missão alvo
        const targetRef = doc(db, "missions", id);
        batch.delete(targetRef);
        
        // Se for uma missão primária, busca e deleta todos os sub-objetivos
        if (!targetMission.parentId) {
          const subMissions = opState.missions.filter(m => m.parentId === id);
          subMissions.forEach(sub => {
            const subRef = doc(db, "missions", sub.id);
            batch.delete(subRef);
          });
        }
        
        // Aplica as mudanças no Firestore
        await batch.commit();
        console.log(`Missão ${id} removida com sucesso.`);
      } catch (error) {
        console.error("Erro ao remover missão:", error);
        alert("FALHA NO PROTOCOLO: NÃO FOI POSSÍVEL APAGAR OS DADOS DO HQ");
      }
    }
  };

  const updateMission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMission) return;
    
    try {
      const cleanData = JSON.parse(JSON.stringify(editingMission));
      await setDoc(doc(db, "missions", editingMission.id), cleanData, { merge: true });
      setEditingMission(null);
    } catch (error) {
      console.error("Erro ao atualizar missão:", error);
      alert("ERRO NA TRANSMISSÃO DE DADOS");
    }
  };

  const primaryMissions = opState.missions.filter(m => !m.parentId);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="font-orbitron text-2xl font-black text-amber-500 uppercase flex items-center gap-3">
          <Settings className="w-8 h-8" /> HQ CENTER
        </h2>
        <button 
          onClick={() => setShowResetConfirm('step1')}
          className="bg-red-600 text-black px-4 py-2 font-black text-xs border-4 border-red-900 uppercase active:scale-95 transition-transform"
        >
          Force Reset
        </button>
      </div>

      <div className="flex gap-2 font-orbitron">
        {['missions', 'operators', 'config'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveView(tab as any)}
            className={`flex-1 py-4 border-4 transition-all ${
              activeView === tab ? 'bg-amber-500 text-black border-amber-500' : 'bg-black text-amber-500 border-amber-900'
            }`}
          >
            <span className="font-black text-xs uppercase">{tab}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto pr-1">
        {activeView === 'missions' && (
          <div className="space-y-6">
             <button 
               onClick={() => addMission()} 
               className="w-full py-5 border-4 border-dashed border-amber-500 bg-amber-500/10 text-amber-500 font-black font-orbitron hover:bg-amber-500/20 active:scale-[0.99] transition-all"
             >
               + CRIAR MISSÃO PRIMÁRIA
             </button>
             
             {primaryMissions.length === 0 && (
               <div className="py-20 text-center border-4 border-amber-900/30">
                 <p className="text-amber-900 font-black uppercase tracking-widest">Nenhuma missão tática ativa</p>
               </div>
             )}

             {primaryMissions.map(mission => (
               <div key={mission.id} className="space-y-2">
                 <div className="p-4 border-4 border-amber-500 bg-black flex items-center justify-between group">
                   <div className="flex flex-col">
                     <span className="text-[10px] font-black text-amber-700 uppercase">OBJETIVO ID: {mission.id}</span>
                     <h3 className="font-orbitron font-black text-amber-500 uppercase text-lg">{mission.title}</h3>
                   </div>
                   <div className="flex gap-2">
                     <button title="Adicionar Sub-objetivo" onClick={() => addMission(mission.id)} className="p-3 bg-blue-600 text-black hover:bg-blue-400 active:scale-90 transition-all"><Plus /></button>
                     <button title="Editar Objetivo" onClick={() => setEditingMission(mission)} className="p-3 bg-amber-500 text-black hover:bg-amber-400 active:scale-90 transition-all"><Edit3 /></button>
                     <button title="Apagar Objetivo" onClick={() => removeMission(mission.id)} className="p-3 bg-red-600 text-black hover:bg-red-400 active:scale-90 transition-all"><Trash2 /></button>
                   </div>
                 </div>

                 {/* Lista de Sub-missões */}
                 <div className="ml-8 space-y-2 border-l-4 border-amber-900 pl-4">
                    {opState.missions.filter(m => m.parentId === mission.id).map(sub => (
                      <div key={sub.id} className="p-3 border-2 border-amber-900 bg-black flex items-center justify-between hover:border-amber-600 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-amber-600 rotate-45"></div>
                          <span className="text-sm font-black text-amber-600 uppercase">{sub.title}</span>
                        </div>
                        <div className="flex gap-2 scale-90">
                          <button onClick={() => setEditingMission(sub)} className="p-2 bg-amber-500 text-black hover:bg-amber-400 active:scale-90 transition-all"><Edit3 /></button>
                          <button onClick={() => removeMission(sub.id)} className="p-2 bg-red-600 text-black hover:bg-red-400 active:scale-90 transition-all"><Trash2 /></button>
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
             ))}
          </div>
        )}

        {activeView === 'operators' && (
          <div className="space-y-3">
             {opState.operators.length === 0 && (
               <div className="text-center py-20 border-4 border-amber-900/30">
                 <p className="text-amber-900 py-2 font-black uppercase">Sinal de rádio perdido: Nenhum operador online</p>
               </div>
             )}
             {opState.operators.map(op => (
               <div key={op.id} className="p-4 border-4 border-amber-900 bg-black flex items-center justify-between hover:border-amber-500 transition-colors">
                 <div>
                   <p className="font-black text-amber-500 text-lg">{op.callsign}</p>
                   <p className="text-[10px] text-amber-700 font-bold uppercase tracking-widest">{op.rank} | STATUS: {op.status}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-xs font-black text-amber-700 uppercase">Score</p>
                   <p className="text-2xl font-black text-amber-500">{op.score} PT</p>
                 </div>
               </div>
             ))}
          </div>
        )}

        {activeView === 'config' && (
          <div className="space-y-6 bg-black border-4 border-amber-900 p-6 military-clip">
            <h3 className="font-orbitron font-black text-amber-500 text-xl border-b-2 border-amber-900 pb-2">PARÂMETROS DA OPERAÇÃO</h3>
            <div className="space-y-2">
              <label className="text-xs font-black text-amber-500 uppercase">Designação da Operação</label>
              <input 
                type="text" 
                value={opState.name} 
                onChange={(e) => onUpdateOp({ name: e.target.value })}
                className="w-full bg-black border-4 border-amber-500 p-4 text-amber-500 font-black focus:bg-amber-500/5 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-amber-500 uppercase">Fonte do Mapa Tático (URL)</label>
              <input 
                type="text" 
                value={opState.mapUrl} 
                onChange={(e) => onUpdateOp({ mapUrl: e.target.value })}
                className="w-full bg-black border-4 border-amber-500 p-4 text-amber-500 font-black focus:bg-amber-500/5 outline-none"
              />
            </div>
            <p className="text-[10px] text-amber-900 font-bold uppercase mt-4">Alterações no HQ são propagadas em tempo real para todos os terminais de campo.</p>
          </div>
        )}
      </div>

      {/* MODAL DE EDIÇÃO DE MISSÃO */}
      {editingMission && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-black border-[6px] border-amber-500 p-8 military-clip flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(255,176,0,0.2)]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-orbitron text-2xl font-black text-amber-500 uppercase">EDITAR CONFIGURAÇÃO</h2>
              <button onClick={() => setEditingMission(null)} className="text-amber-500 hover:text-amber-300 transition-colors">
                <XCircle className="w-10 h-10" />
              </button>
            </div>

            <form onSubmit={updateMission} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-xs font-black text-amber-500 uppercase">Título do Objetivo</label>
                <input 
                  type="text" 
                  value={editingMission.title}
                  onChange={(e) => setEditingMission({...editingMission, title: e.target.value})}
                  className="w-full bg-black border-4 border-amber-900 focus:border-amber-500 p-4 text-amber-500 font-black outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-amber-500 uppercase">Briefing de Campo</label>
                <textarea 
                  value={editingMission.description}
                  onChange={(e) => setEditingMission({...editingMission, description: e.target.value})}
                  className="w-full bg-black border-4 border-amber-900 focus:border-amber-500 p-4 text-amber-500 font-black outline-none h-32 resize-none transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-amber-500 uppercase">Recompensa (PT)</label>
                  <div className="relative">
                    <Zap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                    <input 
                      type="number" 
                      value={editingMission.points}
                      onChange={(e) => setEditingMission({...editingMission, points: parseInt(e.target.value) || 0})}
                      className="w-full bg-black border-4 border-amber-900 focus:border-amber-500 p-4 pl-12 text-amber-500 font-black outline-none transition-colors"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-amber-500 uppercase">Código de Conclusão</label>
                  <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
                    <input 
                      type="text" 
                      value={editingMission.validationCode}
                      onChange={(e) => setEditingMission({...editingMission, validationCode: e.target.value.toUpperCase()})}
                      className="w-full bg-black border-4 border-amber-900 focus:border-amber-500 p-4 pl-12 text-amber-500 font-black outline-none uppercase tracking-widest transition-colors"
                      required
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-amber-500 text-black py-6 font-orbitron font-black text-2xl flex items-center justify-center gap-3 mt-4 hover:bg-amber-400 active:scale-95 transition-all shadow-[0_8px_0_#996a00]"
              >
                <Save className="w-8 h-8" />
                GRAVAR DADOS
              </button>
            </form>
          </div>
        </div>
      )}

      {showResetConfirm !== 'none' && (
        <div className="fixed inset-0 z-[250] bg-black/95 flex items-center justify-center p-4 text-center">
          <div className="w-full max-w-md border-[6px] border-red-600 bg-black p-8 space-y-6 military-clip animate-pulse-solid">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
            <div className="space-y-2">
              <h3 className="font-orbitron text-2xl font-black text-red-600 uppercase">Protocolo de Limpeza?</h3>
              <p className="text-red-900 text-xs font-bold uppercase tracking-tighter">Confirmar este procedimento deletará todos os operadores e resetará o progresso de todas as missões. Operação irreversível.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => { onReset(); setShowResetConfirm('none'); }} 
                className="w-full bg-red-600 text-black py-5 font-orbitron font-black text-xl hover:bg-red-500 active:scale-95 transition-all"
              >
                EXECUTAR RESET
              </button>
              <button 
                onClick={() => setShowResetConfirm('none')} 
                className="text-amber-700 font-black hover:text-amber-500 py-2 uppercase text-sm"
              >
                Abortar Missão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
