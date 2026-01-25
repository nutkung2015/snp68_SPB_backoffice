import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface RegisterRequest {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  role: 'juristic' | 'resident';
}

export interface RegisterResponse {
  status: string;
  message: string;
  data?: {
    user_id: string;
    email: string;
    role: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  username?: string;
  projectMemberships?: any[];
  projectCustomizations?: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  // Use BehaviorSubject to hold the current user state
  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Flag to track if the initial session check has completed
  private sessionCheckedSubject = new BehaviorSubject<boolean>(false);
  public sessionChecked$ = this.sessionCheckedSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Check if the user has a valid session (HttpOnly cookie)
   * This should be called on app initialization.
   */
  checkSession(): Observable<UserProfile | null> {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
      map(response => {
        console.log('AuthService: Check Session Response Full:', response);

        // Handle different response structures
        let user = response;
        if (response.data) {
          user = response.data;
        }

        // Check if user info is nested under 'user' key (common in some API frameworks)
        if (user.user) {
          user = user.user;
        }

        if (!user.role && response.role) {
          user.role = response.role;
        }

        // Normalize role to lowercase
        if (user.role && typeof user.role === 'string') {
          user.role = user.role.toLowerCase();
        }

        // Normalize project_memberships -> projectMemberships
        if (!user.projectMemberships && user.project_memberships) {
          user.projectMemberships = user.project_memberships;
        }

        console.log('AuthService: Resolved User Object:', user);

        this.currentUserSubject.next(user);
        this.sessionCheckedSubject.next(true);
        return user;
      }),
      catchError(error => {
        console.log('AuthService: No active session found.', error);
        this.currentUserSubject.next(null);
        this.sessionCheckedSubject.next(true);
        return of(null);
      })
    );
  }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    // withCredentials is handled by Interceptor
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // Backend should set the HttpOnly cookie.
        // We just need to update our local user state.
        if (response && response.data) {
          const user = {
            ...response.data,
            // If backend returns role separately or inside data
            role: response.data.role ? response.data.role.toLowerCase() : null
          };

          // Normalize project_memberships -> projectMemberships
          if (!user.projectMemberships && user.project_memberships) {
            user.projectMemberships = user.project_memberships;
          }

          this.currentUserSubject.next(user);

          // Legacy support: We might still need these in localStorage if other parts of the app read them directly
          // BUT the goal is to remove reliance on localStorage.
          // For now, I will NOT write to localStorage to enforce the refactor.
        }
      })
    );
  }

  logout(): Observable<any> {
    return this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.currentUserSubject.next(null);
        // Clear legacy storage just in case
        localStorage.clear();
      }),
      catchError(err => {
        // Even if API fails, clear local state
        this.currentUserSubject.next(null);
        localStorage.clear();
        return of(null);
      })
    );
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  // --- State Getters ---

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {
    return this.currentUserSubject.value?.role || null;
  }

  getProjectMemberships(): any[] | null {
    return this.currentUserSubject.value?.projectMemberships || null;
  }

  hasProjectMembership(): boolean {
    const user = this.currentUserSubject.value;
    if (user?.role === 'juristic') {
      return !!user.projectMemberships && user.projectMemberships.length > 0;
    }
    return true;
  }

  getUserName(): string | null {
    const user = this.currentUserSubject.value;
    return user ? user.full_name : null;
  }

  getUserId(): string | null {
    const user = this.currentUserSubject.value;
    return user ? (user.id || (user as any).userId || (user as any).user_id) : null;
  }

  // --- Legacy Methods to be removed or mapped ---
  // getToken/setToken/removeToken are removed as we don't handle tokens client-side anymore.
}
