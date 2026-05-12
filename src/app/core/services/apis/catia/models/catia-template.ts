export interface ResponseMessageTemplate {
  id: number;
  toPhone: string;
  templateName: string;
  sentAt?: string | Date | null;
  answeredAt?: string | Date | null;
  wamid: string;
  answer?: string | null;
  messageStatus?: string | null;
}

export interface CatiaTemplateQueryParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  dir?: 'asc' | 'desc';
  onlyAnswered?: boolean;
}
