import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { map, Observable } from 'rxjs';
import {
  CatiaUserFindQueryParams,
  CatiaUserChatQueryParams,
  CatiaUserChatUpdateRequest,
  CatiaUserModel,
} from './models/catia-user';
import {
  CatiaSendWhatsAppMessageRequest,
  ResponseWhatsapp,
} from './models/catia-whatsapp';
import {
  CatiaTemplateQueryParams,
  ResponseMessageTemplate,
} from './models/catia-template';
import {
  AiResponse,
  CatiaMessageModel,
  MessageAddress,
  MessageError,
  MessagePricing,
  MessageTemplate,
  ResponseMediaMetadata,
} from './models/catia-message';
import { CatiaMessageStreamEvent } from './models/catia-message-stream';
import { CatiaPage } from './models/catia-page';
import { CatiaMessageStreamService } from './catia-message-stream.service';

@Injectable({
  providedIn: 'root',
})
export class CatiaChatService {
  private http = inject(HttpClient);
  private messageStreamService = inject(CatiaMessageStreamService);

  constructor() {}

  private apiURL =
    environment.microservices.catiaCore.baseUrl + '/api/v1/catia/core';

  // Messages Stream
  streamMessages(phone: string): Observable<CatiaMessageStreamEvent> {
    return this.messageStreamService.streamMessages(phone);
  }

  // Messages History
  getMessageHistory(params: {
    phone: string;
    page?: number;
    size?: number;
    direction?: 'asc' | 'desc';
  }): Observable<CatiaPage<CatiaMessageModel>> {
    const phone = params.phone.trim();

    if (!phone) {
      throw new Error('El telefono es requerido para consultar el historial');
    }

    let httpParams = new HttpParams()
      .set('phone', phone)
      .set('page', (params.page ?? 0).toString())
      .set('size', (params.size ?? 50).toString())
      .set('direction', params.direction ?? 'desc');

    return this.http.get<CatiaPage<CatiaMessageModel>>(
      `${this.apiURL}/messages/history`,
      { params: httpParams }
    );
  }

  // Message Pricing
  getMessagePricing(messageId: number): Observable<MessagePricing> {
    return this.http.get<MessagePricing>(
      `${this.apiURL}/messages/${messageId}/pricing`
    );
  }

  // Message Error
  getMessageError(messageId: number): Observable<MessageError> {
    return this.http.get<MessageError>(
      `${this.apiURL}/messages/${messageId}/error`
    );
  }

  // Message Address
  getMessageAddress(messageId: number): Observable<MessageAddress> {
    return this.http.get<MessageAddress>(
      `${this.apiURL}/messages/${messageId}/address`
    );
  }

  // Message AI Responses
  getAiResponses(messageId: number): Observable<AiResponse[]> {
    return this.http.get<AiResponse[]>(
      `${this.apiURL}/messages/${messageId}/ai-response`
    );
  }

  // Message Complete
  findMessageId(messageId: number): Observable<CatiaMessageModel> {
    return this.http.get<CatiaMessageModel>(
      `${this.apiURL}/messages/${messageId}`
    );
  }

  // User find
  findUserChat(params: CatiaUserFindQueryParams): Observable<CatiaPage<CatiaUserModel>> {
    const identificacion = params.identificacion?.trim();
    const whatsappPhone = params.whatsappPhone?.trim();
    const page = this.normalizePage(params.page);

    let httpParams = new HttpParams();

    if (identificacion) {
      httpParams = httpParams.set('identificacion', identificacion);
    }

    if (whatsappPhone) {
      httpParams = httpParams.set('whatsappPhone', whatsappPhone);
    }

    httpParams = httpParams
      .set('page', page.toString())
      .set('pageSize', (params.pageSize ?? 10).toString())
      .set('sortBy', params.sortBy ?? 'lastInteraction')
      .set('direction', params.direction ?? 'asc');

    return this.http.get<CatiaPage<CatiaUserModel>>(
      `${this.apiURL}/whatsapp/user/find`,
      { params: httpParams }
    );
  }

  // User Pages
  listUserChats(
    params: CatiaUserChatQueryParams = {}
  ): Observable<CatiaPage<CatiaUserModel>> {
    const page = this.normalizePage(params.page);

    const httpParams = new HttpParams()
      .set('pageSize', (params.pageSize ?? 10).toString())
      .set('sortBy', params.sortBy ?? 'lastInteraction')
      .set('direction', params.direction ?? 'asc');

    const requestUrl = `${this.apiURL}/whatsapp/page/users/${page}`;

    return this.http.get<CatiaPage<CatiaUserModel>>(
      requestUrl,
      { params: httpParams }
    );
  }

  // User Pages By ChatSession
  listUserChatsBySessionStart(
    params: CatiaUserChatQueryParams
  ): Observable<CatiaPage<CatiaUserModel>> {
    const page = this.normalizePage(params.page);

    if (!params.startDate?.trim() || !params.endDate?.trim()) {
      throw new Error(
        'startDate y endDate son requeridos para filtrar por sesion'
      );
    }

    const httpParams = new HttpParams()
      .set('pageSize', (params.pageSize ?? 10).toString())
      .set('sortBy', params.sortBy ?? 'lastInteraction')
      .set('direction', params.direction ?? 'asc')
      .set('startDate', params.startDate.trim())
      .set('endDate', params.endDate.trim());

    return this.http.get<CatiaPage<CatiaUserModel>>(
      `${this.apiURL}/whatsapp/page/users/${page}/byChatSessionStart`,
      { params: httpParams }
    );
  }

  // User Update
  updateUserChat(
    userId: number,
    body: CatiaUserChatUpdateRequest
  ): Observable<CatiaUserModel> {
    return this.http.patch<CatiaUserModel>(
      `${this.apiURL}/whatsapp/update/user/${userId}`,
      body
    );
  }

  // WhatsApp Send
  sendWhatsAppMessage(
    payload: CatiaSendWhatsAppMessageRequest
  ): Observable<ResponseWhatsapp> {
    return this.http.post<ResponseWhatsapp>(
      `${this.apiURL}/whatsapp/send`,
      payload
    );
  }

  /**
   * Toggle del takeover humano: pausa o reactiva a CatIA para ese usuario.
   * Mientras paused=true los mensajes del back-office salen sin que la IA
   * responda; con paused=false la IA vuelve a tomar el control.
   */
  toggleIaPause(whatsappPhone: string, paused: boolean): Observable<string> {
    const params = new HttpParams()
      .set('whatsappPhone', whatsappPhone)
      .set('paused', String(paused));
    return this.http.patch(`${this.apiURL}/whatsapp/user/ia/pause`, null, {
      params,
      responseType: 'text',
    });
  }

  // WhatsApp Upload File
  uploadWhatsAppMedia(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post(`${this.apiURL}/whatsapp/upload-media-file`, formData, {
      responseType: 'text',
    });
  }

  // WhatsApp Donwload Media
  downloadWhatsAppMedia(mediaId: string): Observable<Blob> {
    const sanitizedMediaId = mediaId.trim();

    if (!sanitizedMediaId) {
      throw new Error('El mediaId es requerido para descargar el archivo');
    }

    return this.http.get(
      `${this.apiURL}/whatsapp/media/donwload/${sanitizedMediaId}`,
      {
        responseType: 'blob',
      }
    );
  }

  // WhatsApp Media Metadata
  getMediaMetadata(mediaId: string): Observable<ResponseMediaMetadata> {
    const sanitizedMediaId = mediaId.trim();

    if (!sanitizedMediaId) {
      throw new Error('El mediaId es requerido para consultar metadata');
    }

    return this.http
      .get<{
        url: string;
        mimeType?: string;
        mime_type?: string;
        sha256?: string;
        fileSize?: number;
        file_size?: number;
        id: string;
        messagingProduct?: string;
        messaging_product?: string;
      }>(
      `${this.apiURL}/whatsapp/media/${sanitizedMediaId}`
      )
      .pipe(
        map((response) => ({
          url: response.url,
          mimeType: response.mimeType ?? response.mime_type,
          sha256: response.sha256,
          fileSize: response.fileSize ?? response.file_size,
          id: response.id,
          messagingProduct:
            response.messagingProduct ?? response.messaging_product,
        }))
      );
  }

  // WhatsApp Send Image By ID
  sendImageById(
    payload: CatiaSendWhatsAppMessageRequest,
    imageId: string
  ): Observable<ResponseWhatsapp> {
    return this.http.post<ResponseWhatsapp>(
      `${this.apiURL}/whatsapp/send-image-by-id`,
      payload,
      {
        params: new HttpParams().set('imageId', imageId.trim()),
      }
    );
  }

  // WhatsApp Send Image By URL
  sendImageByUrl(
    payload: CatiaSendWhatsAppMessageRequest,
    imageUrl: string
  ): Observable<ResponseWhatsapp> {
    return this.http.post<ResponseWhatsapp>(
      `${this.apiURL}/whatsapp/send-image-by-url`,
      payload,
      {
        params: new HttpParams().set('imageUrl', imageUrl.trim()),
      }
    );
  }

  // WhatsApp Send Video By ID
  sendVideoById(
    payload: CatiaSendWhatsAppMessageRequest,
    videoId: string
  ): Observable<ResponseWhatsapp> {
    return this.http.post<ResponseWhatsapp>(
      `${this.apiURL}/whatsapp/send-video-by-id`,
      payload,
      {
        params: new HttpParams().set('videoId', videoId.trim()),
      }
    );
  }

  // WhatsApp Send Video By URL
  sendVideoByUrl(
    payload: CatiaSendWhatsAppMessageRequest,
    videoUrl: string
  ): Observable<ResponseWhatsapp> {
    return this.http.post<ResponseWhatsapp>(
      `${this.apiURL}/whatsapp/send-video-by-url`,
      payload,
      {
        params: new HttpParams().set('videoUrl', videoUrl.trim()),
      }
    );
  }

  // WhatsApp Send Doc By ID
  sendDocumentById(
    payload: CatiaSendWhatsAppMessageRequest,
    documentId: string,
    filename: string
  ): Observable<ResponseWhatsapp> {
    return this.http.post<ResponseWhatsapp>(
      `${this.apiURL}/whatsapp/send-document-by-id`,
      payload,
      {
        params: new HttpParams()
          .set('documentId', documentId.trim())
          .set('filename', filename.trim()),
      }
    );
  }

  // WhatsApp Send Doc By URL
  sendDocumentByUrl(
    payload: CatiaSendWhatsAppMessageRequest,
    documentUrl: string,
    filename: string
  ): Observable<ResponseWhatsapp> {
    return this.http.post<ResponseWhatsapp>(
      `${this.apiURL}/whatsapp/send-document-by-url`,
      payload,
      {
        params: new HttpParams()
          .set('documentUrl', documentUrl.trim())
          .set('filename', filename.trim()),
      }
    );
  }

  // WhatsApp Template All Responses
  getAllTemplateResponses(
    params: CatiaTemplateQueryParams = {}
  ): Observable<CatiaPage<ResponseMessageTemplate>> {
    const page = this.normalizePage(params.page);

    const httpParams = new HttpParams()
      .set('pageSize', (params.pageSize ?? 20).toString())
      .set('sort', params.sort ?? 'message.sentAt')
      .set('dir', params.dir ?? 'desc')
      .set('onlyAnswered', String(params.onlyAnswered ?? false));

    return this.http.get<CatiaPage<ResponseMessageTemplate>>(
      `${this.apiURL}/whatsapp/template/all`,
      { params: httpParams.set('page', page.toString()) }
    );
  }

  // WhatsApp Template By Date Range
  getTemplateResponsesByDateRange(
    start: string,
    end: string
  ): Observable<ResponseMessageTemplate[]> {
    return this.http
      .get<ResponseMessageTemplate[]>(
        `${this.apiURL}/whatsapp/template/date-range`,
        {
          params: new HttpParams().set('start', start.trim()).set('end', end.trim()),
          observe: 'response',
        }
      )
      .pipe(map((response) => response.body ?? []));
  }

  // WhatsApp Template By name
  getTemplateResponsesByName(
    templateName: string
  ): Observable<ResponseMessageTemplate[]> {
    const sanitizedTemplateName = templateName.trim();

    if (!sanitizedTemplateName) {
      throw new Error('El templateName es requerido');
    }

    return this.http
      .get<ResponseMessageTemplate[]>(
        `${this.apiURL}/whatsapp/template/name/${encodeURIComponent(
          sanitizedTemplateName
        )}`,
        {
          observe: 'response',
        }
      )
      .pipe(map((response) => response.body ?? []));
  }

  // WhatsApp Template By phone
  getTemplateResponsesByPhone(
    toPhone: string
  ): Observable<ResponseMessageTemplate[]> {
    const sanitizedPhone = toPhone.trim();

    if (!sanitizedPhone) {
      throw new Error('El toPhone es requerido');
    }

    return this.http
      .get<ResponseMessageTemplate[]>(
        `${this.apiURL}/whatsapp/template/${encodeURIComponent(sanitizedPhone)}`,
        {
          observe: 'response',
        }
      )
      .pipe(map((response) => response.body ?? []));
  }

  // WhatsApp Template By message ID
  getTemplateByMessageId(messageId: number): Observable<MessageTemplate> {
    return this.http.get<MessageTemplate>(
      `${this.apiURL}/whatsapp/template/messages/${messageId}`
    );
  }

  private normalizePage(page?: number): number {
    if (page === undefined || page === null || Number.isNaN(page)) {
      return 0;
    }

    return page < 0 ? 0 : page;
  }
}
