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
  VIDEO_FILE = 'VIDEO_FILE',
  VIDEO_URL = 'VIDEO_URL',
  DOCUMENT_FILE = 'DOCUMENT_FILE',
  DOCUMENT_URL = 'DOCUMENT_URL',
}

export type CatiaMediaKind = 'IMAGE' | 'VIDEO' | 'DOCUMENT';

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

// WhatsApp Cloud API admite video MP4 y 3GPP (hasta ~16 MB).
export const CATIA_ALLOWED_VIDEO_UPLOADS: readonly CatiaUploadMimeRule[] = [
  { mimeType: 'video/mp4', extension: '.mp4', maxBytes: 16 * 1024 * 1024 },
  { mimeType: 'video/3gpp', extension: '.3gp', maxBytes: 16 * 1024 * 1024 },
] as const;

// Documentos admitidos por WhatsApp Cloud API (hasta ~100 MB).
export const CATIA_ALLOWED_DOCUMENT_UPLOADS: readonly CatiaUploadMimeRule[] = [
  { mimeType: 'application/pdf', extension: '.pdf', maxBytes: 100 * 1024 * 1024 },
  { mimeType: 'application/msword', extension: '.doc', maxBytes: 100 * 1024 * 1024 },
  {
    mimeType:
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    extension: '.docx',
    maxBytes: 100 * 1024 * 1024,
  },
  { mimeType: 'application/vnd.ms-excel', extension: '.xls', maxBytes: 100 * 1024 * 1024 },
  {
    mimeType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    extension: '.xlsx',
    maxBytes: 100 * 1024 * 1024,
  },
  { mimeType: 'application/vnd.ms-powerpoint', extension: '.ppt', maxBytes: 100 * 1024 * 1024 },
  {
    mimeType:
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    extension: '.pptx',
    maxBytes: 100 * 1024 * 1024,
  },
  { mimeType: 'text/plain', extension: '.txt', maxBytes: 100 * 1024 * 1024 },
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
