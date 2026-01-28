
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { 
  doc, 
  onSnapshot, 
  collection, 
  setDoc, 
  getDoc,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  writeBatch
} from "firebase/firestore";
import { signInAnonymously } from "firebase/auth";
import { db, auth as firebaseAuth } from './firebase';

import Login from './pages/Login';
import OperatorDashboard from './pages/OperatorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import HUDLayout from './components/HUDLayout';
import { AuthState, Operator, OperationState, Mission, MissionStatus, MissionType } from './types';
import { getRankFromScore } from './constants';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({ user: null, isAuthenticated: false });
  const [opState, setOpState] = useState<OperationState | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Escuta Global do Firestore
  useEffect(() => {
    const unsubOp = onSnapshot(doc(db, "operation", "main"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOpState(prev => ({
          ...prev!,
          name: data.name || 'OPERAÇÃO DESCONHECIDA',
          description: data.description || '',
          mapUrl: data.mapUrl || '',
          isActive: data.isActive ?? true,
          missions: prev?.missions || [],
          operators: prev?.operators || []
        }));
      } else {
        // Fallback for missing operation doc
        setOpState(prev => prev || {
            name: 'OPERAÇÃO ATIVA',
            description: 'Aguardando ordens do HQ...',
            mapUrl: 'https://picsum.photos/seed/airsoftmap/1200/800',
            missions: [],
            operators: [],
            isActive: true
        });
      }
    });

    const unsubMissions = onSnapshot(collection(db, "missions"), (snap) => {
      const missions = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Mission[];
      setOpState(prev => prev ? { ...prev, missions } : null);
    });

    const unsubOperators = onSnapshot(query(collection(db, "operators"), orderBy("score", "desc")), (snap) => {
      const operators = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Operator[];
      setOpState(prev => prev ? { ...prev, operators } : null);
      setLoading(false);
    });

    return () => {
      unsubOp();
      unsubMissions();
      unsubOperators();
    };
  }, []);

  // 2. Monitor de Sessão/Remoção
  useEffect(() => {
    if (auth.isAuthenticated && auth.user && !('isAdmin' in auth.user)) {
      const currentUser = auth.user as Operator;
      const stillExists = opState?.operators.some(o => o.id === currentUser.id);
      if (opState && !stillExists && auth.isAuthenticated) {
        setAuth({ user: null, isAuthenticated: false });
      }
    }
  }, [opState?.operators, auth]);

  const handleLogin = async (user: any) => {
    if (user.isAdmin) {
      setAuth({ user: { callsign: 'COMMANDER', isAdmin: true }, isAuthenticated: true });
    } else {
      try {
        const userCred = await signInAnonymously(firebaseAuth);
        const uid = userCred.user.uid;
        const opRef = doc(db, "operators", uid);
        const opSnap = await getDoc(opRef);

        let operatorData: Operator;

        if (!opSnap.exists()) {
          operatorData = {
            id: uid,
            callsign: user.callsign,
            score: 0,
            rank: getRankFromScore(0),
            status: 'ONLINE',
            lastSeen: Date.now(),
            joinDate: Date.now()
          };
          await setDoc(opRef, operatorData);
        } else {
          operatorData = opSnap.data() as Operator;
          await setDoc(opRef, { ...operatorData, status: 'ONLINE', lastSeen: Date.now() }, { merge: true });
        }

        setAuth({ user: operatorData, isAuthenticated: true });
      } catch (err) {
        console.error("Login Error:", err);
      }
    }
  };

  const handleLogout = async () => {
    if (auth.user && !('isAdmin' in auth.user)) {
      const uid = (auth.user as Operator).id;
      try {
        await setDoc(doc(db, "operators", uid), { status: 'OFFLINE' }, { merge: true });
      } catch(e) {}
    }
    setAuth({ user: null, isAuthenticated: false });
  };

  const handleForcedReset = async () => {
    try {
      const batch = writeBatch(db);

      // Do NOT delete missions, but reset their status to ACTIVE
      const missionSnap = await getDocs(collection(db, "missions"));
      missionSnap.forEach((d) => {
        batch.update(d.ref, { status: MissionStatus.ACTIVE });
      });

      // Delete all operators to reset leaderboard and force logouts
      const operatorSnap = await getDocs(collection(db, "operators"));
      operatorSnap.forEach((d) => batch.delete(d.ref));

      // Reset operation document info
      const opRef = doc(db, "operation", "main");
      batch.set(opRef, {
        name: opState?.name || 'NOVA OPERAÇÃO',
        description: 'PROTOCOLO DE REINICIALIZAÇÃO EXECUTADO. TODAS AS MISSÕES FORAM RESETADAS.',
        mapUrl: opState?.mapUrl || 'https://picsum.photos/seed/airsoftmap/1200/800',
        isActive: true
      });

      await batch.commit();
      console.log("Forced Reset (Mission Reset) executed successfully.");
    } catch (error) {
      console.error("Error during forced reset:", error);
      alert("ERRO CRÍTICO DURANTE O RESET. VERIFIQUE O CONSOLE.");
    }
  };

  return (
    <HashRouter>
      <HUDLayout auth={auth} onLogout={handleLogout}>
        <Routes>
          <Route path="/login" element={
            auth.isAuthenticated ? (
              'isAdmin' in auth.user! ? <Navigate to="/admin" /> : <Navigate to="/operator" />
            ) : <Login onLogin={handleLogin} />
          } />
          
          <Route path="/operator" element={
            auth.isAuthenticated && !('isAdmin' in auth.user!) ? (
              <OperatorDashboard 
                opState={opState} 
                operator={auth.user as Operator}
                onUpdateOperator={async (updated) => {
                  await setDoc(doc(db, "operators", updated.id), updated, { merge: true });
                  setAuth(prev => ({ ...prev, user: updated }));
                }}
                onUpdateMissions={async (missions) => {
                  for (const m of missions) {
                    // Clean undefined fields for Firestore (specifically parentId)
                    const cleanM = JSON.parse(JSON.stringify(m));
                    await setDoc(doc(db, "missions", m.id), cleanM, { merge: true });
                  }
                }}
              />
            ) : <Navigate to="/login" />
          } />

          <Route path="/admin" element={
            auth.isAuthenticated && 'isAdmin' in auth.user! ? (
              <AdminDashboard 
                opState={opState} 
                onUpdateOp={async (updates) => {
                   if (updates.name || updates.description || updates.mapUrl) {
                     await setDoc(doc(db, "operation", "main"), updates, { merge: true });
                   }
                }}
                onReset={handleForcedReset}
              />
            ) : <Navigate to="/login" />
          } />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </HUDLayout>
    </HashRouter>
  );
};

export default App;
