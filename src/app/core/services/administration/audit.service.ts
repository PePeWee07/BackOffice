import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  AuditLog,
  AuditLogPage,
  AuditLogQuery,
  AuditTable,
} from '../../../store/Audit/audit-model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuditService {
  private http = inject(HttpClient);

  private apiUrl =
    environment.backEnd.baseUrl + environment.backEnd.api.root + '/audit';

  getPagedActions(query: AuditLogQuery): Observable<AuditLogPage> {
    let params = new HttpParams();
    if (query.page !== undefined) params = params.set('page', query.page);
    if (query.size !== undefined) params = params.set('size', query.size);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.table) params = params.set('table', query.table);
    if (query.action) params = params.set('action', query.action);
    if (query.search) params = params.set('search', query.search);

    return this.http.get<AuditLogPage>(`${this.apiUrl}/actions/page`, { params });
  }

  getById(id: number): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.apiUrl}/actions/${id}`);
  }

  listTables(): Observable<AuditTable[]> {
    return this.http.get<AuditTable[]>(`${this.apiUrl}/actions/tables`);
  }
}
