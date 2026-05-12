export interface CatiaSendWhatsAppMessageRequest {
  to: string;
  type?: string;
  message?: string;
  textBody?: string;
  mediaId?: string;
  mediaUrl?: string;
  mimeType?: string;
  filename?: string;
  caption?: string;
  templateName?: string;
  templateLanguage?: string;
  templateParameters?: unknown[];
  [key: string]: unknown;
}

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
