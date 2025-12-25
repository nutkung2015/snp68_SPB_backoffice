import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs'; // Import tap operator
import { jwtDecode } from 'jwt-decode';
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

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;

  constructor(private http: HttpClient) { }

  register(userData: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        if (response && response.data && response.data.token) {
          this.setToken(response.data.token);
          if (response.data.role) {
            localStorage.setItem('userRole', response.data.role);
            localStorage.setItem(
              'projectCustomizations',
              JSON.stringify(response.data.projectCustomizations)
            );
          }
          if (response.data.projectMemberships) {
            localStorage.setItem(
              'projectMemberships',
              JSON.stringify(response.data.projectMemberships)
            );
          } else {
            localStorage.removeItem('projectMemberships');
          }
        }
      })
    );
  }

  getProfile(): Observable<any> {
    // Assuming you have an interceptor to add the token to the header
    return this.http.get(`${this.apiUrl}/profile`);
  }

  setToken(token: string): void {
    localStorage.setItem('authToken', token);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  removeToken(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('projectMemberships');
    localStorage.removeItem('projectCustomizations');
    localStorage.removeItem('project_id');
  }

  getDecodedToken(): any {
    const token = this.getToken();
    if (token) {
      try {
        const decoded = jwtDecode(token);
        console.log('AuthService: Decoded Token:', decoded);
        return decoded;
      } catch (Error) {
        console.error('AuthService: Error decoding token:', Error);
        return null;
      }
    }
    console.log('AuthService: No token found.');
    return null;
  }

  getUserRoleFromStorage(): string | null {
    return localStorage.getItem('userRole');
  }

  getUserRole(): string | null {
    // Try to get role from localStorage first, fallback to token if not found
    let role = this.getUserRoleFromStorage();
    if (!role) {
      const decodedToken = this.getDecodedToken();
      role = decodedToken ? decodedToken.role : null;
      console.log('AuthService: User Role from token:', role);
    } else {
      console.log('AuthService: User Role from storage:', role);
    }
    return role;
  }

  getProjectMemberships(): any[] | null {
    const memberships = localStorage.getItem('projectMemberships');
    if (memberships) {
      try {
        return JSON.parse(memberships);
      } catch (e) {
        console.error('AuthService: Error parsing project memberships:', e);
        return null;
      }
    }
    return null;
  }

  hasProjectMembership(): boolean {
    const userRole = this.getUserRole();
    if (userRole === 'juristic') {
      const memberships = this.getProjectMemberships();
      return !!memberships && memberships.length > 0;
    }
    return true; // Non-juristic roles don't need project membership check for this logic
  }

  getUserName(): string | null {
    const decodedToken = this.getDecodedToken();
    if (decodedToken) {
      // ลองดึงจาก name, username, หรือ email
      return (
        decodedToken.name || decodedToken.username || decodedToken.email || null
      );
    }
    return null;
  }

  getUserId(): string | null {
    const decodedToken = this.getDecodedToken();
    if (decodedToken) {
      // ดึง user ID จาก token (อาจเป็น id, userId, user_id ขึ้นอยู่กับ backend)
      return (
        decodedToken.id || decodedToken.userId || decodedToken.user_id || null
      );
    }
    return null;
  }

  isLoggedIn(): boolean {
    const token = this.getToken();
    if (!token) return false;
    const decodedToken = this.getDecodedToken();
    return decodedToken && decodedToken.exp * 1000 > Date.now(); // Check if token is not expired
  }
}
