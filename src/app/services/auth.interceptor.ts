import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(private injector: Injector) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // 1. ใส่ withCredentials ให้ทุก Request เพื่อส่ง Cookie
    request = request.clone({
      withCredentials: true
    });

    return next.handle(request).pipe(
      catchError(error => {
        // 2. ถ้าเจอ 401 (Unauthorized)
        if (error instanceof HttpErrorResponse && error.status === 401) {
          // ถ้าเป็น 401 จากการยิง login หรือ refresh เอง ไม่ต้อง retry ให้ error เลย
          if (request.url.includes('login') || request.url.includes('refresh')) {
            return throwError(error);
          }

          return this.handle401Error(request, next);
        } else {
          return throwError(error);
        }
      })
    );
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler) {
    const authService = this.injector.get(AuthService);
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      // 3. เรียก Refresh Token
      return authService.refreshToken().pipe(
        switchMap((token: any) => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(token);
          // 4. Refresh สำเร็จ -> ยิง Request เดิมซ้ำ
          return next.handle(request);
        }),
        catchError((err) => {
          this.isRefreshing = false;
          // 5. Refresh ไม่สำเร็จ -> Logout
          authService.logout();
          return throwError(err);
        })
      );
    } else {
      // 6. กรณีมี Request อื่นยิงมาพร้อมกันระหว่าง Refresh ให้รอจนกว่า Refresh เสร็จ
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(jwt => {
          return next.handle(request);
        })
      );
    }
  }
}