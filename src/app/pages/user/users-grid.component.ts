import { UserService } from '../../core/services/administration/user.service';
import { Component, ElementRef, ViewChild, NgModule } from '@angular/core';
import { PageTitleComponent } from '../../shared/page-title/page-title.component';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, icons } from 'lucide-angular';
import { FlatpickrModule } from '../../Component/flatpickr/flatpickr.module';
import { RouterLink, RouterModule } from '@angular/router';
import { MDModalModule } from '../../Component/modals';
import { ModalService } from '../../Component/modals/modal.service';
import { MnDropdownComponent } from '../../Component/dropdown';
import { UserModel, UserRequest } from '../../store/User/user-model';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { NgClass } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { ApiErrorModel } from '../../store/Authentication/apiError.model';
import { TooltipModule, TooltipOptions } from 'ng2-tooltip-directive';
import { NgSelectModule } from '@ng-select/ng-select';
import { RoleService } from '../../core/services/administration/role.service';
import { Options } from 'flatpickr/dist/types/options';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-users-grid',
  standalone: true,
  imports: [
    PageTitleComponent,
    LucideAngularModule,
    RouterModule,
    FlatpickrModule,
    MnDropdownComponent,
    MDModalModule,
    RouterLink,
    ReactiveFormsModule,
    FormsModule,
    NgClass,
    TooltipModule,
    NgSelectModule,
    TranslateModule,
  ],
  templateUrl: './users-grid.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
  styles: [],
})
export class UsersGridComponent {
  constructor(
    private userService: UserService,
    private fb: FormBuilder,
    private modalService: ModalService,
    private toastr: ToastrService,
    private roleService: RoleService,
    public translate: TranslateService
  ) {}

  filterForm!: FormGroup;
  editForm!: FormGroup;
  addUserForm!: FormGroup;

  // Variables de tabla
  isFirst: boolean | null = null; //? first
  isEmpty: boolean | null = null; //? empty
  itemsPerPage: number = 0; //? numberOfElements
  currentPage: number = 0; // number or pageable.pageNumber
  sizePage: number = 10; // size or pageable.pageSize
  loading = false; // esqueleton
  isLast: boolean | null = null; // last
  totalItems: number = 0; // totalElements
  totalPages: number = 0; //? totalPages
  offset: number = 0; //? Numero de saltos or size
  griddata: UserModel[] = [];

  @ViewChild('scrollAnchor') anchor!: ElementRef;

  roles: any[] = [];
  selectedRoles: number[] = [];

  currentFilters: any = {};
  activeFilterChips: { key: string; value: any }[] = [];

  flatpickrOptions: Options = {
    mode: 'single',
    enableTime: true,
    time_24hr: true,
    altInput: true,
    altFormat: 'Y-m-d\\TH:i:S',
    dateFormat: 'Y-m-d\\TH:i:S',
    minuteIncrement: 5,
    position: 'auto',
    closeOnSelect: true,
  };
  showPassword = false;

  ngAfterViewInit() {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        this.getUsers();
      }
    });

    observer.observe(this.anchor.nativeElement);
  }

  ngOnInit(): void {
    this.getUsers();

    this.filterForm = this.fb.group({
      id: [''],
      name: [''],
      lastName: [''],
      email: [''],
      phoneNumber: [''],
      address: [''],
      dni: [''],
      enabled: true,
      accountNonExpired: true,
      accountNonLocked: true,
      credentialsNonExpired: true,
      accountExpiryDate: [null],
    });

    this.editForm = this.fb.group({
      id: [0],
      name: [''],
      lastName: [''],
      email: [''],
      phoneNumber: [''],
      address: [''],
      dni: [''],
      password: this.fb.control<string | null>(null),
      rolesIds: this.fb.nonNullable.control<number[]>([]),
      enabled: true,
      accountNonExpired: true,
      accountNonLocked: true,
      credentialsNonExpired: true,
      accountExpiryDate: [null],
    });

    this.editForm.get('accountNonExpired')?.valueChanges.subscribe((val) => {
      if (val) {
        this.editForm.patchValue({
          accountExpiryDate: null,
        });
      }
    });

    this.addUserForm = this.fb.group({
      name: this.fb.nonNullable.control(''),
      lastName: this.fb.nonNullable.control(''),
      email: this.fb.nonNullable.control(''),
      phoneNumber: this.fb.nonNullable.control(''),
      address: this.fb.nonNullable.control(''),
      dni: this.fb.nonNullable.control(''),
      password: this.fb.control<string | null>(null),
      rolesIds: this.fb.nonNullable.control<number[]>([]),
      enabled: this.fb.nonNullable.control(false),
      accountNonExpired: this.fb.nonNullable.control(true),
      accountNonLocked: this.fb.nonNullable.control(true),
      credentialsNonExpired: true,
      accountExpiryDate: this.fb.control<string | null>(null),
    });
  }

  // Consultar Usuarios
  getUsers() {
    if (this.loading || this.isLast) return;
    this.loading = true;

    this.userService
      .getUsers({
        page: this.currentPage,
        pageSize: this.sizePage,
        ...this.currentFilters,
      })
      .subscribe({
        next: (page) => {
          this.griddata = [...this.griddata, ...page.content];
          this.totalPages = page.totalPages;
          this.totalItems = page.totalElements;
          this.isLast = page.last;
          this.itemsPerPage = page.numberOfElements;
          this.isEmpty = page.empty;
          this.isFirst = page.first;

          this.currentPage++;
          this.loading = false;
        },
        error: (err: any) => {
          const resp: ApiErrorModel = err.error;
          const mensaje =
            resp?.errors?.[0]?.message || resp?.message || 'Error inesperado';
          const titulo = resp.errors?.[0].error || 'ERROR';

          this.toastr.error(mensaje, titulo, {
            // toastClass: '',
          });
          this.loading = false;
        },
      });
  }

  getEndIndex() {
    return Math.min(this.griddata.length, this.totalItems);
  }

  applyFilters(idFilter: string) {
    const filters = this.filterForm.value;

    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([_, value]) => value !== null && value !== ''
      )
    );

    this.activeFilterChips = Object.entries(cleanedFilters).map(
      ([key, value]) => ({
        key,
        value,
      })
    );

    this.currentFilters = cleanedFilters;

    this.currentPage = 0;
    this.griddata = [];
    this.isLast = false;

    this.getUsers();
    this.modalService.close(idFilter);
  }

  isfilterEmpty(): boolean {
    const values = Object.values(this.filterForm.value);

    return values.some((v) => v !== null && v !== '');
  }

  removeSingleFilter(key: string) {
    this.filterForm.get(key)?.reset();
    this.applyFilters('filterModal');
  }

  cleanFilters() {
    this.filterForm.reset();
    this.activeFilterChips = [];
    this.currentFilters = {};

    this.currentPage = 0;
    this.griddata = [];
    this.isLast = false;

    this.getUsers();
  }

  getColorAccountStatusBadges(accountStatus: boolean): string {
    return accountStatus
      ? 'text-green-500 bg-green-100 border border-transparent rounded-full dark:bg-green-500/20 dark:border-transparent'
      : 'text-red-500 bg-red-200 border-transparent rounded-full dark:bg-red-500/20 dark:border-transparent';
  }
  getColorClassAccountStatus(accountStatus: boolean): string {
    return accountStatus
      ? 'bg-green-100 text-green-500 dark:bg-green-500/20'
      : 'bg-red-200 text-red-500 dark:bg-red-500/20';
  }

  toolOptionAccountStatus: TooltipOptions = {
    displayMobile: true,
    displayTouchscreen: true,
    hideDelayTouchscreen: 2000, // Retraso para esconder en móviles
    display: true, // Retraso para escritorio
    placement: 'top', // Posición del tooltip
    showDelay: 300, // Retraso para mostrar el tooltip
    theme: 'light', // Tema del tooltip
    hideDelay: 500, // Retraso para esconder el tooltip
    shadow: true,
  };

  getDynamicTooltipAccount(
    accountNonExpired: boolean,
    accountNonLocked: boolean,
    credentialsNonExpired: boolean
  ): string {
    const title = this.translate.instant('users-grid.tooltips.accountStatus.title');

    const accountExpiredLabel = this.translate.instant(
      accountNonExpired
        ? 'users-grid.common.accountNonExpired'
        : 'users-grid.tooltips.accountStatus.accountExpired'
    );

    const accountLockedLabel = this.translate.instant(
      accountNonLocked
        ? 'users-grid.common.accountNonLocked'
        : 'users-grid.tooltips.accountStatus.accountLocked'
    );

    const credentialsLabel = this.translate.instant(
      credentialsNonExpired
        ? 'users-grid.common.credentialsNonExpired'
        : 'users-grid.tooltips.accountStatus.credentialsExpired'
    );

    const html = `
      <div>
        <h6 class="text-center">${title}</h6>
        <div class="grid grid-cols-1 gap-2 place-content-center">
          <span class="px-2.5 py-0.5 inline-block text-xs font-medium rounded border border-transparent ${this.getColorClassAccountStatus(
            accountNonExpired
          )} dark:border-transparent">
            ${accountExpiredLabel}
          </span>
          <span class="px-2.5 py-0.5 inline-block text-xs font-medium rounded border border-transparent ${this.getColorClassAccountStatus(
            accountNonLocked
          )} dark:border-transparent">
            ${accountLockedLabel}
          </span>
          <span class="px-2.5 py-0.5 inline-block text-xs font-medium rounded border border-transparent ${this.getColorClassAccountStatus(
            credentialsNonExpired
          )} dark:border-transparent">
            ${credentialsLabel}
          </span>
        </div>
      </div>
    `;

    return html;
  }

  getRoles() {
    this.roles = [];

    this.roleService.getRoles().subscribe({
      next: (resp) => {
        this.roles = resp.map(({ permissionList, ...role }) => role);
      },
      error: (err: any) => {
        const resp: ApiErrorModel = err.error;
        const mensaje =
          resp?.errors?.[0]?.message || resp?.message || 'Error inesperado';
        const titulo = resp.errors?.[0].error || 'ERROR';

        this.toastr.error(mensaje, titulo, {});
      },
    });
  }

  openEditModal(user: UserModel) {
    const expiry = user.accountExpiryDate
      ? new Date(user.accountExpiryDate)
      : null;

    this.editForm.patchValue({
      id: user.id,
      name: user.name,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.address,
      dni: user.dni,
      // password: user.,
      rolesIds: user.roles.map((r: any) => r.id),
      enabled: user.enabled,
      accountNonExpired: user.accountExpiryDate ? false : true,
      accountNonLocked: user.accountNonLocked,
      accountExpiryDate: expiry,
      credentialsNonExpired: true,
    });
    this.getRoles();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  updateUser(body: UserRequest, idModal: string) {
    const idUser: number = this.editForm.get('id')?.value;
    const payload: UserRequest = { ...body };

    if (!payload.password || payload.password.trim() === '') {
      delete payload.password;
    }

    this.userService.updateUser(idUser, payload).subscribe({
      next: () => {
        this.toastr.success('User Update', 'Success', {});
        this.currentPage = 0;
        this.griddata = [];
        this.isLast = false;

        this.getUsers();
        this.modalService.close(idModal);
      },
      error: (err: any) => {
        const resp: ApiErrorModel = err.error;
        const mensaje =
          resp?.errors?.[0]?.message || resp?.message || 'Error inesperado';
        const titulo = resp.errors?.[0].error || 'ERROR';

        this.toastr.error(mensaje, titulo, {});
      },
    });
  }

  addUser(body: UserRequest, idModal: string) {
    const payload: UserRequest = { ...body };

    this.userService.createUser(payload).subscribe({
      next: () => {
        this.toastr.success('User Create', 'Success', {});
        this.currentPage = 0;
        this.griddata = [];
        this.isLast = false;

        this.getUsers();
        this.addUserForm.reset();
        this.modalService.close(idModal);
      },
      error: (err: any) => {
        const resp: ApiErrorModel = err.error;
        const mensaje =
          resp?.errors?.[0]?.message || resp?.message || 'Error inesperado';
        const titulo = resp.errors?.[0].error || 'ERROR';

        this.toastr.error(mensaje, titulo, {});
      },
    });
  }
}
