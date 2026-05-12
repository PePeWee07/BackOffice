import { Injectable, inject } from '@angular/core';
import { Observable, firstValueFrom, from, switchMap } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AuthenticationService } from '../../auth/auth.service';
import { TokenStorageService } from '../../auth/token-storage.service';
import { CatiaMessageModel } from './models/catia-message';
import { CatiaMessageStreamEvent } from './models/catia-message-stream';

@Injectable({
  providedIn: 'root',
})
export class CatiaMessageStreamService {
  private tokenStorage = inject(TokenStorageService);
  private authenticationService = inject(AuthenticationService);

  private apiURL =
    environment.microservices.catiaCore.baseUrl + '/api/v1/catia/core';

  streamMessages(phone: string): Observable<CatiaMessageStreamEvent> {
    const sanitizedPhone = phone.trim();

    if (!sanitizedPhone) {
      throw new Error('El telefono es requerido para abrir el stream');
    }

    return from(this.ensureAccessToken()).pipe(
      switchMap((token) => this.createMessagesStream(sanitizedPhone, token))
    );
  }

  private createMessagesStream(
    phone: string,
    token: string
  ): Observable<CatiaMessageStreamEvent> {
    return new Observable<CatiaMessageStreamEvent>((subscriber) => {
      const abortController = new AbortController();
      const params = new URLSearchParams({ phone });
      const streamUrl = `${this.apiURL}/messages/stream?${params.toString()}`;

      void this.openStream(streamUrl, token, abortController, subscriber);

      return () => abortController.abort();
    });
  }

  private async openStream(
    streamUrl: string,
    token: string,
    abortController: AbortController,
    subscriber: {
      next: (value: CatiaMessageStreamEvent) => void;
      error: (error: unknown) => void;
      complete: () => void;
      closed: boolean;
    }
  ): Promise<void> {
    try {
      const response = await fetch(streamUrl, {
        method: 'GET',
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        signal: abortController.signal,
      });

      if (!response.ok) {
        throw new Error(
          `No fue posible abrir el stream SSE (${response.status})`
        );
      }

      if (!response.body) {
        throw new Error('El navegador no expuso el body del stream SSE');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!subscriber.closed) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split(/\r?\n\r?\n/);
        buffer = chunks.pop() ?? '';

        for (const chunk of chunks) {
          const event = this.parseSseChunk(chunk);

          if (event) {
            subscriber.next(event);
          }
        }
      }

      const pendingEvent = this.parseSseChunk(buffer.trim());

      if (pendingEvent) {
        subscriber.next(pendingEvent);
      }

      subscriber.complete();
    } catch (error) {
      if (abortController.signal.aborted) {
        subscriber.complete();
        return;
      }

      subscriber.error(error);
    }
  }

  private parseSseChunk(chunk: string): CatiaMessageStreamEvent | null {
    if (!chunk) {
      return null;
    }

    const lines = chunk.split(/\r?\n/);
    const dataLines: string[] = [];
    let event = 'message';
    let id: string | undefined;
    let retry: number | undefined;

    for (const rawLine of lines) {
      if (!rawLine || rawLine.startsWith(':')) {
        continue;
      }

      const separatorIndex = rawLine.indexOf(':');
      const field =
        separatorIndex === -1 ? rawLine : rawLine.slice(0, separatorIndex);
      const value =
        separatorIndex === -1
          ? ''
          : rawLine.slice(separatorIndex + 1).replace(/^\s/, '');

      switch (field) {
        case 'event':
          event = value || 'message';
          break;
        case 'data':
          dataLines.push(value);
          break;
        case 'id':
          id = value || undefined;
          break;
        case 'retry':
          retry = Number(value);
          break;
      }
    }

    const rawData = dataLines.join('\n');
    const data = this.parseEventData(rawData);
    const message = this.toCatiaMessage(data);

    return {
      event,
      data,
      rawData,
      id,
      retry: Number.isFinite(retry) ? retry : undefined,
      message: message ?? undefined,
    };
  }

  private parseEventData(rawData: string): unknown {
    if (!rawData) {
      return null;
    }

    try {
      return JSON.parse(rawData);
    } catch {
      return rawData;
    }
  }

  private toCatiaMessage(data: unknown): CatiaMessageModel | null {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      return null;
    }

    const candidate = data as Partial<CatiaMessageModel>;

    if (typeof candidate.id !== 'number' || typeof candidate.type !== 'string') {
      return null;
    }

    return candidate as CatiaMessageModel;
  }

  private async ensureAccessToken(): Promise<string> {
    const token = this.tokenStorage.getToken();

    if (token) {
      return token;
    }

    await firstValueFrom(this.authenticationService.getCsrfToken());
    const authResponse = await firstValueFrom(
      this.authenticationService.refreshToken()
    );
    const refreshedToken = authResponse?.accessToken;

    if (!refreshedToken) {
      throw new Error('No fue posible obtener un token para el stream SSE');
    }

    return refreshedToken;
  }
}
