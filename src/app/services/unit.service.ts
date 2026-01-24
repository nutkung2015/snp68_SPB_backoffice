import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, finalize, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ==================== Interfaces ====================

export interface CreateUnitRequest {
  project_id: string;
  unit_number: string;
  zone: string;
  building: string;
  floor?: string;
  // Add other properties if needed
}

export interface Unit {
  id?: string;
  project_id: string;
  unit_number: string;
  zone: string;
  zone_id?: string | null;
  building: string;
  floor: string | null;
  area_sqm?: number;
  status?: string | null;
}

export interface UnitInvitation {
  id: string;
  unit_id: string;
  invited_by: string;
  code: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  role: 'owner' | 'tenant' | 'family';
  invited_email?: string;
  invited_phone?: string;
  expires_at: Date;
  created_at: Date;
  unit_name?: string;
  project_name?: string;
}

export interface CreateUnitInvitationRequest {
  unit_id: string;
  role: 'owner' | 'tenant' | 'family';
  invited_email?: string;
  invited_phone?: string;
}

export interface UnitInvitationResponse {
  status: 'success' | 'error';
  message: string;
  invitation_code?: string;
  data?: UnitInvitation;
}

export interface UnitsResponse {
  status: 'success' | 'error';
  message?: string;
  data: Unit[];
  pagination?: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
  };
}

export interface UnitInvitationsResponse {
  status: 'success' | 'error';
  message?: string;
  data: UnitInvitation[];
}

export interface GetUnitsParams {
  project_id?: string;
  zone?: string;
  zone_id?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ==================== Service ====================

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private readonly apiUrl = environment.apiUrl;

  // Loading state
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) { }

  // ==================== HTTP Options ====================

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem(environment.auth.tokenKey)}`
      })
    };
  }

  // ==================== Unit Methods ====================

  /**
   * ดึงรายการ units ทั้งหมด
   */
  getUnits(params?: GetUnitsParams): Observable<Unit[]> {
    this.isLoadingSubject.next(true);

    let httpParams = new HttpParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }

    return this.http.get<UnitsResponse>(`${this.apiUrl}/api/units`, {
      ...this.getHttpOptions(),
      params: httpParams
    }).pipe(
      map(response => response.data || []),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * ดึงข้อมูล unit ตาม ID
   */
  getUnitById(unitId: string): Observable<Unit> {
    this.isLoadingSubject.next(true);

    return this.http.get<{ status: string; data: Unit }>(
      `${this.apiUrl}/api/units/${unitId}`,
      this.getHttpOptions()
    ).pipe(
      map(response => response.data),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * ดึงรายการ units สำหรับ dropdown (รูปแบบย่อ)
   */
  getUnitsForDropdown(projectId?: string): Observable<Unit[]> {
    const params: GetUnitsParams = {};
    if (projectId) {
      params.project_id = projectId;
    }
    return this.getUnits(params);
  }

  /**
   * สร้าง unit ใหม่
   */
  createUnit(unitData: CreateUnitRequest): Observable<any> {
    this.isLoadingSubject.next(true);

    return this.http.post<any>(
      `${this.apiUrl}/api/units`,
      unitData,
      this.getHttpOptions()
    ).pipe(
      tap(response => {
        // console.log('Unit created successfully:', response);
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * นำเข้า units ผ่านไฟล์ Excel
   */
  importUnits(formData: FormData): Observable<any> {
    this.isLoadingSubject.next(true);

    return this.http.post<any>(
      `${this.apiUrl}/api/units/import`,
      formData,
      this.getHttpOptions()
    ).pipe(
      tap(response => {
        // console.log('Units imported successfully:', response);
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ==================== Unit Invitation Methods ====================

  /**
   * สร้าง unit invitation ใหม่
   */
  createUnitInvitation(invitationData: CreateUnitInvitationRequest): Observable<UnitInvitationResponse> {
    this.isLoadingSubject.next(true);

    return this.http.post<UnitInvitationResponse>(
      `${this.apiUrl}/api/unit_invitations`,
      invitationData,
      this.getHttpOptions()
    ).pipe(
      tap(response => {
        if (response.status === 'success') {
          console.log('Unit invitation created successfully:', response.invitation_code);
        }
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * ดึงรายการ unit invitations
   */
  getUnitInvitations(projectId?: string, status?: string): Observable<UnitInvitation[]> {
    this.isLoadingSubject.next(true);

    let httpParams = new HttpParams();

    if (projectId) {
      httpParams = httpParams.set('project_id', projectId);
    }

    if (status && status !== 'all') {
      httpParams = httpParams.set('status', status);
    }

    return this.http.get<UnitInvitationsResponse>(
      `${this.apiUrl}/api/unit_invitations`,
      { ...this.getHttpOptions(), params: httpParams }
    ).pipe(
      map(response => {
        return (response.data || []).map(item => ({
          ...item,
          expires_at: new Date(item.expires_at),
          created_at: new Date(item.created_at)
        }));
      }),
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * ยกเลิก unit invitation
   */
  revokeUnitInvitation(invitationId: string): Observable<{ status: string; message: string }> {
    this.isLoadingSubject.next(true);

    return this.http.patch<{ status: string; message: string }>(
      `${this.apiUrl}/api/unit_invitations/${invitationId}/revoke`,
      {},
      this.getHttpOptions()
    ).pipe(
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * ส่ง invitation ซ้ำ
   */
  resendUnitInvitation(invitationId: string): Observable<UnitInvitationResponse> {
    this.isLoadingSubject.next(true);

    return this.http.post<UnitInvitationResponse>(
      `${this.apiUrl}/api/unit_invitations/${invitationId}/resend`,
      {},
      this.getHttpOptions()
    ).pipe(
      catchError(error => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ==================== Error Handling ====================

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.isLoadingSubject.next(false);

    let errorMessage = 'เกิดข้อผิดพลาดที่ไม่คาดคิด';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `เกิดข้อผิดพลาด: ${error.error.message}`;
    } else {
      // Server-side error
      switch (error.status) {
        case 0:
          errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
          break;
        case 400:
          errorMessage = error.error?.message || 'ข้อมูลไม่ถูกต้อง';
          break;
        case 401:
          errorMessage = 'กรุณาเข้าสู่ระบบใหม่';
          break;
        case 403:
          errorMessage = 'คุณไม่มีสิทธิ์ในการดำเนินการนี้';
          break;
        case 404:
          errorMessage = 'ไม่พบข้อมูลที่ต้องการ';
          break;
        case 500:
          errorMessage = 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์';
          break;
        default:
          errorMessage = error.error?.message || `เกิดข้อผิดพลาด (รหัส: ${error.status})`;
      }
    }

    console.error('UnitService Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
