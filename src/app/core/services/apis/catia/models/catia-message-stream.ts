import { CatiaMessageModel } from './catia-message';

export interface CatiaMessageStreamEvent {
  event: string;
  data: unknown;
  rawData: string;
  id?: string;
  retry?: number;
  message?: CatiaMessageModel;
}

export interface CatiaMessageStreamEventConect {
  ok: boolean;
  phone: string;
}
