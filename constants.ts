
import { OperatorRank } from './types';

export const ADMIN_PASSWORD = 'admin123';
export const VALIDATION_DELAY_MS = 5 * 60 * 1000;

export const getRankFromScore = (score: number): OperatorRank => {
  if (score >= 2000) return OperatorRank.MAJOR;
  if (score >= 1000) return OperatorRank.CAPTAIN;
  if (score >= 500) return OperatorRank.SERGEANT;
  if (score >= 100) return OperatorRank.PRIVATE;
  return OperatorRank.RECRUIT;
};

export const COLORS = {
  amber: '#ffb000',
  amberLow: '#1a1100', // Fundo quase preto sólido em vez de alpha
  amberMid: '#664600',
  amberHigh: '#ffb000',
  danger: '#ff0000',
  success: '#00ff00',
};
