
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
  Skull,
  Layers,
  ChevronDown,
  AlertTriangle
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
      description: parentId ? 'TAREFA SECUNDÁRIA.' : 'OBJETIVO TÁTICO.',
      type: parentId ? MissionType.SECONDARY : MissionType.PRIMARY,
      status: MissionStatus.ACTIVE,
      points: parentId ? 50 : 100,
      validationCode: 'CODE-' + Math.floor(Math.random() * 9999),
      startTime: Date.now(),
      duration: 60,
    };
    if (parentId) newMission.parentId = parentId;
    await setDoc(doc(db, "missions", id), newMission);
  };

  const removeMission = async (id: string) => {
    if(confirm("DELETAR MISSÃO?")) {
      await deleteDoc(doc(db, "missions", id));
      const subs = opState.missions.filter(m => m.parentId === id);
      for (const sub of subs) await deleteDoc(doc(db, "missions", sub.id));
    }
  };

  const updateMission = async (updated: Mission) => {
    const cleanData = JSON.parse(JSON.stringify(updated));
    await setDoc(doc(db, "missions", updated.id), cleanData, { merge: true });
    setEditingMission(null);
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
          className="bg-red-600 text-black px-4 py-2 font-black text-xs border-4 border-red-900"
        >
          FORCE RESET
        </button>
      </div>

      <div className="flex gap-2 font-orbitron">
        {['missions', 'operators', 'config'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveView(tab as any)}
            className={`flex-1 py-4 border-4 ${
              activeView === tab ? 'bg-amber-500 text-black border-amber-500' : 'bg-black text-amber-500 border-amber-900'
            }`}
          >
            <span className="font-black text-xs uppercase">{tab}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeView === 'missions' && (
          <div className="space-y-6">
             <button onClick={() => addMission()} className="w-full py-5 border-4 border-dashed border-amber-500 bg-amber-500/10 text-amber-500 font-black font-orbitron">+ NOVA MISSÃO</button>
             {primaryMissions.map(mission => (
               <div key={mission.id} className="space-y-2">
                 <div className="p-4 border-4 border-amber-500 bg-black flex items-center justify-between">
                   <h3 className="font-orbitron font-black text-amber-500 uppercase">{mission.title}</h3>
                   <div className="flex gap-2">
                     <button onClick={() => addMission(mission.id)} className="p-3 bg-blue-600 text-black"><Plus /></button>
                     <button onClick={() => setEditingMission(mission)} className="p-3 bg-amber-500 text-black"><Edit3 /></button>
                     <button onClick={() => removeMission(mission.id)} className="p-3 bg-red-600 text-black"><Trash2 /></button>
                   </div>
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {showResetConfirm !== 'none' && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4 text-center">
          <div className="w-full max-w-md border-[6px] border-red-600 bg-black p-8 space-y-6">
            <AlertTriangle className="w-16 h-16 text-red-600 mx-auto" />
            <h3 className="font-orbitron text-2xl font-black text-red-600">RESET TOTAL?</h3>
            <button onClick={onReset} className="w-full bg-red-600 text-black py-4 font-black">CONFIRMAR RESET</button>
            <button onClick={() => setShowResetConfirm('none')} className="text-amber-700 font-black">CANCELAR</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
