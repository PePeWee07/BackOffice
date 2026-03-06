import { UserService } from './../../../core/services/administration/user.service';
import { Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { fetchUserGridData } from '../../../store/User/user-action';
import { selectUserGrid, selectUserLoading } from '../../../store/User/user-selector';
import { PageTitleComponent } from '../../../shared/page-title/page-title.component';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, icons } from 'lucide-angular';
import { FlatpickrModule } from '../../../Component/flatpickr/flatpickr.module';
import { RouterLink, RouterModule } from '@angular/router';
import { MDModalModule } from '../../../Component/modals';
import { MnDropdownComponent } from '../../../Component/dropdown';
import { NGXPagination } from '../../../Component/pagination';

@Component({
  selector: 'app-users-grid',
  standalone: true,
  imports: [
    PageTitleComponent,
    LucideAngularModule,
    NGXPagination,
    RouterModule,
    FlatpickrModule,
    MnDropdownComponent,
    MDModalModule,
    RouterLink,
  ],
  templateUrl: './users-grid.component.html',
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider(icons),
    },
  ],
  styles: ``,
})
export class UsersGridComponent {

  constructor(private userService: UserService) {}

  // Variables de tabla
  isFirst: boolean | null = null; //? first
  isEmpty: boolean | null = null; //? empty
  itemsPerPage: number = 6; // numberOfElements
  currentPage: number = 1; // number or pageable.pageNumber
  sizePage: number = 5; // size or pageable.pageSize
  isLast: boolean | null = null; //? last
  totalItems: number = 0; // totalElements
  totalPages: number = 0; //? totalPages
  startIndex: number = 0; //! xxx
  endIndex: any; //! xxx
  offset: number = 0; //? Numero de saltos or size
  griddata: any;
  private store = inject(Store);

  ngOnInit(): void {
    this.getUsers();
  }

  // Consultar Usuarios
  getUsers() {
    this.userService
      .getUsers({
        page: 0,
        pageSize: 2,
        // dni: '070473713619',
      })
      .subscribe((page) => {
        this.griddata = page.content;
        console.log('USERS:', this.griddata);
      });
  }

  // Pagination
  onPageChange(pageNumber: number): void {
    this.currentPage = pageNumber;
    this.updatePagedOrders();
  }

  getEndIndex() {
    return Math.min(this.startIndex + this.itemsPerPage, this.totalItems);
  }

  updatePagedOrders(): void {
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.endIndex = this.startIndex + this.itemsPerPage;
    this.griddata = this.griddata.slice(this.startIndex, this.endIndex);
  }
}
