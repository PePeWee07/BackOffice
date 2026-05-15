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

import { CatiaChatService } from '../../../../core/services/apis/catia/catia-chat.service';
import { ToastrService } from 'ngx-toastr';
import {
  CatiaUserChatQueryParams,
  CatiaUserFindQueryParams,
  CatiaUserModel,
  RolesUsuario,
} from '../../../../core/services/apis/catia/models/catia-user';

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
  chatuser: any;
  username: string = 'User';
  showTab: boolean = true;
  profile: string = 'assets/images/users/user-dummy-img.jpg';
  role: string = 'None';
  formMessage!: UntypedFormGroup;
  isMenuCollapsed = false; // For Menu Collapse in false
  searchTerm = '';
  searchMode: 'identificacion' | 'whatsappPhone' = 'identificacion';
  private readonly scrollThreshold = 120;
  
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
  constructor(
    public formBuilder: UntypedFormBuilder,
    public translate: TranslateService,
    private catiaService: CatiaChatService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadInitialUserChats();
    this.loadInitialRecentChats();
    this.chatuser = [];

    // Validation
    this.formMessage = this.formBuilder.group({
      chatMsg: ['', [Validators.required]],
    });
  }
  // ===================================================

  ngAfterViewInit() {
    this.registerSearchScrollListener();
    this.registerRecentChatScrollListener();
    this.registerUserChatScrollListener();
  }

  ngAfterContentChecked() {
    Prism.highlightAll();
  }

  ngOnDestroy(): void {
    this.removeSearchScrollListener();
    this.removeRecentChatScrollListener();
    this.removeUserChatScrollListener();
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

  // ================== Consumos Servicios =======================
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

  // Send Message
  messageSave() {}

  // =============== Metodos =======================

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

  // Calclular TimeStamp
  getTimeAgo(value?: string | Date | null): string {
    if (!value) {
      return 'N/A';
    }
    const date = value instanceof Date ? value : new Date(value);

    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 1000 / 60);
    if (mins < 60) {
      return `${mins} min atrás`;
    }

    const hrs = Math.floor(mins / 60);
    return `${hrs} hora${hrs > 1 ? 's' : ''} atrás`;
  }

  // OnClick User Chat show
  chatUsername(name: any, role: any) {
    this.username = name;
    this.chatuser = [];
    const currentDate = new Date();
    this.role = role;

    this.chatuser.push({
      name: this.username,
      time: currentDate.getHours() + ':' + currentDate.getMinutes(),
    });
  }
}
