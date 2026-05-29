import { AfterViewInit, Component, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { PageTitleComponent } from '../../../../shared/page-title/page-title.component';
import { CommonModule } from '@angular/common';
import { SimplebarAngularModule } from 'simplebar-angular';
import { NavModule } from '../../../../Component/tab/tab.module';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, icons } from 'lucide-angular';
import { DrawerModule } from '../../../../Component/drawer';
import { MDModalModule } from '../../../../Component/modals';
import { MnDropdownComponent } from '../../../../Component/dropdown';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as Prism from 'prismjs';
import { concatMap, from, Subscription, toArray } from 'rxjs';
import Swal from 'sweetalert2';

import { CatiaChatService } from '../../../../core/services/apis/catia/catia-chat.service';
import {
  AiResponse,
  CatiaMessageModel,
  MessageAddress,
  MessageError,
  MessagePricing,
  ResponseMediaMetadata,
} from '../../../../core/services/apis/catia/models/catia-message';
import { DrawerService } from '../../../../Component/drawer/drawer.service';
import { TabContextService } from '../../../../Component/tab/tab-context.service';
import { ToastrService } from 'ngx-toastr';
import { AuthenticationService } from '../../../../core/services/auth/auth.service';
import {
  CatiaUserChatQueryParams,
  CatiaUserFindQueryParams,
  CatiaUserModel,
  RolesUsuario,
} from '../../../../core/services/apis/catia/models/catia-user';
import {
  CATIA_ALLOWED_IMAGE_UPLOADS,
  PendingImageUpload,
  CatiaUploadMode,
} from '../../../../core/services/apis/catia/models/catia-whatsapp';
import { CatiaMessageSource, CatiaMessageType } from '../../../../core/services/apis/catia/models/catia-enum';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    PageTitleComponent,
    CommonModule,
    SimplebarAngularModule,
    NavModule,
    LucideAngularModule,
    DrawerModule,
    MDModalModule,
    MnDropdownComponent,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    TranslateModule,
  ],
  templateUrl: './chat.component.html',
  styles: ``,
  styleUrls: ['./chat.component.scss'],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
})
export class ChatComponent implements AfterViewInit, OnDestroy {
  businessPhoneNumber = 15556323669;
  username: string = 'User';
  showTab: boolean = true;
  profile: string = 'assets/images/users/user-dummy-img.jpg';
  role: string = 'None';
  selectedUser: CatiaUserModel | null = null;
  isEditingUserProfile = false;
  isSavingUserProfile = false;
  profileDraft: {
    previousResponseId: string;
    limitQuestions: number;
    limitStrike: number;
    block: boolean;
    blockingReason: string;
  } | null = null;
  formMessage!: UntypedFormGroup;
  isSendingMessage = false;
  isTogglingIaPause = false;
  uploadMode = CatiaUploadMode.NONE;
  readonly catiaUploadMode = CatiaUploadMode;
  pendingImageUploads: PendingImageUpload[] = [];
  pendingImageUrl = '';
  isUploadingMedia = false;
  showAttachmentMenu = false;
  showImageUrlComposer = false;
  isMenuCollapsed = false; // For Menu Collapse in false
  isChatFinderHidden = true;
  searchTerm = '';
  searchMode: 'identificacion' | 'whatsappPhone' = 'identificacion';
  private readonly scrollThreshold = 120;
  private nowTimestamp = Date.now();
  private timeAgoIntervalId?: ReturnType<typeof setInterval>;
  private refreshMessagesTimeoutId?: ReturnType<typeof setTimeout>;

  messages: CatiaMessageModel[] = [];
  currentMessagePage = 0;
  readonly messagePageSize = 20;
  totalMessages = 0;
  hasMoreMessages = false;
  isLoadingMessages = false;
  messageAddressMap: Record<number, MessageAddress | null> = {};
  messageMediaUrlMap: Record<number, string | null> = {};
  messageMediaLoadingMap: Record<number, boolean> = {};
  messageMediaErrorMap: Record<number, string | null> = {};
  private isPrependingMessages = false;
  private readonly handleMessageScroll = () => this.onMessageScroll();
  private messageStreamSubscription?: Subscription;
  isStreamingSelectedChat = false;
  hasNewMessageAlert = false;
  newMessageAlertCount = 0;
  latestMessagePreview = '';
  latestMessageType = '';
  selectedMessageDetail: CatiaMessageModel | null = null;
  selectedMessageRawDetail: CatiaMessageModel | null = null;
  selectedMessageRawReactions: CatiaMessageModel[] = [];
  selectedMessageMediaMetadata: ResponseMediaMetadata | null = null;
  selectedMessageAiResponses: AiResponse[] = [];
  selectedMessageError: MessageError | null = null;
  selectedMessagePricing: MessagePricing | null = null;
  isLoadingSelectedMessageRawDetail = false;
  isLoadingSelectedMessageMediaMetadata = false;
  isLoadingSelectedMessageAiResponses = false;
  isLoadingSelectedMessageError = false;
  isLoadingSelectedMessagePricing = false;
  messageRawDetailMap: Record<number, CatiaMessageModel | null> = {};
  messageMediaMetadataMap: Record<string, ResponseMediaMetadata | null> = {};
  messageAiResponseMap: Record<number, AiResponse[] | null> = {};
  messageErrorMap: Record<number, MessageError | null> = {};
  messagePricingMap: Record<number, MessagePricing | null> = {};

  searchResults: CatiaUserModel[] = [];
  hasSearchedUser = false;
  isSearchingUser = false;
  currentSearchPage = 0;
  readonly searchPageSize = 10;
  hasMoreSearchResults = false;
  totalSearchResults = 0;
  private lastSearchTriggerScrollTop = -1;
  private readonly handleSearchScroll = () => this.onSearchScroll();

  recentChat: CatiaUserModel[] = [];
  currentRecentChatPage = 0;
  readonly recentChatPageSize = 10;
  isLoadingRecentChats = false;
  hasMoreRecentChats = true;
  totalRecentChats = 0;
  private lastRecentTriggerScrollTop = -1;
  private readonly handleRecentChatScroll = () => this.onRecentChatScroll();

  allConversations: CatiaUserModel[] = [];
  currentUserChatPage = 0;
  readonly userChatPageSize = 10;
  isLoadingUserChats = false;
  hasMoreUserChats = true;
  totalUserChats = 0;
  private lastUserTriggerScrollTop = -1;
  private readonly handleUserChatScroll = () => this.onUserChatScroll();

  private _searchScrollRef: any;
  @ViewChild('searchScrollRef')
  set searchScrollRef(value: any) {
    if (this._searchScrollRef === value) {
      return;
    }

    this.removeSearchScrollListener();
    this._searchScrollRef = value;
    this.registerSearchScrollListener();
  }

  get searchScrollRef(): any {
    return this._searchScrollRef;
  }

  @ViewChild('recentScrollRef') recentScrollRef: any;
  @ViewChild('allScrollRef') allScrollRef: any;
  @ViewChild('messageScrollRef') messageScrollRef: any;
  constructor(
    public formBuilder: UntypedFormBuilder,
    public translate: TranslateService,
    private catiaService: CatiaChatService,
    private authenticationService: AuthenticationService,
    private tabContextService: TabContextService,
    private toastr: ToastrService,
    private drawerService: DrawerService,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    this.loadInitialUserChats();
    this.loadInitialRecentChats();
    this.startTimeAgoClock();

    // Validation
    this.formMessage = this.formBuilder.group({
      chatMsg: [''],
    });
    this.updateMessageInputState();
  }

  ngAfterViewInit() {
    this.registerSearchScrollListener();
    this.registerRecentChatScrollListener();
    this.registerUserChatScrollListener();
    this.registerMessageScrollListener();
  }

  ngAfterContentChecked() {
    Prism.highlightAll();
  }

  ngOnDestroy(): void {
    this.removeSearchScrollListener();
    this.removeRecentChatScrollListener();
    this.removeUserChatScrollListener();
    this.removeMessageScrollListener();
    this.closeMessageStream();
    this.clearMessageMediaUrls();
    this.clearPendingImageState();
    this.stopTimeAgoClock();
    this.clearScheduledMessageRefresh();
  }

  private startTimeAgoClock() {
    this.timeAgoIntervalId = setInterval(() => {
      this.nowTimestamp = Date.now();
    }, 60_000);
  }

  private stopTimeAgoClock() {
    if (this.timeAgoIntervalId) {
      clearInterval(this.timeAgoIntervalId);
      this.timeAgoIntervalId = undefined;
    }
  }

  onSearchScroll() {
    const scrollElement = this.searchScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement || this.isSearchingUser || !this.hasMoreSearchResults) {
      return;
    }

    const distanceToBottom =
      scrollElement.scrollHeight -
      (scrollElement.scrollTop + scrollElement.clientHeight);

    if (
      distanceToBottom <= this.scrollThreshold &&
      scrollElement.scrollTop > this.lastSearchTriggerScrollTop
    ) {
      this.lastSearchTriggerScrollTop = scrollElement.scrollTop;
      this.loadNextSearchPage();
    }
  }

  onRecentChatScroll() {
    const scrollElement = this.recentScrollRef?.SimpleBar?.getScrollElement?.();

    if (
      !scrollElement ||
      this.isLoadingRecentChats ||
      !this.hasMoreRecentChats
    ) {
      return;
    }

    const distanceToBottom =
      scrollElement.scrollHeight -
      (scrollElement.scrollTop + scrollElement.clientHeight);

    if (
      distanceToBottom <= this.scrollThreshold &&
      scrollElement.scrollTop > this.lastRecentTriggerScrollTop
    ) {
      this.lastRecentTriggerScrollTop = scrollElement.scrollTop;
      this.loadNextRecentChatsPage();
    }
  }

  onUserChatScroll() {
    const scrollElement = this.allScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement || this.isLoadingUserChats || !this.hasMoreUserChats) {
      return;
    }

    const distanceToBottom =
      scrollElement.scrollHeight -
      (scrollElement.scrollTop + scrollElement.clientHeight);

    if (
      distanceToBottom <= this.scrollThreshold &&
      scrollElement.scrollTop > this.lastUserTriggerScrollTop
    ) {
      this.lastUserTriggerScrollTop = scrollElement.scrollTop;
      this.loadNextUserChatsPage();
    }
  }

  onMessageScroll() {
    const scrollElement =
      this.messageScrollRef?.SimpleBar?.getScrollElement?.();

    if (
      !scrollElement ||
      this.isLoadingMessages ||
      !this.hasMoreMessages ||
      !this.selectedUser
    ) {
      return;
    }

    if (scrollElement.scrollTop <= this.scrollThreshold) {
      this.loadNextMessageHistoryPage();
    }
  }

  loadInitialMessageHistory() {
    this.clearMessageMediaUrls();
    this.messages = [];
    this.messageAddressMap = {};
    this.messageAiResponseMap = {};
    this.messageMediaUrlMap = {};
    this.messageMediaLoadingMap = {};
    this.messageMediaErrorMap = {};
    this.currentMessagePage = 0;
    this.totalMessages = 0;
    this.hasMoreMessages = false;
    this.isLoadingMessages = false;
    this.isPrependingMessages = false;
    this.getMessageHistory(0, true);
  }

  openMessageStream(phone: string) {
    const sanitizedPhone = phone.trim();

    if (!sanitizedPhone) {
      return;
    }

    this.closeMessageStream();
    this.isStreamingSelectedChat = true;

    this.messageStreamSubscription = this.catiaService
      .streamMessages(sanitizedPhone)
      .subscribe({
        next: (streamEvent) => {
          // El stream SSE corre con fetch().getReader(), que zone.js NO patchea,
          // asi que las emisiones llegan fuera del NgZone y CD no se dispara
          // automaticamente. Re-entramos al zone para que la vista reaccione.
          this.ngZone.run(() => {
            if (streamEvent.event === 'connected') {
              return;
            }

            const payload = streamEvent.payload;
            const eventType = payload?.eventType ?? streamEvent.event;
            const streamMessage = streamEvent.message ?? payload?.message ?? null;

            if (!payload?.phone || payload.phone !== sanitizedPhone || !streamMessage) {
              return;
            }

            const shouldAutoScroll = this.isMessageScrollNearBottom();
            const isReadEvent =
              eventType === 'message_read' || payload?.status === 'read';

            this.upsertStreamMessage(streamMessage, shouldAutoScroll);

            if (isReadEvent) {
              return;
            }

            if (shouldAutoScroll) {
              return;
            }

            this.hasNewMessageAlert = true;
            this.newMessageAlertCount += 1;
            this.latestMessagePreview = this.getStreamMessagePreview(streamMessage);
            this.latestMessageType = streamMessage.type?.trim() ?? '';
          });
        },
        error: (err: unknown) => {
          this.ngZone.run(() => {
            this.isStreamingSelectedChat = false;
            console.error('Error en stream SSE:', err);
          });
        },
        complete: () => {
          this.ngZone.run(() => {
            this.isStreamingSelectedChat = false;
          });
        },
      });
  }

  closeMessageStream() {
    this.messageStreamSubscription?.unsubscribe();
    this.messageStreamSubscription = undefined;
    this.isStreamingSelectedChat = false;
  }

  private clearScheduledMessageRefresh() {
    if (this.refreshMessagesTimeoutId) {
      clearTimeout(this.refreshMessagesTimeoutId);
      this.refreshMessagesTimeoutId = undefined;
    }
  }

  private scheduleSelectedChatRefresh(delayMs = 800) {
    this.clearScheduledMessageRefresh();

    this.refreshMessagesTimeoutId = setTimeout(() => {
      this.refreshMessagesTimeoutId = undefined;
      this.refreshSelectedChatMessages();
    }, delayMs);
  }

  refreshSelectedChatMessages(clearAlert = false) {
    if (!this.selectedUser) {
      return;
    }

    if (clearAlert) {
      this.hasNewMessageAlert = false;
      this.newMessageAlertCount = 0;
      this.latestMessagePreview = '';
      this.latestMessageType = '';
    }

    this.loadInitialMessageHistory();
  }

  private getStreamMessagePreview(message: CatiaMessageModel): string {
    const preview = message.textBody?.trim() || message.mediaCaption?.trim();
    return preview || this.getMessageBubbleText(message);
  }

  private mergeMessageState(
    incomingMessage: CatiaMessageModel,
    existingMessage?: CatiaMessageModel
  ): CatiaMessageModel {
    if (!existingMessage) {
      return incomingMessage;
    }

    return {
      ...existingMessage,
      ...incomingMessage,
      sentAt: incomingMessage.sentAt ?? existingMessage.sentAt,
      deliveredAt: incomingMessage.deliveredAt ?? existingMessage.deliveredAt,
      readAt: incomingMessage.readAt ?? existingMessage.readAt,
      failedAt: incomingMessage.failedAt ?? existingMessage.failedAt,
      mediaId: incomingMessage.mediaId ?? existingMessage.mediaId,
      mediaUrl: incomingMessage.mediaUrl ?? existingMessage.mediaUrl,
      mediaMimeType:
        incomingMessage.mediaMimeType ?? existingMessage.mediaMimeType,
      mediaFilename:
        incomingMessage.mediaFilename ?? existingMessage.mediaFilename,
      mediaCaption: incomingMessage.mediaCaption ?? existingMessage.mediaCaption,
      textBody: incomingMessage.textBody ?? existingMessage.textBody,
      aiResponses: incomingMessage.aiResponses?.length
        ? incomingMessage.aiResponses
        : existingMessage.aiResponses,
      messageTemplate:
        incomingMessage.messageTemplate ?? existingMessage.messageTemplate,
      messagePricing:
        incomingMessage.messagePricing ?? existingMessage.messagePricing,
      messageAddres:
        incomingMessage.messageAddres ?? existingMessage.messageAddres,
      messageError: incomingMessage.messageError ?? existingMessage.messageError,
    };
  }

  private findMessageIndex(message: CatiaMessageModel): number {
    return this.messages.findIndex(
      (currentMessage) =>
        currentMessage.id === message.id ||
        (!!message.wamid && currentMessage.wamid === message.wamid)
    );
  }

  private upsertStreamMessage(
    message: CatiaMessageModel,
    scrollToBottom = false
  ) {
    const existingIndex = this.findMessageIndex(message);

    if (existingIndex >= 0) {
      const existingMessage = this.messages[existingIndex];
      const mergedMessage = this.mergeMessageState(message, existingMessage);

      this.messages = this.messages.map((currentMessage, index) =>
        index === existingIndex ? mergedMessage : currentMessage
      );
      message = mergedMessage;
    } else {
      this.messages = [...this.messages, message];
      this.totalMessages += 1;
    }

    this.messages = [...this.messages].sort((left, right) => {
      const leftTimestamp = this.getMessageTimestampMs(left) ?? 0;
      const rightTimestamp = this.getMessageTimestampMs(right) ?? 0;
      return leftTimestamp - rightTimestamp;
    });

    if (message.messageAddres) {
      this.messageAddressMap[message.id] = message.messageAddres;
    }

    if (message.messagePricing) {
      this.messagePricingMap[message.id] = message.messagePricing;
    }

    if (message.messageError) {
      this.messageErrorMap[message.id] = message.messageError;
    }

    if (message.aiResponses) {
      this.messageAiResponseMap[message.id] = message.aiResponses;
    }

    if (this.selectedMessageDetail?.id === message.id) {
      this.selectedMessageDetail = {
        ...this.selectedMessageDetail,
        ...message,
      };
    }

    if (this.selectedMessageRawDetail?.id === message.id) {
      this.selectedMessageRawDetail = {
        ...this.selectedMessageRawDetail,
        ...message,
      };
    }

    this.ensureLocationMessagesLoaded([message]);

    if (scrollToBottom) {
      setTimeout(() => {
        const scrollElement =
          this.messageScrollRef?.SimpleBar?.getScrollElement?.();

        if (scrollElement) {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      });
    }
  }

  loadNextMessageHistoryPage() {
    if (!this.selectedUser || this.isLoadingMessages || !this.hasMoreMessages) {
      return;
    }

    this.getMessageHistory(this.currentMessagePage + 1);
  }

  registerMessageScrollListener() {
    const scrollElement =
      this.messageScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement) {
      return;
    }

    scrollElement.addEventListener('scroll', this.handleMessageScroll);
  }

  removeMessageScrollListener() {
    const scrollElement =
      this.messageScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement) {
      return;
    }

    scrollElement.removeEventListener('scroll', this.handleMessageScroll);
  }

  ensureMessageHistoryFillViewport() {
    const scrollElement =
      this.messageScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement || this.isLoadingMessages || !this.hasMoreMessages) {
      return;
    }

    const hasScrollableOverflow =
      scrollElement.scrollHeight > scrollElement.clientHeight + 8;

    if (!hasScrollableOverflow) {
      this.loadNextMessageHistoryPage();
    }
  }

  private isMessageScrollNearBottom(threshold = this.scrollThreshold): boolean {
    const scrollElement =
      this.messageScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement) {
      return true;
    }

    const distanceToBottom =
      scrollElement.scrollHeight -
      (scrollElement.scrollTop + scrollElement.clientHeight);

    return distanceToBottom <= threshold;
  }

  isOutgoingMessage(message: CatiaMessageModel): boolean {
    return message.direction === 'OUTBOUND';
  }

  /**
   * Lista de mensajes que se renderizan como burbuja independiente. Las
   * reacciones cuyo mensaje objetivo (relatedWamid) esta presente en la lista
   * se ocultan aqui porque se dibujan como badge sobre la burbuja del mensaje
   * reaccionado. Si el mensaje objetivo no esta cargado, la reaccion queda
   * como bubble (fallback para no perderla).
   */
  get displayMessages(): CatiaMessageModel[] {
    return this.messages.filter((m) => !this.isAttachedReaction(m));
  }

  private isAttachedReaction(message: CatiaMessageModel): boolean {
    if (message.type !== 'REACTION') return false;
    if (!message.relatedWamid) return false;
    // Ocultamos TODA reaccion (con o sin emoji) cuyo target esta cargado.
    // Las que vienen con emoji=null son eventos "quito la reaccion" y deben
    // actualizar el badge flotante, no aparecer como bubble suelto.
    return this.messages.some((m) => m.wamid === message.relatedWamid);
  }

  /**
   * Calcula las reacciones efectivas sobre un mensaje. Para cada usuario que
   * envio reacciones nos quedamos con la ULTIMA (por timestamp); si esa ultima
   * trae emoji=null significa que el usuario quito su reaccion y no se cuenta.
   * Despues agrupamos por emoji y sumamos para el badge tipo WhatsApp.
   */
  getMessageReactions(message: CatiaMessageModel): { emoji: string; count: number }[] {
    if (!message.wamid) return [];

    const latestByUser = new Map<string, CatiaMessageModel>();
    for (const m of this.messages) {
      if (m.type !== 'REACTION') continue;
      if (m.relatedWamid !== message.wamid) continue;
      const userKey = m.fromPhone ?? '';
      const prev = latestByUser.get(userKey);
      if (!prev || (m.timestamp ?? 0) >= (prev.timestamp ?? 0)) {
        latestByUser.set(userKey, m);
      }
    }

    const counts = new Map<string, number>();
    for (const reaction of latestByUser.values()) {
      if (!reaction.reactionEmoji) continue;
      counts.set(reaction.reactionEmoji, (counts.get(reaction.reactionEmoji) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([emoji, count]) => ({ emoji, count }));
  }

  getMessageAvatar(message: CatiaMessageModel): string {
    if (message.source === 'IA' || message.source === 'BACK_END') {
      return 'assets/images/users/catia-off-background.png';
    }

    return 'assets/images/users/user-dummy-img.jpg';
  }

  private normalizeEpoch(value?: number | null): number | null {
    if (!value) {
      return null;
    }

    return value < 1_000_000_000_000 ? value * 1000 : value;
  }

  getMessageTimestampMs(message: CatiaMessageModel): number | null {
    return this.normalizeEpoch(message.sentAt ?? message.timestamp);
  }

  isMediaMessage(message: CatiaMessageModel): boolean {
    return (
      message.type === 'IMAGE' ||
      message.type === 'VIDEO' ||
      message.type === 'AUDIO' ||
      message.type === 'DOCUMENT' ||
      message.type === 'STICKER'
    );
  }

  isMessageMediaLikelyExpired(message: CatiaMessageModel): boolean {
    const timestampMs = this.getMessageTimestampMs(message);

    if (!timestampMs) {
      return false;
    }

    const ageMs = Date.now() - timestampMs;
    const twentyNineDaysMs = 29 * 24 * 60 * 60 * 1000;

    return ageMs >= twentyNineDaysMs;
  }

  canLoadMessageMedia(message: CatiaMessageModel): boolean {
    return (
      this.isMediaMessage(message) &&
      (!!message.mediaId?.trim() || !!message.mediaUrl?.trim())
    );
  }

  getMessageMediaUrl(message: CatiaMessageModel): string | null {
    return (
      this.messageMediaUrlMap[message.id] ?? message.mediaUrl?.trim() ?? null
    );
  }

  isMessageMediaLoading(message: CatiaMessageModel): boolean {
    return !!this.messageMediaLoadingMap[message.id];
  }

  getMessageMediaError(message: CatiaMessageModel): string | null {
    return this.messageMediaErrorMap[message.id] ?? null;
  }

  getMessageMediaTitle(message: CatiaMessageModel): string {
    switch (message.type) {
      case 'IMAGE':
        return 'Imagen compartida';
      case 'VIDEO':
        return 'Video compartido';
      case 'AUDIO':
        return 'Audio compartido';
      case 'DOCUMENT':
        return message.mediaFilename?.trim() || 'Documento compartido';
      case 'STICKER':
        return 'Sticker compartido';
      default:
        return 'Archivo multimedia';
    }
  }

  getMessageMediaSubtitle(message: CatiaMessageModel): string {
    if (message.mediaFilename?.trim() && message.type !== 'DOCUMENT') {
      return message.mediaFilename;
    }

    if (message.mediaMimeType?.trim()) {
      return message.mediaMimeType;
    }

    if (message.mediaUrl?.trim()) {
      return 'Disponible por URL';
    }

    return this.isMessageMediaLikelyExpired(message)
      ? 'Media antigua, puede haber expirado en WhatsApp'
      : 'Disponible bajo demanda';
  }

  getMessageMediaActionLabel(message: CatiaMessageModel): string {
    const hasUrl = !!this.getMessageMediaUrl(message);
    const expired = this.isMessageMediaLikelyExpired(message);

    if (message.type === 'DOCUMENT') {
      if (hasUrl) {
        return 'Abrir documento';
      }

      return expired ? 'Intentar recuperar' : 'Descargar';
    }

    if (hasUrl) {
      return 'Abrir en pestaña';
    }

    switch (message.type) {
      case 'IMAGE':
        return expired ? 'Intentar recuperar' : 'Ver imagen';
      case 'VIDEO':
        return expired ? 'Intentar recuperar' : 'Cargar video';
      case 'AUDIO':
        return expired ? 'Intentar recuperar' : 'Cargar audio';
      case 'STICKER':
        return expired ? 'Intentar recuperar' : 'Ver sticker';
      default:
        return expired ? 'Intentar recuperar' : 'Cargar archivo';
    }
  }

  loadMessageMedia(message: CatiaMessageModel) {
    if (
      !this.canLoadMessageMedia(message) ||
      this.isMessageMediaLoading(message)
    ) {
      return;
    }

    const existingUrl = this.getMessageMediaUrl(message);

    if (existingUrl) {
      this.openMessageMediaUrl(message, existingUrl);
      return;
    }

    this.messageMediaLoadingMap[message.id] = true;
    this.messageMediaErrorMap[message.id] = null;

    this.catiaService.downloadWhatsAppMedia(message.mediaId!.trim()).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.messageMediaUrlMap[message.id] = objectUrl;
        this.messageMediaLoadingMap[message.id] = false;

        if (message.type === 'DOCUMENT') {
          this.openMessageMediaUrl(message, objectUrl);
        }
      },
      error: (err: any) => {
        this.messageMediaLoadingMap[message.id] = false;
        this.messageMediaErrorMap[message.id] =
          err?.status === 404
            ? 'El archivo ya no está disponible en WhatsApp.'
            : 'No fue posible recuperar este archivo.';
        console.error('Error descargando media del mensaje:', err);
      },
    });
  }

  openMessageMediaUrl(message: CatiaMessageModel, url?: string | null) {
    const targetUrl = url ?? this.getMessageMediaUrl(message);

    if (!targetUrl) {
      return;
    }

    if (message.type === 'DOCUMENT') {
      const anchor = document.createElement('a');
      anchor.href = targetUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.download = message.mediaFilename?.trim() || 'documento';
      anchor.click();
      return;
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  }

  shouldRenderMessageMediaInline(message: CatiaMessageModel): boolean {
    if (!this.isMediaMessage(message)) {
      return false;
    }

    if (message.type === 'DOCUMENT') {
      return false;
    }

    return !!this.getMessageMediaUrl(message);
  }

  isRenderableSticker(message: CatiaMessageModel): boolean {
    return (
      message.type === 'STICKER' &&
      (!!this.getMessageMediaUrl(message) || this.canLoadMessageMedia(message))
    );
  }

  getMessageBubbleText(message: CatiaMessageModel): string {
    if (message.textBody?.trim()) {
      return message.textBody;
    }

    if (message.mediaCaption?.trim()) {
      return message.mediaCaption;
    }

    switch (message.type) {
      case 'IMAGE':
        return '[Imagen]';
      case 'VIDEO':
        return '[Video]';
      case 'AUDIO':
        return '[Audio]';
      case 'DOCUMENT':
        return `[Documento] ${message.mediaFilename ?? ''}`.trim();
      case 'LOCATION':
        return '[Ubicación]';
      case 'REACTION':
        return `[Reacción] ${message.reactionEmoji ?? ''}`.trim();
      case 'TEMPLATE':
        return `[Template] ${
          message.messageTemplate?.templateName ?? ''
        }`.trim();
      default:
        return `[${message.type}]`;
    }
  }

  getMessageTime(value?: number | null): string {
    if (!value) {
      return '';
    }

    return new Intl.DateTimeFormat('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(this.normalizeEpoch(value) ?? value));
  }

  shouldShowOutgoingReceipt(message: CatiaMessageModel): boolean {
    return message.direction === 'OUTBOUND' && !message.failedAt;
  }

  getOutgoingReceiptIconName(
    message: CatiaMessageModel
  ): 'check' | 'check-check' {
    if (message.deliveredAt || message.readAt) {
      return 'check-check';
    }

    return 'check';
  }

  getOutgoingReceiptClass(message: CatiaMessageModel): string {
    if (message.readAt) {
      return 'text-sky-500 dark:text-sky-300';
    }

    return 'text-slate-400 dark:text-zink-300';
  }

  getOutgoingReceiptLabel(message: CatiaMessageModel): string {
    if (message.readAt) {
      return `Leído ${this.formatMessageDateTime(message.readAt)}`;
    }

    if (message.deliveredAt) {
      return `Entregado ${this.formatMessageDateTime(message.deliveredAt)}`;
    }

    if (message.sentAt) {
      return `Enviado ${this.formatMessageDateTime(message.sentAt)}`;
    }

    return 'Enviado a WhatsApp';
  }

  ensureLocationMessagesLoaded(messages: CatiaMessageModel[]) {
    for (const message of messages) {
      if (message.type !== 'LOCATION' || !message.id) {
        continue;
      }

      if (message.messageAddres) {
        this.messageAddressMap[message.id] = message.messageAddres;
        continue;
      }

      if (
        Object.prototype.hasOwnProperty.call(this.messageAddressMap, message.id)
      ) {
        continue;
      }

      this.messageAddressMap[message.id] = null;

      this.catiaService.getMessageAddress(message.id).subscribe({
        next: (address) => {
          this.messageAddressMap[message.id] = address;
        },
        error: (err: unknown) => {
          console.error('Error cargando ubicacion del mensaje:', err);
        },
      });
    }
  }

  getMessageLocation(message: CatiaMessageModel): MessageAddress | null {
    if (message.messageAddres) {
      return message.messageAddres;
    }

    return this.messageAddressMap[message.id] ?? null;
  }

  getMessageLocationTitle(message: CatiaMessageModel): string {
    const location = this.getMessageLocation(message);

    if (!location) {
      return 'Ubicación compartida';
    }

    return (
      location.locationName?.trim() ||
      location.locationAddress?.trim() ||
      'Ubicación compartida'
    );
  }

  getMessageLocationSubtitle(message: CatiaMessageModel): string {
    const location = this.getMessageLocation(message);

    if (!location) {
      return 'Cargando ubicación...';
    }

    if (location.locationAddress?.trim()) {
      return location.locationAddress;
    }

    if (
      typeof location.latitude === 'number' &&
      typeof location.longitude === 'number'
    ) {
      return `${location.latitude}, ${location.longitude}`;
    }

    return 'Ubicación compartida';
  }

  getMessageLocationMapUrl(message: CatiaMessageModel): string | null {
    const location = this.getMessageLocation(message);

    if (
      typeof location?.latitude !== 'number' ||
      typeof location?.longitude !== 'number'
    ) {
      return null;
    }

    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  }

  private clearMessageMediaUrls() {
    for (const url of Object.values(this.messageMediaUrlMap)) {
      if (url) {
        URL.revokeObjectURL(url);
      }
    }
  }

  getMessageAlertLabel(): string {
    if (this.newMessageAlertCount <= 1) {
      return 'Hay un mensaje nuevo';
    }

    return `Hay ${this.newMessageAlertCount} mensajes nuevos`;
  }

  canOpenMessageMetadata(message: CatiaMessageModel): boolean {
    const catiaOwnedSource =
      message.source === 'IA' ||
      message.source === 'BACK_END' ||
      message.source === 'BACK_OFFICE';

    const likelyCatiaOutbound =
      message.direction === 'OUTBOUND' && message.source !== 'USER';

    const hasAiMetadata =
      (message.aiResponses?.length ?? 0) > 0 ||
      Object.prototype.hasOwnProperty.call(
        this.messageAiResponseMap,
        message.id
      );

    return catiaOwnedSource || likelyCatiaOutbound || hasAiMetadata;
  }

  openMessageMetadata(message: CatiaMessageModel) {
    if (!this.canOpenMessageMetadata(message)) {
      return;
    }

    this.selectedMessageDetail = message;
    this.selectedMessageAiResponses = message.aiResponses ?? [];
    this.selectedMessageError = message.messageError ?? null;
    this.selectedMessagePricing = message.messagePricing ?? null;
    this.isLoadingSelectedMessageAiResponses = false;
    this.isLoadingSelectedMessageError = false;
    this.isLoadingSelectedMessagePricing = false;
    this.drawerService.open('drawerMessageMeta');

    if (message.messageError) {
      this.messageErrorMap[message.id] = message.messageError;
    } else if (
      Object.prototype.hasOwnProperty.call(this.messageErrorMap, message.id)
    ) {
      this.selectedMessageError = this.messageErrorMap[message.id] ?? null;
    } else {
      this.isLoadingSelectedMessageError = true;

      this.catiaService.getMessageError(message.id).subscribe({
        next: (messageError) => {
          this.selectedMessageError = messageError;
          this.messageErrorMap[message.id] = messageError;
          this.isLoadingSelectedMessageError = false;
        },
        error: (err: any) => {
          this.selectedMessageError = null;
          this.messageErrorMap[message.id] = null;
          this.isLoadingSelectedMessageError = false;

          if (err?.status !== 404) {
            console.error('Error cargando error del mensaje:', err);
          }
        },
      });
    }

    if (message.messagePricing) {
      this.messagePricingMap[message.id] = message.messagePricing;
    } else if (
      Object.prototype.hasOwnProperty.call(this.messagePricingMap, message.id)
    ) {
      this.selectedMessagePricing = this.messagePricingMap[message.id] ?? null;
    } else {
      this.isLoadingSelectedMessagePricing = true;

      this.catiaService.getMessagePricing(message.id).subscribe({
        next: (pricing) => {
          this.selectedMessagePricing = pricing;
          this.messagePricingMap[message.id] = pricing;
          this.isLoadingSelectedMessagePricing = false;
        },
        error: (err: any) => {
          this.selectedMessagePricing = null;
          this.messagePricingMap[message.id] = null;
          this.isLoadingSelectedMessagePricing = false;

          if (err?.status !== 404) {
            console.error('Error cargando pricing del mensaje:', err);
          }
        },
      });
    }

    if (this.selectedMessageAiResponses.length > 0) {
      this.messageAiResponseMap[message.id] = this.selectedMessageAiResponses;
    } else if (
      Object.prototype.hasOwnProperty.call(
        this.messageAiResponseMap,
        message.id
      )
    ) {
      this.selectedMessageAiResponses =
        this.messageAiResponseMap[message.id] ?? [];
    } else {
      this.isLoadingSelectedMessageAiResponses = true;

      this.catiaService.getAiResponses(message.id).subscribe({
        next: (aiResponses) => {
          this.selectedMessageAiResponses = aiResponses ?? [];
          this.messageAiResponseMap[message.id] =
            this.selectedMessageAiResponses;
          this.isLoadingSelectedMessageAiResponses = false;
        },
        error: (err: any) => {
          this.selectedMessageAiResponses = [];
          this.messageAiResponseMap[message.id] = [];
          this.isLoadingSelectedMessageAiResponses = false;

          if (err?.status !== 404) {
            console.error('Error cargando metadata IA del mensaje:', err);
          }
        },
      });
    }
  }

  closeMessageMetadata() {
    this.selectedMessageDetail = null;
    this.selectedMessageAiResponses = [];
    this.selectedMessageError = null;
    this.selectedMessagePricing = null;
    this.isLoadingSelectedMessageAiResponses = false;
    this.isLoadingSelectedMessageError = false;
    this.isLoadingSelectedMessagePricing = false;
    this.drawerService.close('drawerMessageMeta');
  }

  canOpenMessageRawAudit(message: CatiaMessageModel): boolean {
    return !!message?.id;
  }

  openMessageRawAuditForMessage(message: CatiaMessageModel) {
    if (!this.canOpenMessageRawAudit(message)) {
      return;
    }

    this.selectedMessageRawDetail = null;
    this.selectedMessageRawReactions = this.collectMessageRawReactions(message);
    this.isLoadingSelectedMessageRawDetail = false;
    this.drawerService.open('drawerMessageRaw');

    if (
      Object.prototype.hasOwnProperty.call(this.messageRawDetailMap, message.id)
    ) {
      this.selectedMessageRawDetail = this.messageRawDetailMap[message.id];
      this.loadSelectedMessageMediaMetadata(this.selectedMessageRawDetail);
      return;
    }

    this.isLoadingSelectedMessageRawDetail = true;

    this.catiaService.findMessageId(message.id).subscribe({
      next: (fullMessage) => {
        this.selectedMessageRawDetail = fullMessage;
        this.messageRawDetailMap[message.id] = fullMessage;
        this.isLoadingSelectedMessageRawDetail = false;
        this.loadSelectedMessageMediaMetadata(fullMessage);
      },
      error: (err: any) => {
        this.selectedMessageRawDetail = null;
        this.messageRawDetailMap[message.id] = null;
        this.isLoadingSelectedMessageRawDetail = false;
        this.toastr.error(JSON.stringify(err));
        console.error('Error:', err);
      },
    });
  }

  openMessageRawAudit() {
    if (!this.selectedMessageDetail?.id) {
      return;
    }

    this.openMessageRawAuditForMessage(this.selectedMessageDetail);
  }

  closeMessageRawAudit() {
    this.selectedMessageRawDetail = null;
    this.selectedMessageRawReactions = [];
    this.selectedMessageMediaMetadata = null;
    this.isLoadingSelectedMessageRawDetail = false;
    this.isLoadingSelectedMessageMediaMetadata = false;
    this.drawerService.close('drawerMessageRaw');
  }

  /**
   * Devuelve las reacciones que apuntan a ese mensaje (relatedWamid match),
   * ordenadas por timestamp ascendente para que en la auditoria se lean en el
   * orden cronologico en que llegaron. Incluye eventos de "quitar reaccion"
   * (emoji null) por trazabilidad completa.
   */
  private collectMessageRawReactions(message: CatiaMessageModel): CatiaMessageModel[] {
    if (!message?.wamid) return [];
    return this.messages
      .filter((m) => m.type === 'REACTION' && m.relatedWamid === message.wamid)
      .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  }

  loadSelectedMessageMediaMetadata(message?: CatiaMessageModel | null) {
    const mediaId = message?.mediaId?.trim();

    this.selectedMessageMediaMetadata = null;
    this.isLoadingSelectedMessageMediaMetadata = false;

    if (!mediaId) {
      return;
    }

    if (
      Object.prototype.hasOwnProperty.call(
        this.messageMediaMetadataMap,
        mediaId
      )
    ) {
      this.selectedMessageMediaMetadata = this.messageMediaMetadataMap[mediaId];
      return;
    }

    this.isLoadingSelectedMessageMediaMetadata = true;

    this.catiaService.getMediaMetadata(mediaId).subscribe({
      next: (metadata) => {
        this.selectedMessageMediaMetadata = metadata;
        this.messageMediaMetadataMap[mediaId] = metadata;
        this.isLoadingSelectedMessageMediaMetadata = false;
      },
      error: (err: any) => {
        this.selectedMessageMediaMetadata = null;
        this.messageMediaMetadataMap[mediaId] = null;
        this.isLoadingSelectedMessageMediaMetadata = false;

        if (err?.status !== 404) {
          console.error('Error cargando metadata del media:', err);
        }
      },
    });
  }

  formatFileSize(bytes?: number): string {
    if (!bytes || bytes <= 0) {
      return 'N/A';
    }

    if (bytes < 1024) {
      return `${bytes} B`;
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  getMessageSourceLabel(message?: CatiaMessageModel | null): string {
    if (!message) {
      return 'N/A';
    }

    switch (message.source) {
      case 'IA':
        return 'IA';
      case 'BACK_END':
        return 'Back-end';
      case 'BACK_OFFICE':
        return 'BackOffice';
      case 'USER':
        return 'Usuario';
      default:
        return message.source;
    }
  }

  getMessageDirectionLabel(message?: CatiaMessageModel | null): string {
    if (!message) {
      return 'N/A';
    }

    return message.direction === 'OUTBOUND' ? 'Salida' : 'Entrada';
  }

  formatMessageDateTime(value?: number | null): string {
    if (!value) {
      return 'N/A';
    }

    return new Intl.DateTimeFormat('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  formatStructuredText(value?: string | null): string {
    const content = value?.trim();

    if (!content) {
      return 'N/A';
    }

    try {
      let parsed: unknown = JSON.parse(content);

      if (typeof parsed === 'string') {
        const nestedContent = parsed;

        try {
          parsed = JSON.parse(nestedContent);
        } catch {
          return nestedContent;
        }
      }

      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  }

  formatJsonValue(value: unknown): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }

    if (typeof value === 'string') {
      return this.formatStructuredText(value);
    }

    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }

  getPricingBillableLabel(pricing?: MessagePricing | null): string {
    if (!pricing) {
      return 'N/A';
    }

    if (pricing.pricingBillable === true) {
      return 'Facturable';
    }

    if (pricing.pricingBillable === false) {
      return 'No facturable';
    }

    return 'N/A';
  }

  hasMessageFailure(message?: CatiaMessageModel | null): boolean {
    return !!(
      message?.failedAt ||
      message?.messageError ||
      (message?.id &&
        Object.prototype.hasOwnProperty.call(
          this.messageErrorMap,
          message.id
        ) &&
        this.messageErrorMap[message.id])
    );
  }

  // Cargar Historial de chat
  getMessageHistory(page: number, reset = false) {
    const phone = this.selectedUser?.whatsappPhone?.trim();

    if (!phone) {
      return;
    }

    this.isLoadingMessages = true;

    const scrollElement =
      this.messageScrollRef?.SimpleBar?.getScrollElement?.();
    const previousScrollHeight = scrollElement?.scrollHeight ?? 0;

    this.catiaService
      .getMessageHistory({
        phone,
        page,
        size: this.messagePageSize,
        direction: 'desc',
      })
      .subscribe({
        next: (pageMessages) => {
          const incomingMessages = [...(pageMessages.content ?? [])]
            .reverse()
            .map((message) => {
              const existingIndex = this.findMessageIndex(message);
              const existingMessage =
                existingIndex >= 0 ? this.messages[existingIndex] : undefined;
              return this.mergeMessageState(message, existingMessage);
            });

          if (reset || pageMessages.page.number === 0) {
            this.messages = incomingMessages;
          } else {
            this.isPrependingMessages = true;
            this.messages = [...incomingMessages, ...this.messages];
          }

          this.currentMessagePage = pageMessages.page.number;
          this.totalMessages = pageMessages.page.totalElements;
          this.hasMoreMessages =
            pageMessages.page.number + 1 < pageMessages.page.totalPages;
          this.isLoadingMessages = false;
          this.ensureLocationMessagesLoaded(incomingMessages);

          setTimeout(() => {
            this.registerMessageScrollListener();

            const currentScrollElement =
              this.messageScrollRef?.SimpleBar?.getScrollElement?.();

            if (!currentScrollElement) {
              return;
            }

            if (reset) {
              currentScrollElement.scrollTop =
                currentScrollElement.scrollHeight;
            } else if (this.isPrependingMessages) {
              const currentScrollHeight = currentScrollElement.scrollHeight;
              currentScrollElement.scrollTop =
                currentScrollHeight - previousScrollHeight;
              this.isPrependingMessages = false;
            }

            this.ensureMessageHistoryFillViewport();
          });
        },
        error: (err: any) => {
          this.isLoadingMessages = false;
          this.toastr.error(JSON.stringify(err));
          console.error('Error:', err);
        },
      });
  }

  // Buscar usuario por identificacion(DNI/Pasaporte) o whatsappPhone(Numero Telefonico)
  findUserChat(params: CatiaUserFindQueryParams, reset = false) {
    const searchValue =
      params.identificacion?.trim() ?? params.whatsappPhone?.trim() ?? '';

    if (!searchValue) {
      this.searchResults = [];
      this.hasSearchedUser = false;
      this.hasMoreSearchResults = false;
      this.totalSearchResults = 0;
      this.toastr.info('Escribe una identificación o un número de teléfono');
      return;
    }

    this.isSearchingUser = true;
    this.hasSearchedUser = true;

    this.catiaService.findUserChat(params).subscribe({
      next: (pageUsers) => {
        const newUsers = pageUsers.content ?? [];

        this.searchResults =
          reset || pageUsers.page.number === 0
            ? newUsers
            : [...this.searchResults, ...newUsers];
        this.currentSearchPage = pageUsers.page.number;
        this.totalSearchResults = pageUsers.page.totalElements;
        this.hasMoreSearchResults =
          pageUsers.page.number + 1 < pageUsers.page.totalPages;
        this.isSearchingUser = false;

        setTimeout(() => {
          this.registerSearchScrollListener();
          this.ensureSearchResultsFillViewport();
        });

        if (reset && this.searchResults.length === 0) {
          this.toastr.info('No se encontraron usuarios para esa búsqueda');
        }
      },
      error: (err: any) => {
        this.isSearchingUser = false;
        this.searchResults = [];
        this.hasMoreSearchResults = false;
        this.totalSearchResults = 0;

        if (err.status === 404) {
          this.toastr.info(
            err?.error?.error ?? 'No se encontraron usuarios para esa búsqueda'
          );
          return;
        }

        this.toastr.error(JSON.stringify(err));
        console.error('Error:', err);
      },
    });
  }

  // Obtener lista de conversaciones
  listUserChats(params: CatiaUserChatQueryParams) {
    this.catiaService.listUserChats(params).subscribe({
      next: (pageUsers) => {
        const newUsers = pageUsers.content ?? [];

        this.allConversations =
          params.page && params.page > 0
            ? [...this.allConversations, ...newUsers]
            : newUsers;

        this.currentUserChatPage = pageUsers.page.number;
        this.totalUserChats = pageUsers.page.totalElements;
        this.hasMoreUserChats =
          pageUsers.page.number + 1 < pageUsers.page.totalPages;
        this.isLoadingUserChats = false;
      },
      error: (err: any) => {
        this.isLoadingUserChats = false;
        this.toastr.error(JSON.stringify(err));
        console.error('Error:', err);
      },
    });
  }

  // Obtener lista de conversaciones dentro 24h
  recentUserChats(params: CatiaUserChatQueryParams) {
    this.catiaService.listUserChatsBySessionStart(params).subscribe({
      next: (pageUsers) => {
        const newUsers = pageUsers.content ?? [];

        this.recentChat =
          params.page && params.page > 0
            ? [...this.recentChat, ...newUsers]
            : newUsers;

        this.currentRecentChatPage = pageUsers.page.number;
        this.totalRecentChats = pageUsers.page.totalElements;
        this.hasMoreRecentChats =
          pageUsers.page.number + 1 < pageUsers.page.totalPages;
        this.isLoadingRecentChats = false;
      },
      error: (err: any) => {
        this.isLoadingRecentChats = false;
        this.toastr.error(JSON.stringify(err));
        console.error('Error:', err);
      },
    });
  }

  // Busqueda de un mensaje por ID
  findMessageId(messageId: number) {
    this.catiaService.findMessageId(messageId).subscribe({
      next: (message) => {
        console.log('Mensaje encontrado: ', message);
      },
      error: (err: any) => {
        this.toastr.error(JSON.stringify(err));
        console.error('Error:', err);
      },
    });
  }

  private sanitizePhoneToNumber(value?: string | null): number | null {
    const digits = value?.replace(/\D/g, '') ?? '';

    if (!digits) {
      return null;
    }

    const parsed = Number(digits);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private getCurrentOperatorName(): string {
    return (
      this.authenticationService.currentUserValue?.username?.trim() ||
      'Anonymus'
    );
  }

  private updateMessageInputState() {
    const chatControl = this.formMessage?.get('chatMsg');

    if (!chatControl) {
      return;
    }

    const shouldDisable = !this.selectedUser || this.isSendingMessage;

    if (shouldDisable && chatControl.enabled) {
      chatControl.disable({ emitEvent: false });
      return;
    }

    if (!shouldDisable && chatControl.disabled) {
      chatControl.enable({ emitEvent: false });
    }
  }

  toggleAttachmentMenu() {
    if (!this.selectedUser || this.isSendingMessage) {
      return;
    }

    this.showAttachmentMenu = !this.showAttachmentMenu;
  }

  openFileAttachmentPicker(fileInput: HTMLInputElement) {
    if (this.uploadMode !== CatiaUploadMode.IMAGE_FILE) {
      this.clearPendingImageState();
    }

    this.uploadMode = CatiaUploadMode.IMAGE_FILE;
    this.showAttachmentMenu = false;
    this.showImageUrlComposer = false;
    this.openImageFilePicker(fileInput);
  }

  openImageUrlComposer() {
    if (this.uploadMode !== CatiaUploadMode.IMAGE_URL) {
      this.clearPendingImageState();
    }

    this.uploadMode = CatiaUploadMode.IMAGE_URL;
    this.showAttachmentMenu = false;
    this.showImageUrlComposer = true;
  }

  closeImageUrlComposer() {
    this.showImageUrlComposer = false;

    if (this.uploadMode === CatiaUploadMode.IMAGE_URL && !this.pendingImageUrl.trim()) {
      this.clearPendingImageState();
    }
  }

  openImageFilePicker(fileInput: HTMLInputElement) {
    fileInput.click();
  }

  onImageFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    input.value = '';

    if (!files.length) {
      return;
    }

    this.uploadMode = CatiaUploadMode.IMAGE_FILE;
    this.showImageUrlComposer = false;
    let addedCount = 0;

    files.forEach((file) => {
      const rule = CATIA_ALLOWED_IMAGE_UPLOADS.find(
        (item) => item.mimeType === file.type
      );

      if (!rule) {
        this.toastr.error(
          `"${file.name}" no es válido. Solo se permiten archivos JPG o PNG.`
        );
        return;
      }

      if (file.size > rule.maxBytes) {
        this.toastr.error(`"${file.name}" supera el límite de 5 MB.`);
        return;
      }

      const upload: PendingImageUpload = {
        localId: this.buildPendingImageLocalId(),
        file,
        previewUrl: URL.createObjectURL(file),
        mediaId: null,
        uploading: true,
        error: null,
      };

      this.pendingImageUploads = [...this.pendingImageUploads, upload];
      this.syncUploadingMediaState();
      this.uploadPendingImage(upload.localId);
      addedCount += 1;
    });

    if (addedCount > 0) {
      this.toastr.success(
        addedCount === 1
          ? 'Imagen agregada para envío'
          : `${addedCount} imágenes agregadas para envío`
      );
    }
  }

  private buildPendingImageLocalId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }

    return `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private uploadPendingImage(localId: string) {
    const upload = this.pendingImageUploads.find((item) => item.localId === localId);

    if (!upload) {
      return;
    }

    this.catiaService.uploadWhatsAppMedia(upload.file).subscribe({
      next: (mediaId) => {
        this.pendingImageUploads = this.pendingImageUploads.map((item) =>
          item.localId === localId
            ? { ...item, mediaId, uploading: false, error: null }
            : item
        );
        this.syncUploadingMediaState();
      },
      error: (err: any) => {
        this.pendingImageUploads = this.pendingImageUploads.map((item) =>
          item.localId === localId
            ? {
                ...item,
                uploading: false,
                mediaId: null,
                error: this.extractAttachmentErrorMessage(err),
              }
            : item
        );
        this.syncUploadingMediaState();
        this.toastr.error(
          `No se pudo cargar "${upload.file.name}". ${
            this.extractAttachmentErrorMessage(err)
          }`
        );
        console.error('Error:', err);
      },
    });
  }

  private extractAttachmentErrorMessage(err: any): string {
    return (
      err?.error?.message ||
      err?.error?.error ||
      err?.message ||
      'Error inesperado al cargar la imagen.'
    );
  }

  private syncUploadingMediaState() {
    this.isUploadingMedia = this.pendingImageUploads.some(
      (item) => item.uploading
    );
  }

  removePendingImageUpload(localId: string) {
    const upload = this.pendingImageUploads.find((item) => item.localId === localId);

    if (upload?.previewUrl) {
      URL.revokeObjectURL(upload.previewUrl);
    }

    this.pendingImageUploads = this.pendingImageUploads.filter(
      (item) => item.localId !== localId
    );
    this.syncUploadingMediaState();

    if (!this.pendingImageUploads.length && !this.pendingImageUrl.trim()) {
      this.uploadMode = CatiaUploadMode.NONE;
    }
  }

  private clearPendingImageUploadsOnly() {
    this.pendingImageUploads.forEach((item) => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });

    this.pendingImageUploads = [];
  }

  clearPendingImageState() {
    this.clearPendingImageUploadsOnly();
    this.uploadMode = CatiaUploadMode.NONE;
    this.pendingImageUrl = '';
    this.isUploadingMedia = false;
    this.showAttachmentMenu = false;
    this.showImageUrlComposer = false;
  }

  hasPendingAttachment(): boolean {
    return (
      (this.uploadMode === CatiaUploadMode.IMAGE_FILE &&
        this.pendingImageUploads.length > 0) ||
      (this.uploadMode === CatiaUploadMode.IMAGE_URL &&
        !!this.pendingImageUrl.trim())
    );
  }

  getPendingImageReadyCount(): number {
    return this.pendingImageUploads.filter((item) => !!item.mediaId).length;
  }

  hasPendingImageErrors(): boolean {
    return this.pendingImageUploads.some((item) => !!item.error);
  }

  /**
   * Toma el chat: pausa la IA del usuario actual previa confirmacion.
   * Mientras la IA esta pausada el agente puede escribir mensajes manuales.
   */
  async takeOverChat(): Promise<void> {
    if (!this.selectedUser || this.isTogglingIaPause) return;
    const phone = this.selectedUser.whatsappPhone?.trim();
    if (!phone) return;

    const result = await Swal.fire({
      title: 'Tomar el chat',
      text: 'Vas a pausar a CatIA para este usuario. Tu podras responderle directamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, tomar el chat',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0891b2',
      reverseButtons: true,
      focusCancel: true,
    });
    if (!result.isConfirmed) return;
    this.toggleIaPause(true);
  }

  /**
   * Devuelve el chat a la IA: la reactiva tras confirmacion.
   */
  async releaseToIa(): Promise<void> {
    if (!this.selectedUser || this.isTogglingIaPause) return;
    const phone = this.selectedUser.whatsappPhone?.trim();
    if (!phone) return;

    const result = await Swal.fire({
      title: 'Devolver a CatIA',
      text: 'Vas a reactivar la IA para este usuario. Las proximas respuestas seran automaticas.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Si, reactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    this.toggleIaPause(false);
  }

  private toggleIaPause(paused: boolean): void {
    if (!this.selectedUser) return;
    const phone = this.selectedUser.whatsappPhone?.trim();
    if (!phone) return;

    this.isTogglingIaPause = true;
    this.catiaService.toggleIaPause(phone, paused).subscribe({
      next: () => {
        if (this.selectedUser) {
          this.selectedUser.iaPaused = paused;
        }
        this.isTogglingIaPause = false;
        this.toastr.success(paused ? 'Chat tomado · CatIA en pausa' : 'CatIA reactivada');
      },
      error: (err: any) => {
        this.isTogglingIaPause = false;
        const message =
          err?.error?.errors?.[0]?.message ||
          err?.error?.message ||
          'No fue posible cambiar el estado de la IA';
        this.toastr.error(message, 'ERROR');
      },
    });
  }

  canSendCurrentMessage(): boolean {
    if (!this.selectedUser || this.isSendingMessage) {
      return false;
    }

    // Takeover humano: solo se permite enviar mensajes desde el back-office si
    // la IA esta pausada para ese usuario. Asi evitamos que CatIA y un agente
    // contesten en paralelo.
    if (!this.selectedUser.iaPaused) {
      return false;
    }

    const messageText = this.formMessage.get('chatMsg')?.value?.trim() ?? '';
    const hasContent = !!messageText || this.hasPendingAttachment();

    if (!hasContent) {
      return false;
    }

    if (this.uploadMode === CatiaUploadMode.IMAGE_FILE) {
      if (!this.pendingImageUploads.length) {
        return !!messageText;
      }

      return (
        !this.isUploadingMedia &&
        !this.pendingImageUploads.some((item) => !item.mediaId || !!item.error)
      );
    }

    if (this.uploadMode === CatiaUploadMode.IMAGE_URL) {
      return !!messageText || !!this.pendingImageUrl.trim();
    }

    return true;
  }

  getPendingAttachmentHint(): string {
    if (this.uploadMode === CatiaUploadMode.IMAGE_URL) {
      return 'La imagen se enviará usando la URL indicada.';
    }

    if (!this.pendingImageUploads.length) {
      return 'JPG o PNG, máximo 5 MB por imagen.';
    }

    const ready = this.getPendingImageReadyCount();
    const total = this.pendingImageUploads.length;

    if (this.isUploadingMedia) {
      return `Preparando ${ready}/${total} imágenes...`;
    }

    if (this.hasPendingImageErrors()) {
      return 'Quita o reemplaza las imágenes con error antes de enviar.';
    }

    if (total > 1) {
      return `Listas ${ready}/${total}. El texto se enviará solo con la primera imagen.`;
    }

    return 'Imagen lista para enviar.';
  }

  // Send Message
  messageSave() {
    const messageText = this.formMessage.get('chatMsg')?.value?.trim() ?? '';
    const destinationPhone = this.selectedUser?.whatsappPhone?.trim();
    const imageUrl = this.pendingImageUrl.trim();

    if (!messageText && !this.hasPendingAttachment()) {
      this.formMessage.get('chatMsg')?.markAsTouched();
      this.toastr.info('Escribe un mensaje o adjunta una imagen');
      return;
    }

    if (!destinationPhone) {
      this.toastr.info(
        'Selecciona una conversación antes de enviar un mensaje'
      );
      return;
    }

    if (!this.businessPhoneNumber) {
      this.toastr.error(
        'No fue posible inferir el número de negocio para esta conversación'
      );
      return;
    }

    const number = this.sanitizePhoneToNumber(destinationPhone);

    if (!number || !this.businessPhoneNumber) {
      this.toastr.error('No fue posible preparar los números para el envío');
      return;
    }

    if (this.isSendingMessage) {
      return;
    }

    if (!this.canSendCurrentMessage()) {
      if (this.isUploadingMedia) {
        this.toastr.info('Espera a que todas las imágenes terminen de cargarse');
        return;
      }

      if (this.hasPendingImageErrors()) {
        this.toastr.error('Hay imágenes con error. Quítalas o vuelve a cargarlas.');
        return;
      }

      return;
    }

    this.isSendingMessage = true;
    this.updateMessageInputState();

    const basePayload = {
      number,
      sentBy: this.getCurrentOperatorName(),
      source: CatiaMessageSource.BACK_OFFICE,
      businessPhoneNumber: this.businessPhoneNumber,
    };

    const requests: any[] = [];

    if (
      this.uploadMode === CatiaUploadMode.IMAGE_FILE &&
      this.pendingImageUploads.length
    ) {
      const readyUploads = this.pendingImageUploads.filter((item) => !!item.mediaId);

      readyUploads.forEach((item, index) => {
        requests.push(
          this.catiaService.sendImageById(
            {
              ...basePayload,
              message: index === 0 ? messageText : '',
              type: CatiaMessageType.IMAGE,
            },
            item.mediaId!
          )
        );
      });
    } else if (this.uploadMode === CatiaUploadMode.IMAGE_URL && imageUrl) {
      requests.push(
        this.catiaService.sendImageByUrl(
          {
            ...basePayload,
            message: messageText,
            type: CatiaMessageType.IMAGE,
          },
          imageUrl
        )
      );
    } else {
      requests.push(
        this.catiaService.sendWhatsAppMessage({
          ...basePayload,
          message: messageText,
          type: CatiaMessageType.TEXT,
        })
      );
    }

    from(requests)
      .pipe(concatMap((request$) => request$), toArray())
      .subscribe({
        next: () => {
          const sentCount = requests.length;
          this.isSendingMessage = false;
          this.formMessage.reset({ chatMsg: '' });
          this.clearPendingImageState();
          this.updateMessageInputState();

          if (!this.isStreamingSelectedChat) {
            this.scheduleSelectedChatRefresh(1500);
          }

          this.toastr.success(
            sentCount > 1
              ? `Se enviaron ${sentCount} imágenes correctamente`
              : 'Mensaje enviado correctamente'
          );
        },
        error: (err: any) => {
          this.isSendingMessage = false;
          this.updateMessageInputState();
          this.toastr.error(JSON.stringify(err));
          console.error('Error:', err);
        },
      });
  }

  submitUserSearch() {
    const searchValue = this.searchTerm.trim();

    if (!searchValue) {
      this.clearUserSearch();
      return;
    }

    this.currentSearchPage = 0;
    this.hasMoreSearchResults = false;
    this.searchResults = [];
    this.totalSearchResults = 0;
    this.hasSearchedUser = true;
    this.lastSearchTriggerScrollTop = -1;
    this.findUserChat(
      {
        identificacion:
          this.searchMode === 'identificacion' ? searchValue : undefined,
        whatsappPhone:
          this.searchMode === 'whatsappPhone' ? searchValue : undefined,
        page: 0,
        pageSize: this.searchPageSize,
        sortBy: 'lastInteraction',
        direction: 'asc',
      },
      true
    );
  }

  clearUserSearch() {
    this.searchTerm = '';
    this.searchMode = 'identificacion';
    this.searchResults = [];
    this.isSearchingUser = false;
    this.currentSearchPage = 0;
    this.hasMoreSearchResults = false;
    this.totalSearchResults = 0;
    this.hasSearchedUser = false;
    this.lastSearchTriggerScrollTop = -1;
  }

  loadNextSearchPage() {
    const searchValue = this.searchTerm.trim();

    if (!searchValue || this.isSearchingUser || !this.hasMoreSearchResults) {
      return;
    }

    this.findUserChat({
      identificacion:
        this.searchMode === 'identificacion' ? searchValue : undefined,
      whatsappPhone:
        this.searchMode === 'whatsappPhone' ? searchValue : undefined,
      page: this.currentSearchPage + 1,
      pageSize: this.searchPageSize,
      sortBy: 'lastInteraction',
      direction: 'asc',
    });
  }

  ensureSearchResultsFillViewport() {
    const scrollElement = this.searchScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement || this.isSearchingUser || !this.hasMoreSearchResults) {
      return;
    }

    const hasScrollableOverflow =
      scrollElement.scrollHeight > scrollElement.clientHeight + 8;

    if (!hasScrollableOverflow) {
      this.loadNextSearchPage();
    }
  }

  loadInitialRecentChats() {
    this.currentRecentChatPage = 0;
    this.totalRecentChats = 0;
    this.hasMoreRecentChats = true;
    this.recentChat = [];
    this.lastRecentTriggerScrollTop = -1;
    this.loadNextRecentChatsPage(true);
  }

  loadNextRecentChatsPage(reset = false) {
    if (this.isLoadingRecentChats) {
      return;
    }

    if (!reset && !this.hasMoreRecentChats) {
      return;
    }

    this.isLoadingRecentChats = true;

    const nextPage = reset ? 0 : this.currentRecentChatPage + 1;

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    let recentChatRangeStart = twentyFourHoursAgo.toISOString().split('.')[0];
    let recentChatRangeEnd = now.toISOString().split('.')[0];

    this.recentUserChats({
      page: nextPage,
      pageSize: this.recentChatPageSize,
      sortBy: 'lastInteraction',
      direction: 'asc',
      startDate: recentChatRangeStart,
      endDate: recentChatRangeEnd,
    });
  }

  loadInitialUserChats() {
    this.currentUserChatPage = 0;
    this.totalUserChats = 0;
    this.hasMoreUserChats = true;
    this.allConversations = [];
    this.lastUserTriggerScrollTop = -1;
    this.loadNextUserChatsPage(true);
  }

  loadNextUserChatsPage(reset = false) {
    if (this.isLoadingUserChats) {
      return;
    }

    if (!reset && !this.hasMoreUserChats) {
      return;
    }

    this.isLoadingUserChats = true;

    const nextPage = reset ? 0 : this.currentUserChatPage + 1;

    this.listUserChats({
      page: nextPage,
      pageSize: this.userChatPageSize,
      sortBy: 'lastInteraction',
      direction: 'asc',
    });
  }

  registerUserChatScrollListener() {
    const scrollElement = this.allScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement) {
      return;
    }

    scrollElement.addEventListener('scroll', this.handleUserChatScroll);
  }

  registerSearchScrollListener() {
    const scrollElement = this.searchScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement) {
      return;
    }

    scrollElement.addEventListener('scroll', this.handleSearchScroll);
  }

  registerRecentChatScrollListener() {
    const scrollElement = this.recentScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement) {
      return;
    }

    scrollElement.addEventListener('scroll', this.handleRecentChatScroll);
  }

  removeUserChatScrollListener() {
    const scrollElement = this.allScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement) {
      return;
    }

    scrollElement.removeEventListener('scroll', this.handleUserChatScroll);
  }

  removeRecentChatScrollListener() {
    const scrollElement = this.recentScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement) {
      return;
    }

    scrollElement.removeEventListener('scroll', this.handleRecentChatScroll);
  }

  removeSearchScrollListener() {
    const scrollElement = this.searchScrollRef?.SimpleBar?.getScrollElement?.();

    if (!scrollElement) {
      return;
    }

    scrollElement.removeEventListener('scroll', this.handleSearchScroll);
  }

  // toggletab
  setMainView(view: 'chat' | 'ai'): void {
    this.showTab = view === 'chat';
  }

  get searchModeLabel(): string {
    switch (this.searchMode) {
      case 'identificacion':
        return 'Identificación';
      case 'whatsappPhone':
        return 'Teléfono';
    }
  }

  // Colapsar el Menu
  toggleMenuCollapse(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }

  toggleChatFinder(): void {
    this.isChatFinderHidden = !this.isChatFinderHidden;
  }

  // Devuelve un string con los tipos de rol o 'None'
  getRolesString(roles?: RolesUsuario[]): string {
    if (!roles?.length) {
      return 'None';
    }

    let userRoles = roles
      .map((r) => r.tipoRol ?? '')
      .filter((t) => !!t)
      .join(', ');

    this.role = userRoles;

    return userRoles;
  }

  getUserDisplayName(user?: CatiaUserModel | null): string {
    return (
      user?.erpUser?.nombres?.trim() ||
      user?.identificacion?.trim() ||
      user?.whatsappPhone?.trim() ||
      'Anonymus'
    );
  }

  getUserFullName(user?: CatiaUserModel | null): string {
    const names = user?.erpUser?.nombres?.trim() ?? '';
    const lastNames = user?.erpUser?.apellidos?.trim() ?? '';
    const fullName = `${names} ${lastNames}`.trim();

    return fullName || this.getUserDisplayName(user);
  }

  formatDateTime(value?: string | Date | null): string {
    if (!value) {
      return 'N/A';
    }

    const date = value instanceof Date ? value : new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'N/A';
    }

    return new Intl.DateTimeFormat('es-EC', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  // Calclular TimeStamp
  getTimeAgo(value?: string | Date | null): string {
    if (!value) {
      return 'N/A';
    }
    const date = value instanceof Date ? value : new Date(value);

    const diff = this.nowTimestamp - date.getTime();
    const mins = Math.floor(diff / 1000 / 60);
    if (mins < 60) {
      return `${mins} min atrás`;
    }

    const hrs = Math.floor(mins / 60);
    return `${hrs} hora${hrs > 1 ? 's' : ''} atrás`;
  }

  // OnClick User Chat show
  selectChatUser(user: CatiaUserModel) {
    this.closeMessageStream();
    this.clearPendingImageState();
    this.selectedUser = user;
    this.username = this.getUserDisplayName(user);
    this.role = this.getRolesString(user.erpUser?.rolesUsuario);
    this.isEditingUserProfile = false;
    this.profileDraft = null;
    this.hasNewMessageAlert = false;
    this.newMessageAlertCount = 0;
    this.latestMessagePreview = '';
    this.latestMessageType = '';
    this.updateMessageInputState();
    this.loadInitialMessageHistory();
    if (user.whatsappPhone?.trim()) {
      this.openMessageStream(user.whatsappPhone);
    }
  }

  openProfileTab() {
    this.showTab = true;
    this.tabContextService.changeTab('chat', 'profile');
  }

  closeUserProfile() {
    this.isEditingUserProfile = false;
    this.profileDraft = null;
    this.tabContextService.changeTab('chat', 'chat');
  }

  copyText(value: string) {
    if (!value?.trim()) {
      return;
    }

    navigator.clipboard.writeText(value);
    this.toastr.success('Copiado al portapapeles');
  }

  startUserProfileEdit() {
    if (!this.selectedUser) {
      return;
    }

    this.profileDraft = {
      previousResponseId: this.selectedUser.previousResponseId ?? '',
      limitQuestions: this.selectedUser.limitQuestions ?? 0,
      limitStrike: this.selectedUser.limitStrike ?? 0,
      block: this.selectedUser.block ?? false,
      blockingReason: this.selectedUser.blockingReason ?? '',
    };
    this.isEditingUserProfile = true;
  }

  cancelUserProfileEdit() {
    this.isEditingUserProfile = false;
    this.profileDraft = null;
  }

  saveUserProfile() {
    if (!this.selectedUser || !this.profileDraft || this.isSavingUserProfile) {
      return;
    }

    this.isSavingUserProfile = true;

    this.catiaService
      .updateUserChat(this.selectedUser.id, {
        previousResponseId: this.profileDraft.previousResponseId.trim(),
        limitQuestions: Number(this.profileDraft.limitQuestions),
        limitStrike: Number(this.profileDraft.limitStrike),
        block: this.profileDraft.block,
        blockingReason: this.profileDraft.blockingReason.trim(),
      })
      .subscribe({
        next: (updatedUser) => {
          this.selectedUser = updatedUser;
          this.username = this.getUserDisplayName(updatedUser);
          this.role = this.getRolesString(updatedUser.erpUser?.rolesUsuario);
          this.syncUpdatedUser(updatedUser);
          this.isSavingUserProfile = false;
          this.isEditingUserProfile = false;
          this.profileDraft = null;
          this.toastr.success('Usuario actualizado correctamente');
        },
        error: (err: any) => {
          this.isSavingUserProfile = false;
          this.toastr.error(JSON.stringify(err));
          console.error('Error:', err);
        },
      });
  }

  private syncUpdatedUser(updatedUser: CatiaUserModel) {
    this.searchResults = this.replaceUserInList(
      this.searchResults,
      updatedUser
    );
    this.recentChat = this.replaceUserInList(this.recentChat, updatedUser);
    this.allConversations = this.replaceUserInList(
      this.allConversations,
      updatedUser
    );
  }

  private replaceUserInList(
    users: CatiaUserModel[],
    updatedUser: CatiaUserModel
  ): CatiaUserModel[] {
    return users.map((user) =>
      user.id === updatedUser.id ? updatedUser : user
    );
  }
}
