
export enum MissionStatus {
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum MissionType {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY'
}

export enum OperatorRank {
  RECRUIT = 'RECRUTA',
  PRIVATE = 'SOLDADO',
  SERGEANT = 'SARGENTO',
  CAPTAIN = 'CAPITÃO',
  MAJOR = 'MAJOR'
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  status: MissionStatus;
  points: number;
  validationCode: string;
  startTime: number; // timestamp
  duration: number; // minutes
  parentId?: string; // ID da missão primária vinculada
}

export interface Operator {
  id: string;
  callsign: string;
  score: number;
  rank: OperatorRank;
  status: 'ONLINE' | 'KIA' | 'OFFLINE';
  lastSeen: number;
  joinDate: number;
  completedMissions: string[]; // IDs das missões concluídas individualmente
}

export interface OperationState {
  name: string;
  description: string;
  mapUrl: string;
  missions: Mission[];
  operators: Operator[];
  isActive: boolean;
}

export interface AuthState {
  user: Operator | { callsign: string; isAdmin: boolean } | null;
  isAuthenticated: boolean;
}
