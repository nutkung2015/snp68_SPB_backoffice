import {
  HttpClient,
  HttpHeaders,
  HttpParams,
  HttpErrorResponse,
  HttpEvent,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  posted_by: string;
  attachment_urls: string[];
  audience: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnnouncementResponse {
  status: string;
  data: Announcement[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface CreateAnnouncementRequest {
  id: string; // backend requires explicit id (e.g., annc001)
  title: string;
  content: string;
  type: string;
  audience: string;
  status: string;
  posted_by: string; // user id (foreign key)
  attachment_urls?: string[];
}

type IssueType = 'personal' | 'common';

export interface Unit {
  project_id: string;
  unit_number: string;
  zone: string;
  building: string;
  floor: string;
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

export interface ProjectInvitationResponse {
  status: string;
  message: string;
  project_id: string;
  project_name: string;
  role: string;
}

export interface JoinProjectRequest {
  invitation_code: string;
}

export interface ProjectMembership {
  project_id: string;
  project_name: string;
  role: string;
}

export interface PersonalRepair {
  id: string;
  project_id: string;
  unit_id: string;
  zone: string;
  repair_category: string;
  repair_area: string;
  description: string;
  priority: string;
  status: string;
  reporter_name: string;
  reporter_id: string;
  image_urls: {
    url: string;
    public_id: string;
  }[];
  submitted_date: string;
  updated_at: string;
  assigned_to: string | null;
  notes: string | null;
  estimated_cost: number | null;
  actual_cost: number | null;
}

export interface PersonalRepairResponse {
  status: 'success' | 'error';
  message?: string;
  data: PersonalRepair[];
  count: number;
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class RestService {
  private _apiUrl = environment.apiUrl;
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  // Public getter for apiUrl
  get apiUrl(): string {
    return this._apiUrl;
  }

  constructor(private http: HttpClient) { }

  // Announcement related methods
  getAnnouncements(params?: any): Observable<AnnouncementResponse> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<AnnouncementResponse>(`${this._apiUrl}/api/announcements`, {
        params,
      })
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getAnnouncementById(id: string): Observable<Announcement> {
    this.isLoadingSubject.next(true);
    return this.http
      .get<{ status: string; data: Announcement }>(
        `${this._apiUrl}/api/announcements/${id}`
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  createAnnouncement(
    announcement: CreateAnnouncementRequest
  ): Observable<Announcement> {
    this.isLoadingSubject.next(true);
    return this.http
      .post<{ status: string; data: Announcement }>(
        `${this._apiUrl}/api/announcements`,
        announcement
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  createAnnouncementMultipart(formData: FormData): Observable<HttpEvent<any>> {
    this.isLoadingSubject.next(true);
    return this.http
      .post(`${this._apiUrl}/api/announcements`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  updateAnnouncement(
    id: string,
    announcement: Partial<Announcement>
  ): Observable<Announcement> {
    this.isLoadingSubject.next(true);
    return this.http
      .put<{ status: string; data: Announcement }>(
        `${this._apiUrl}/api/announcements/${id}`,
        announcement
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  deleteAnnouncement(
    id: string
  ): Observable<{ status: string; message: string }> {
    this.isLoadingSubject.next(true);
    return this.http
      .delete<{ status: string; message: string }>(
        `${this._apiUrl}/api/announcements/${id}`
      )
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  uploadAnnouncementFile(file: File): Observable<any> {
    this.isLoadingSubject.next(true);
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post(`${this._apiUrl}/api/announcements/upload`, formData, {
        reportProgress: true,
        observe: 'events',
      })
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  private getHttpOptions() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization:
          'Bearer ' + localStorage.getItem(environment.auth.tokenKey),
      }),
    };
  }

  // ==================== Combined Issues ====================

  /**
   * Get all issues (both personal and common) for Juristic users
   */
  getAllIssuesForJuristic(): Observable<any> {
    const url = `${this.apiUrl}/api/repairs/all-issues`;
    return this.http.get(url, this.getHttpOptions());
  }

  // ==================== Personal Repairs ====================

  /**
   * Create a new personal repair
   */
  createPersonalRepair(repairData: any): Observable<PersonalRepair> {
    this.isLoadingSubject.next(true);
    const projectId = localStorage.getItem('project_id');

    // เพิ่ม project_id เข้าไปใน repairData
    const dataWithProjectId = {
      ...repairData,
      project_id: projectId,
    };

    const url = `${this.apiUrl}/api/repairs/personal`;

    return this.http
      .post<{ status: string; data: PersonalRepair }>(
        url,
        dataWithProjectId,
        this.getHttpOptions()
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  /**
   * Get personal repair by ID
   * @param params Object containing project_id and issue_id, or just a string ID
   */
  getPersonalRepairById(id: string): Observable<PersonalRepair> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/repairs/personal/${id}`;

    return this.http
      .get<{ status: string; data: PersonalRepair }>(url, this.getHttpOptions())
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  getPersonalRepairs(params?: any): Observable<PersonalRepairResponse> {
    this.isLoadingSubject.next(true);

    // สร้าง HttpParams
    let queryParams = new HttpParams();

    // เพิ่ม params ทั้งหมดที่ส่งมา
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] && params[key] !== 'all') {
          queryParams = queryParams.append(key, params[key]);
        }
      });
    }

    const url = `${this.apiUrl}/api/repairs/personal`;

    return this.http
      .get<PersonalRepairResponse>(url, {
        ...this.getHttpOptions(),
        params: queryParams,
      })
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  /**
   * Update personal repair status
   */
  updatePersonalRepairStatus(id: string, statusData: any): Observable<any> {
    const url = `${this.apiUrl}/api/repairs/personal/${id}`;
    return this.http.patch(url, statusData, this.getHttpOptions());
  }

  /**
   * Delete personal repair
   */
  deletePersonalRepair(id: string): Observable<any> {
    const url = `${this.apiUrl}/api/repairs/personal/${id}`;
    return this.http.delete(url, this.getHttpOptions());
  }

  /**
   * Update personal repair with flexible field updates
   * Supports partial updates - only send fields that need to be updated
   * 
   * @param id - The repair ID
   * @param data - Partial update data (can include any combination of fields)
   * 
   * Examples:
   * 1. Update only status: { status: "pending" }
   * 2. Update status to completed: { status: "completed", actual_cost: 4500, notes: "ซ่อมเสร็จเรียบร้อย" }
   * 3. Full update: { status: "in_progress", assigned_to: "user123", notes: "...", estimated_cost: 3000, actual_cost: 2800 }
   */
  updatePersonalRepair(id: string, data: Partial<{
    status?: string;
    assigned_to?: string;
    assigned_to_id?: string;
    notes?: string;
    estimated_cost?: number;
    actual_cost?: number;
    repair_area?: string;
    priority?: string;
    repair_category?: string;
  }>): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/repairs/personal/${id}`;

    return this.http.put(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ==================== Common Issues ====================

  /**
   * Create a new common issue
   */
  createCommonIssue(issueData: any): Observable<any> {
    const url = `${this.apiUrl}/api/repairs/common`;
    return this.http.post(url, issueData, this.getHttpOptions());
  }

  /**
   * Get all common issues
   */
  getCommonIssues(params?: any): Observable<any> {
    let queryParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] && params[key] !== 'all') {
          queryParams = queryParams.append(key, params[key]);
        }
      });
    }
    const url = `${this.apiUrl}/api/repairs/common${queryParams.toString() ? `?${queryParams.toString()}` : ''
      }`;
    return this.http.get(url, this.getHttpOptions());
  }

  // ==================== Juristic Members ====================

  /**
   * Get juristic members for a project
   */
  getJuristicMembers(projectId: string): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/members`;
    const params = new HttpParams().set('project_id', projectId);

    return this.http.get(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Get common issue by ID
   */
  getCommonIssueById(id: string): Observable<any> {
    const url = `${this.apiUrl}/api/repairs/common/${id}`;
    return this.http.get(url, this.getHttpOptions());
  }

  /**
   * Update common issue status
   */
  updateCommonIssueStatus(id: string, statusData: any): Observable<any> {
    const url = `${this.apiUrl}/api/repairs/common/${id}`;
    return this.http.patch(url, statusData, this.getHttpOptions());
  }

  /**
   * Delete common issue
   */
  deleteCommonIssue(id: string): Observable<any> {
    const url = `${this.apiUrl}/api/repairs/common/${id}`;
    return this.http.delete(url, this.getHttpOptions());
  }

  // ==================== Project Invitations ====================

  /**
   * Join a project using an invitation code
   */
  joinProject(invitationCode: string): Observable<ProjectInvitationResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/project_invitations/join`;
    const body: JoinProjectRequest = { invitation_code: invitationCode };

    return this.http
      .post<ProjectInvitationResponse>(url, body, this.getHttpOptions())
      .pipe(
        map((response) => {
          this.isLoadingSubject.next(false);
          return response;
        }),
        catchError(this.handleError.bind(this))
      );
  }

  // ==================== Unit Management ====================

  /**
   * Create a new unit invitation
   */
  createUnitInvitation(
    invitationData: CreateUnitInvitationRequest
  ): Observable<UnitInvitationResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/unit_invitations`;

    return this.http
      .post<UnitInvitationResponse>(url, invitationData, this.getHttpOptions())
      .pipe(
        map((response) => {
          this.isLoadingSubject.next(false);
          return response;
        }),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Get list of units with optional project filtering
   */
  getUnits(projectId?: string): Observable<Unit[]> {
    this.isLoadingSubject.next(true);
    let params = new HttpParams();

    if (projectId) {
      params = params.append('project_id', projectId);
    }

    const url = `${this.apiUrl}/units`;
    return this.http.get<any>(url, { ...this.getHttpOptions(), params }).pipe(
      map((response) => {
        this.isLoadingSubject.next(false);
        return (response.data || []).map((unit: any) => ({
          project_id: unit.project_id,
          unit_number: unit.unit_number,
          zone: unit.zone,
          building: unit.building,
          floor: unit.floor,
        }));
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get list of unit invitations with optional filtering
   */
  getUnitInvitations(
    projectId?: string,
    status?: string
  ): Observable<UnitInvitation[]> {
    this.isLoadingSubject.next(true);
    let params = new HttpParams();

    if (projectId) {
      params = params.append('project_id', projectId);
    }

    if (status && status !== 'all') {
      params = params.append('status', status);
    }

    const url = `${this.apiUrl}/unit_invitations`;
    return this.http.get<any>(url, { ...this.getHttpOptions(), params }).pipe(
      map((response) => {
        this.isLoadingSubject.next(false);
        return (response.data || []).map((item: any) => ({
          ...item,
          expires_at: new Date(item.expires_at),
          created_at: new Date(item.created_at),
        }));
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Handle HTTP errors
   */
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

    console.error('RestService Error:', error);
    return throwError(errorMessage);
  }
}
