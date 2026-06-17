export type MessageDirection =
  | 'INBOUND'
  | 'OUTBOUND';

export type MessageSource =
  | 'BACK_END'
  | 'IA'
  | 'BACK_OFFICE'
  | 'UNKNOWN'
  | 'USER';

export type MessageType =
  | 'TEXT'
  | 'IMAGE'
  | 'DOCUMENT'
  | 'AUDIO'
  | 'VIDEO'
  | 'STICKER'
  | 'LOCATION'
  | 'REACTION'
  | 'CONTACTS'
  | 'TEMPLATE'
  | 'UNSUPPORTED'
  | 'UNKNOWN';

export interface CatiaMessageModel {
  id: number;
  wamid: string;
  profileName: string;
  conversationUserPhone: string;
  fromPhone: string;
  toPhone: string;
  direction: MessageDirection;
  source: MessageSource;
  timestamp: number;
  sentAt?: number;
  deliveredAt?: number;
  readAt?: number;
  failedAt?: number;
  mediaId?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  mediaFilename?: string;
  mediaCaption?: string;
  type: MessageType;
  relatedWamid?: string;
  reactionEmoji?: string;
  textBody?: string;
  aiResponses?: AiResponse[];
  messageTemplate?: MessageTemplate;
  messagePricing?: MessagePricing;
  messageAddres?: MessageAddress;
  messageError?: MessageError;
}

export interface AiResponse {
  id: number;
  responseId: string;
  previousResponseId?: string;
  createdAt: number;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  metadata?: string;
  reasoning?: string;
  toolCalls?: AiToolCall[];
}

export interface AiToolCall {
  id?: number;
  callId?: string;
  toolName?: string;
  arguments?: string;
  output?: string;
  status?: string;
}

export interface MessageTemplate {
  id: number;
  templateName: string;
  answeredAt?: Date | string;
  answer?: string;
  messageStatus?: string;
}

export interface MessagePricing {
  id: number;
  pricingBillable?: boolean;
  pricingModel?: string;
  pricingCategory?: string;
  pricingType?: string;
}

export interface MessageAddress {
  id: number;
  latitude?: number;
  longitude?: number;
  locationName?: string;
  locationAddress?: string;
}

export interface MessageError {
  id: number;
  errorCode?: string;
  errorTitle?: string;
  errorDetails?: string;
  errorMessage?: string;
}

export interface ResponseMediaMetadata {
  url: string;
  mimeType?: string;
  sha256?: string;
  fileSize?: number;
  id: string;
  messagingProduct?: string;
}
