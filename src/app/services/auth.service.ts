import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Auth, signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from '@angular/fire/auth';
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

  constructor(private http: HttpClient, private auth: Auth) { }

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

  refreshToken(): Observable<any> {
    // ยิงไปที่ endpoint นี้ แล้ว Backend จะอ่าน Cookie 'refreshToken' เอง
    // ต้องมี { withCredentials: true } เพื่อส่ง Cookie ไปด้วย
    return this.http.post(`${this.apiUrl}/refresh`, {}, { withCredentials: true }).pipe(
      tap((response: any) => {
        // ถ้า Backend ส่งข้อมูล User ใหม่กลับมา ก็อัปเดตเข้าระบบ
        if (response && response.data) {
          this.currentUserSubject.next(response.data);
        }
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

  // --- Firebase Phone Auth & Password Reset ---

  checkPhoneExists(phone: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/check-phone`, { phone });
  }

  // sendOTP will be called from the component where RecaptchaVerifier is initialized
  async sendOTP(phone: string, appVerifier: any): Promise<any> {
    try {
      const confirmationResult = await signInWithPhoneNumber(this.auth, phone, appVerifier);
      return confirmationResult;
    } catch (error) {
      throw error;
    }
  }

  // verifyOTP takes the confirmationResult from sendOTP and the user's code
  async verifyOTP(confirmationResult: any, code: string): Promise<any> {
    try {
      const result = await confirmationResult.confirm(code);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getFirebaseToken(user: any): Promise<string> {
    if (user && user.getIdToken) {
      return await user.getIdToken();
    }
    return '';
  }

  resetPassword(password: string, firebaseToken: string): Observable<any> {
    // Send the new password and the firebase token to the backend
    return this.http.post(`${this.apiUrl}/reset-password-firebase`, {
      new_password: password, // Core fix: Backend expects 'new_password'
      password: password,     // Keep just in case
      token: firebaseToken,
      firebase_token: firebaseToken,
      id_token: firebaseToken
    });
  }
}
