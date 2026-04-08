import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((err) => {
        if (err.status === 401) {
          // alert('You are not authenticated');
          console.log('You are not authenticated', err);
        }

        if (err.status === 500) {
          // alert('An error occurred, we are working on it');
          console.log('An error occurred, we are working on it', err);
        }

        if (err.status === 403) {
          // alert('Hello, you do not have access to this resource!');
          console.log('Hello, you do not have access to this resource!', err);
        }

        return throwError(() => err);
      })
    );
  }
}
