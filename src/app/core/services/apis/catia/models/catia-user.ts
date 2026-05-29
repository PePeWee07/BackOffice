export interface CatiaUserModel {
  id: number;
  whatsappPhone: string;
  previousResponseId: string;
  limitQuestions: number;
  firstInteraction: Date;
  lastInteraction: Date;
  nextResetDate?: Date;
  conversationState: string;
  limitStrike: number;
  block: boolean;
  blockingReason?: string;
  iaPaused: boolean;
  validQuestionCount: number;
  identificacion: string;
  chatSessions?: ChatSession[];
  userTickets?: UserTicket[];
  erpUser?: ERPUser;
}

export interface ChatSession {
  id: number;
  messageCount: number;
  startTime: Date;
}

export interface ERPUser {
  codigoErp: string;
  tipoIdentificacion: string;
  identificacion: string;
  nombres: string;
  apellidos: string;
  numeroCelular: string;
  emailInstitucional: string;
  emailPersonal: string;
  sexo: string;
  rolesUsuario: RolesUsuario[];
}

export interface RolesUsuario {
  tipoRol: string;
  detallesRol: DetallesRol[];
}

export interface DetallesRol {
  idCarrera?: number;
  nombreCarrera?: string;
  ultimoSemestreActivo?: string;
  unidadAcademica?: string;
  sede?: string;
  modalidad?: string;
  curso?: string;
  paralelo?: string;
  nombreRol?: string;
  unidadOrganizativa?: string;
}

export interface UserTicket {
  id: number;
  name: string;
  status: string;
}

export interface CatiaUserChatQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface CatiaUserFindQueryParams {
  identificacion?: string;
  whatsappPhone?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  direction?: 'asc' | 'desc';
}

export interface CatiaUserChatUpdateRequest {
  whatsappPhone?: string;
  previousResponseId?: string;
  limitQuestions?: number;
  nextResetDate?: string | Date | null;
  conversationState?: string;
  limitStrike?: number;
  block?: boolean;
  blockingReason?: string | null;
  iaPaused?: boolean;
  validQuestionCount?: number;
  identificacion?: string;
}
