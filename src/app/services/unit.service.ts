import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// อัปเดต interface ให้ตรงกับ API structure ใหม่
export interface Unit {
  project_id: string;
  unit_number: string;
  zone: string;
  building: string;
  floor: string; // เพิ่มกลับมาตาม API
}

export interface UnitInvitation {
  id: string;
  unit_id: string;
  invited_by: string;
  code: string;
  status: string;
  role: string;
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
  status: string;
  message: string;
  invitation_code: string;
}

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private apiUrl = 'http://localhost:5000/api';
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private http: HttpClient) { }

  // สร้าง unit invitation ใหม่
  createUnitInvitation(invitationData: CreateUnitInvitationRequest): Observable<UnitInvitationResponse> {
    this.isLoadingSubject.next(true);

    return this.http.post<UnitInvitationResponse>(`${this.apiUrl}/unit_invitations`, invitationData)
      .pipe(
        map(response => response),
        catchError(this.handleError.bind(this))
      );
  }

  // ดึงรายการ units สำหรับ dropdown selection - อัปเดต return type
  getUnits(projectId?: string): Observable<Unit[]> {
    this.isLoadingSubject.next(true);
    let params = '';

    if (projectId) {
      params = `?project_id=${projectId}`;
    }

    return this.http.get<any>(`${this.apiUrl}/units${params}`)
      .pipe(
        map(response => {
          // อัปเดตให้ตรงกับ structure ใหม่จาก API (รวม floor)
          return (response.data || []).map((unit: any) => ({
            project_id: unit.project_id,
            unit_number: unit.unit_number,
            zone: unit.zone,
            building: unit.building,
            floor: unit.floor
          }));
        }),
        catchError(this.handleError.bind(this))
      );
  }

  // ดึงรายการ unit invitations (คล้ายกับ project invitations)
  getUnitInvitations(projectId?: string, status?: string): Observable<UnitInvitation[]> {
    this.isLoadingSubject.next(true);
    let params = new URLSearchParams();

    if (projectId) {
      params.append('project_id', projectId);
    }

    if (status && status !== 'all') {
      params.append('status', status);
    }

    return this.http.get<any>(`${this.apiUrl}/unit_invitations?${params.toString()}`)
      .pipe(
        map(response => {
          return (response.data || []).map((item: any) => ({
            ...item,
            expires_at: new Date(item.expires_at),
            created_at: new Date(item.created_at),
          }));
        }),
        catchError(this.handleError.bind(this))
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    this.isLoadingSubject.next(false);

    let errorMessage = 'เกิดข้อผิดพลาดที่ไม่คาดคิด';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `เกิดข้อผิดพลาด: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.status === 0) {
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้';
      } else {
        errorMessage = `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (รหัส: ${error.status})`;
      }
    }

    console.error('UnitService Error:', error);
    return throwError(errorMessage);
  }
}
