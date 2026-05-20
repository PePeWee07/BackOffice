export interface CatiaSendWhatsAppMessageRequest {
  number: number,
  message: string,
  sentBy: string,
  source: string,
  businessPhoneNumber: number,
  type: string,
  contextId?: string,
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
