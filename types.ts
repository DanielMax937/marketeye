export enum AppState {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR'
}

export interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

export interface LiveConfig {
  model: string;
  systemInstruction: string;
}

export type LiveSessionStatus = {
  state: AppState;
  errorMessage?: string;
};