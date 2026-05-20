import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { PageTitleComponent } from '../../../../shared/page-title/page-title.component';
import { CommonModule } from '@angular/common';
import { SimplebarAngularModule } from 'simplebar-angular';
import { NavModule } from '../../../../Component/tab/tab.module';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, icons } from 'lucide-angular';
import { DrawerModule } from '../../../../Component/drawer';
import { MDModalModule } from '../../../../Component/modals';
import { MnDropdownComponent } from '../../../../Component/dropdown';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import * as Prism from 'prismjs';
import { Subscription } from 'rxjs';

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
    private drawerService: DrawerService
  ) {}

  ngOnInit(): void {
    this.loadInitialUserChats();
    this.loadInitialRecentChats();
    this.startTimeAgoClock();

    // Validation
    this.formMessage = this.formBuilder.group({
      chatMsg: ['', [Validators.required]],
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
          if (streamEvent.event === 'connected') {
            return;
          }

          if (streamEvent.event !== 'message_update') {
            return;
          }

          const payload =
            streamEvent.data && typeof streamEvent.data === 'object'
              ? (streamEvent.data as {
                  eventType?: string;
                  phone?: string;
                  messageType?: string;
                  preview?: string;
                })
              : null;

          if (!payload?.phone || payload.phone !== sanitizedPhone) {
            return;
          }

          this.hasNewMessageAlert = true;
          this.newMessageAlertCount += 1;
          this.latestMessagePreview = payload.preview?.trim() ?? '';
          this.latestMessageType = payload.messageType?.trim() ?? '';
          this.scheduleSelectedChatRefresh(700);
        },
        error: (err: unknown) => {
          this.isStreamingSelectedChat = false;
          console.error('Error en stream SSE:', err);
        },
        complete: () => {
          this.isStreamingSelectedChat = false;
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

  refreshSelectedChatMessages() {
    if (!this.selectedUser) {
      return;
    }

    this.hasNewMessageAlert = false;
    this.newMessageAlertCount = 0;
    this.latestMessagePreview = '';
    this.latestMessageType = '';
    this.loadInitialMessageHistory();
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

  isOutgoingMessage(message: CatiaMessageModel): boolean {
    return message.direction === 'OUTBOUND';
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
    this.selectedMessageMediaMetadata = null;
    this.isLoadingSelectedMessageRawDetail = false;
    this.isLoadingSelectedMessageMediaMetadata = false;
    this.drawerService.close('drawerMessageRaw');
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
          const incomingMessages = [...(pageMessages.content ?? [])].reverse();

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

  // Send Message
  messageSave() {
    const messageText = this.formMessage.get('chatMsg')?.value?.trim() ?? '';
    const destinationPhone = this.selectedUser?.whatsappPhone?.trim();

    if (!messageText) {
      this.formMessage.get('chatMsg')?.markAsTouched();
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

    this.isSendingMessage = true;
    this.updateMessageInputState();

    this.catiaService
      .sendWhatsAppMessage({
        number,
        message: messageText,
        sentBy: this.getCurrentOperatorName(),
        source: CatiaMessageSource.BACK_OFFICE,
        businessPhoneNumber:  this.businessPhoneNumber,
        type: CatiaMessageType.TEXT,
      })
      .subscribe({
        next: () => {
          this.isSendingMessage = false;
          this.formMessage.reset({ chatMsg: '' });
          this.updateMessageInputState();
          this.scheduleSelectedChatRefresh(800);
          setTimeout(() => this.refreshSelectedChatMessages(), 2200);
          this.toastr.success('Mensaje enviado correctamente');
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
