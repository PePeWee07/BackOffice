import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, HostListener, NgModule, Renderer2, inject } from '@angular/core';
import { File, LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, icons } from 'lucide-angular';
import { MENU } from './menu';
import { SimplebarAngularModule } from 'simplebar-angular';
import { MenuItem } from './menu.model';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LanguageService } from '../../core/services/language.service';
import { CutomDropdownComponent } from '../../Component/customdropdown';
import { Store } from '@ngrx/store';
import { getLayout, getSidebarsize } from '../../store/layout/layout-selector';
import { CommonModule } from '@angular/common';
import { RoutePermissionService } from '../../core/services/administration/route-permission.service';
import { TokenStorageService } from '../../core/services/auth/token-storage.service';
import { JwtToken } from '../../store/Authentication/jwt.model';


@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, SimplebarAngularModule, CutomDropdownComponent, TranslateModule, RouterModule, LucideAngularModule],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) }, LanguageService]
})

export class SidebarComponent {
    menuItems: any;
    isMoreMenu: boolean = false;
    navData: any;
    navbarMenuItems: any = [];
    layout: any;
    size: any;

    private store = inject(Store)
    private routePermissionService = inject(RoutePermissionService);
    private tokenStorage = inject(TokenStorageService);

    constructor(
        public translate: TranslateService) {
        translate.setDefaultLang('sp');
    }


    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        if (document.documentElement.getAttribute('data-layout') == 'horizontal') {
            if (document.documentElement.clientWidth >= 1025) {
                setTimeout(() => {
                    this.updateMenu();
                }, 500);
            }
        }
    }

    ngOnInit(): void {

        // Get Layout
        this.store.select(getLayout).subscribe((data) => {
            this.layout = data;
            if (this.layout == 'horizontal') {
                setTimeout(() => {
                    this.updateMenu();
                }, 1500);
            } else {
                this.menuItems = this.buildMenu();
            }
        })

        // Get size
        this.store.select(getSidebarsize).subscribe((data) => {
            this.size = data
        })

        // Initialize the navData and menuItems
        this.navData = this.buildMenu();
        this.menuItems = this.navData;

        // Cuando la cache de permisos de rutas se carga/actualiza, recomputamos el menu
        this.routePermissionService.routePermissions$.subscribe(() => {
            this.navData = this.buildMenu();
            this.menuItems = this.navData;
        });
    }


    /***
 * Activate droup down set
 */
    ngAfterViewInit() {
        if (this.layout == 'horizontal') {
            setTimeout(() => {
                this.updateMenu();
            }, 1500);
        } else {
            this.menuItems = this.buildMenu();
        }
    }


    // Display Menu
    updateMenu() {
        const isMoreMenu = false;
        const navbarHeader = document.querySelector(".navbar-header");
        const navbarNav = document.getElementById("navbar-nav") as any;

        // count width of horizontal menu
        const fullWidthOfMenu = navbarHeader!.clientWidth - 150;

        const menuWidth = fullWidthOfMenu || 0;
        let totalItemsWidth = 0;
        let visibleItems: any = [];
        let hiddenItems: any = [];

        const moreMenuItem = {
            id: 'more',
            label: 'more',
            icon: 'network',
            subItems: null,
            link: 'sidebarMore',
            stateVariables: isMoreMenu,
            click: (e: any) => {
                e.preventDefault();
                this.isMoreMenu = !this.isMoreMenu;
            },
        };

        for (let i = 0; i < this.navData.length; i++) {
            const itemWidth = navbarNav?.children[i]?.offsetWidth;
            totalItemsWidth += itemWidth;

            if (totalItemsWidth <= menuWidth - 50 || window.innerWidth < 768) {
                visibleItems.push(this.navData[i]);
            } else {
                if (!this.navData[i].isTitle) {
                    hiddenItems.push(this.navData[i]);
                }
            }
            if (i + 1 === this.navData.length) {
                moreMenuItem.subItems = hiddenItems;
            }
        }

        const updatedMenuItems = hiddenItems.length > 0 ? [...visibleItems, moreMenuItem] : visibleItems;
        this.menuItems = updatedMenuItems;
    }


    hasItems(item: MenuItem) {
        return item.subItems !== undefined ? item.subItems.length > 0 : false;
    }

    // Hide Sidebar
    hideSidebar() {
        let sidebarOverlay = document.getElementById("sidebar-overlay") as any;
        sidebarOverlay.classList.add("hidden");
        document.documentElement.querySelector('.app-menu')?.classList.add("hidden");
        document.body.classList.remove("overflow-hidden");
    }

    /**
     * Construye el menu filtrado segun los roles del usuario actual y el
     * mapping de permisos de ruta que vive en RoutePermissionService. Items
     * sin link (titulos, dropdowns) se mantienen si tienen al menos un hijo
     * visible; titulos sin items debajo se descartan.
     */
    private buildMenu(): MenuItem[] {
        const filtered = this.filterMenu(MENU);
        return this.dropOrphanTitles(filtered);
    }

    private filterMenu(items: MenuItem[]): MenuItem[] {
        const result: MenuItem[] = [];
        for (const item of items) {
            // Items con hijos (dropdown): filtra recursivo y conserva solo si quedan hijos visibles.
            if (item.subItems && item.subItems.length > 0) {
                const filteredSub = this.filterMenu(item.subItems);
                if (filteredSub.length > 0) {
                    result.push({ ...item, subItems: filteredSub });
                }
                continue;
            }

            // Titulo (sin link, sin subItems): siempre pasa en esta etapa; se limpia despues si queda huerfano.
            if (item.isTitle) {
                result.push(item);
                continue;
            }

            // Item con link: chequear permisos contra la cache.
            if (item.link) {
                if (this.isLinkAllowed(item.link)) {
                    result.push(item);
                }
                continue;
            }

            // Cualquier otro caso (sin link, sin subItems, no titulo) lo dejamos pasar.
            result.push(item);
        }
        return result;
    }

    private dropOrphanTitles(items: MenuItem[]): MenuItem[] {
        const result: MenuItem[] = [];
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (!item.isTitle) {
                result.push(item);
                continue;
            }
            // Buscar si hay algun item no-titulo despues, antes del proximo titulo.
            let hasChildrenBeforeNextTitle = false;
            for (let j = i + 1; j < items.length; j++) {
                if (items[j].isTitle) break;
                hasChildrenBeforeNextTitle = true;
                break;
            }
            if (hasChildrenBeforeNextTitle) {
                result.push(item);
            }
        }
        return result;
    }

    private isLinkAllowed(link: string): boolean {
        // link viene con prefijo "/" (ej. "/apps-route-permissions"). El cache usa el path
        // tal cual lo define Angular: "" para la raiz, "apps-route-permissions" para el resto.
        const path = link.startsWith('/') ? link.slice(1) : link;
        const required = this.routePermissionService.getRolesForPath(path);

        // Si la cache aun no se cargo o la ruta no esta registrada, mostramos por defecto.
        // El AuthGuard del lado del routing igual bloqueara si corresponde.
        if (!required) return true;
        // Si no tiene roles asignados, es ruta abierta a cualquier autenticado.
        if (required.length === 0) return true;

        const userRoles = this.getUserRoles();
        return required.some((role) => {
            const normalized = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
            return userRoles.includes(normalized);
        });
    }

    private getUserRoles(): string[] {
        const tokenStr = this.tokenStorage.getToken();
        if (!tokenStr) return [];
        const token: JwtToken | null = this.tokenStorage.getDataToken(tokenStr);
        if (!token?.authorities) return [];
        return token.authorities
            .split(',')
            .map((entry) => entry.trim())
            .filter((entry) => entry.startsWith('ROLE_'));
    }

}
