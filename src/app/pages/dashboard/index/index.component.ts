import { CUSTOM_ELEMENTS_SCHEMA, Component, inject } from '@angular/core';
import { PageTitleComponent } from '../../../shared/page-title/page-title.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { CountUpModule } from 'ngx-countup';
import { CommonModule } from '@angular/common';
import { LUCIDE_ICONS, LucideAngularModule, LucideIconProvider, icons } from 'lucide-angular';
import { RouterModule } from '@angular/router';
import { FlatpickrModule } from '../../../Component/flatpickr/flatpickr.module';
import { TranslateModule } from '@ngx-translate/core';
import {
    CatiaHealthService,
    HealthCheckResult,
} from '../../../core/services/apis/catia/catia-health.service';

@Component({
    selector: 'app-index',
    standalone: true,
    imports: [PageTitleComponent, NgApexchartsModule, CountUpModule, CommonModule, LucideAngularModule, RouterModule,FlatpickrModule, TranslateModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './index.component.html',
    providers: [{ provide: LUCIDE_ICONS, multi: true, useValue: new LucideIconProvider(icons) }]
})
export class IndexComponent {
    private readonly catiaHealthService = inject(CatiaHealthService);
    serviceStatuses: HealthCheckResult[] = [];
    isLoadingHealth = false;
    healthyServicesCount = 0;

    constructor() {
    }

    ngOnInit(): void {
      this.loadServicesHealth();
    }

    loadServicesHealth(): void {
        this.isLoadingHealth = true;

        this.catiaHealthService.getServicesHealth().subscribe({
            next: (services) => {
                this.serviceStatuses = services;
                this.healthyServicesCount = services.filter(
                    (service) => service.status === 'online'
                ).length;
            },
            error: () => {
                this.serviceStatuses = [];
                this.healthyServicesCount = 0;
            },
            complete: () => {
                this.isLoadingHealth = false;
            }
        });
    }

    get allServicesHealthy(): boolean {
        return (
            this.serviceStatuses.length > 0 &&
            this.healthyServicesCount === this.serviceStatuses.length
        );
    }

}
