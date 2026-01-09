
export enum AppMode {
  IDLE = 'IDLE',
  TRANSMIT = 'TRANSMIT',
  RECEIVE = 'RECEIVE'
}

export enum SignalStatus {
  WAITING = 'WAITING',
  RECEIVING = 'RECEIVING',
  DECODING = 'DECODING',
  ERROR = 'ERROR'
}

export interface DecodedMessage {
  id: string;
  text: string;
  timestamp: number;
  confidence: number;
}
