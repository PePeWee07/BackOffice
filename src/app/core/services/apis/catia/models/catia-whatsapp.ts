export interface CatiaSendWhatsAppMessageRequest {
  number: number,
  message: string,
  sentBy: string,
  source: string,
  businessPhoneNumber: number,
  type: string,
  contextId?: string,
}

export enum CatiaUploadMode {
  NONE = 'NONE',
  IMAGE_FILE = 'IMAGE_FILE',
  IMAGE_URL = 'IMAGE_URL',
}

export interface CatiaUploadMimeRule {
  mimeType: string;
  extension: string;
  maxBytes: number;
}

export interface PendingImageUpload {
  localId: string;
  file: File;
  previewUrl: string;
  mediaId: string | null;
  uploading: boolean;
  error: string | null;
}

export const CATIA_ALLOWED_IMAGE_UPLOADS: readonly CatiaUploadMimeRule[] = [
  { mimeType: 'image/jpeg', extension: '.jpg', maxBytes: 5 * 1024 * 1024 },
  { mimeType: 'image/jpg', extension: '.jpg', maxBytes: 5 * 1024 * 1024 },
  { mimeType: 'image/png', extension: '.png', maxBytes: 5 * 1024 * 1024 },
] as const;

export const CATIA_ALLOWED_UPLOAD_MIME_TYPES = [
  'text/plain',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
] as const;

export interface ResponseWhatsapp {
  messaging_product: string;
  contacts: ResponseWhatsappContact[];
  messages: ResponseWhatsappMessage[];
}

export interface ResponseWhatsappContact {
  input: string;
  wa_id: string;
}

export interface ResponseWhatsappMessage {
  id: string;
  messageStatus?: string | null;
}
