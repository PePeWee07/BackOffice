import { CatiaMessageModel } from './catia-message';

export interface CatiaMessageStreamPayload {
  eventType?: string;
  phone?: string;
  status?: string;
  message?: CatiaMessageModel | null;
}

export interface CatiaMessageStreamEvent {
  event: string;
  data: unknown;
  rawData: string;
  id?: string;
  retry?: number;
  payload?: CatiaMessageStreamPayload;
  message?: CatiaMessageModel;
}

export interface CatiaMessageStreamEventConect {
  ok: boolean;
  phone: string;
}
