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

export interface Zone {
  id: string;
  project_id: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  guard_phone?: string;
  guard_phone_2?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateZoneRequest {
  project_id: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  guard_phone?: string;
  guard_phone_2?: string;
}

export interface UpdateZoneRequest {
  name?: string;
  code?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  guard_phone?: string;
  guard_phone_2?: string;
}

export interface BindUnitsRequest {
  unit_ids: string[];
}

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
  id: string;
  project_id: string;
  unit_number: string;
  zone: string;
  building: string;
  area_sqm: number;
  floor: string | null;
  status: string | null;
  invite_only?: boolean | null;
  qr_invite_enabled?: boolean | null;
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
  reporter_tel: string;
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
// ... existing interfaces ...

export interface HouseModel {
  id: number;
  project_id: string;
  model_name: string;
  plan_file_url: string | null;
  detail_file_url: string | null;
  updated_at: string;
}

export interface GenericApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
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
        ...this.getHttpOptions(),
        params,
      })
      .pipe(
        catchError((error) => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  /**
   * Get announcements for a specific project (resident view)
   * Automatically retrieves project_id from projectMemberships in localStorage
   */
  getAnnouncementsByProject(params?: any): Observable<AnnouncementResponse> {
    this.isLoadingSubject.next(true);

    // ดึง project_id จาก projectMemberships ใน localStorage
    let projectId: string | null = null;
    const projectMembershipsStr = localStorage.getItem('projectMemberships');
    if (projectMembershipsStr) {
      try {
        const projectMemberships = JSON.parse(projectMembershipsStr);
        // ถ้ามี projectMemberships และมีข้อมูล ให้เอา project_id จากตัวแรก
        if (projectMemberships && projectMemberships.length > 0) {
          projectId = projectMemberships[0].project_id;
          console.log('RestService: Using project_id from memberships:', projectId);
        }
      } catch (e) {
        console.error('RestService: Error parsing projectMemberships:', e);
      }
    }

    // สร้าง HttpParams และเพิ่ม project_id
    let httpParams = new HttpParams();
    if (projectId) {
      httpParams = httpParams.set('project_id', projectId);
    }

    // เพิ่ม params อื่นๆ ที่ส่งมา
    if (params) {
      Object.keys(params).forEach((key) => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http
      .get<AnnouncementResponse>(`${this._apiUrl}/api/announcements/resident`, {
        ...this.getHttpOptions(),
        params: httpParams,
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
        `${this._apiUrl}/api/announcements/${id}`,
        this.getHttpOptions()
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
        announcement,
        this.getHttpOptions()
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => this.handleError(error)),
        finalize(() => this.isLoadingSubject.next(false))
      );
  }

  createAnnouncementMultipart(formData: FormData): Observable<HttpEvent<any>> {
    this.isLoadingSubject.next(true);

    // ดึง project_id จาก projectMemberships ใน localStorage
    const projectMembershipsStr = localStorage.getItem('projectMemberships');
    if (projectMembershipsStr) {
      try {
        const projectMemberships = JSON.parse(projectMembershipsStr);
        // ถ้ามี projectMemberships และมีข้อมูล ให้เอา project_id จากตัวแรก
        if (projectMemberships && projectMemberships.length > 0) {
          const projectId = projectMemberships[0].project_id;
          formData.append('project_id', projectId);
          console.log('RestService: Added project_id to FormData:', projectId);
        }
      } catch (e) {
        console.error('RestService: Error parsing projectMemberships:', e);
      }
    }

    return this.http
      .post(`${this._apiUrl}/api/announcements`, formData, {
        ...this.getHttpOptionsForFormData(),
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
        announcement,
        this.getHttpOptions()
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
        `${this._apiUrl}/api/announcements/${id}`,
        this.getHttpOptions()
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
        ...this.getHttpOptionsForFormData(),
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

  private getHttpOptionsForFormData() {
    return {
      headers: new HttpHeaders({
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
  getCommonIssues(params?: any): Observable<PersonalRepairResponse> {
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

    const url = `${this.apiUrl}/api/repairs/common`;

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
   * Update common issue (status, assigned_to, notes)
   */
  updateCommonIssueStatus(id: string, data: any): Observable<any> {
    const url = `${this.apiUrl}/api/repairs/common/${id}`;
    return this.http.patch(url, data, this.getHttpOptions());
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
    const url = `${this.apiUrl}/api/project_invitations/join`;
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
    const url = `${this.apiUrl}/api/units/invitations`;

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

    const url = `${this.apiUrl}/api/units`;
    return this.http.get<any>(url, { ...this.getHttpOptions(), params }).pipe(
      map((response) => {
        this.isLoadingSubject.next(false);
        return response.data || [];
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

    const url = `${this.apiUrl}/api/units/unit-invitations`;
    return this.http.get<any>(url, { ...this.getHttpOptions(), params }).pipe(
      map((response) => {
        this.isLoadingSubject.next(false);
        // response.data is an object with all_units_invite and unit_invitations arrays
        const invitations = response.data?.all_units_invite || response.data?.unit_invitations || [];
        return invitations.map((item: any) => ({
          ...item,
          expires_at: new Date(item.expires_at),
          created_at: new Date(item.created_at),
        }));
      }),
      catchError(this.handleError.bind(this))
    );
  }

  // ==================== House Project Management ====================

  /**
   * ดึงข้อมูลแบบบ้านทั้งหมดในโครงการ
   * GET /api/projects/:id/house-models
   */
  getHouseModels(projectId: string): Observable<GenericApiResponse<HouseModel[]>> {
    const url = `${this.apiUrl}/api/projects/${projectId}/house-models`;
    return this.http.get<GenericApiResponse<HouseModel[]>>(url, this.getHttpOptions());
  }

  /**
   * บันทึกหรืออัปเดตข้อมูลไฟล์ของแบบบ้าน (Upsert)
   * POST /api/house-models
   * รับ FormData ที่มี project_id, model_name, files
   */
  saveHouseModel(data: FormData): Observable<GenericApiResponse<HouseModel>> {
    // เปลี่ยนจาก /api/house-models เป็น /api/projects/house-models
    const url = `${this.apiUrl}/api/projects/house-models`;
    return this.http.post<GenericApiResponse<HouseModel>>(url, data, this.getHttpOptionsForFormData());
  }

  /**
   * ลบข้อมูลแบบบ้าน
   * DELETE /api/house-models/:id
   */
  deleteHouseModel(id: number): Observable<GenericApiResponse<any>> {
    const url = `${this.apiUrl}/api/house-models/${id}`;
    return this.http.delete<GenericApiResponse<any>>(url, this.getHttpOptions());
  }

  // ==================== Project Information (Village Info) ====================

  /**
   * ข้อมูลหมู่บ้าน (Project Info)
   * GET /api/projects/info-docs?project_id={project_id}
   */
  getProjectInfoDocs(projectId: string): Observable<GenericApiResponse<any>> {
    const url = `${this.apiUrl}/api/projects/info-docs`;
    const params = new HttpParams().set('project_id', projectId);
    return this.http.get<GenericApiResponse<any>>(url, { ...this.getHttpOptions(), params });
  }

  /**
   * บันทึกข้อมูลหมู่บ้าน (Project Info)
   * POST /api/projects/info-docs
   * ส่ง project_id ใน FormData (ดึงจาก localStorage อัตโนมัติ)
   */
  saveProjectInfoDocs(data: FormData): Observable<GenericApiResponse<any>> {
    // ดึง project_id จาก projectMemberships ใน localStorage
    const projectMembershipsStr = localStorage.getItem('projectMemberships');
    if (projectMembershipsStr) {
      try {
        const projectMemberships = JSON.parse(projectMembershipsStr);
        // ถ้ามี projectMemberships และมีข้อมูล ให้เอา project_id จากตัวแรก
        if (projectMemberships && projectMemberships.length > 0) {
          const projectId = projectMemberships[0].project_id;
          // เช็คว่ามี project_id ใน FormData แล้วหรือยัง ถ้ายังให้ append
          if (!data.has('project_id')) {
            data.append('project_id', projectId);
            console.log('RestService: Added project_id to FormData:', projectId);
          }
        }
      } catch (e) {
        console.error('RestService: Error parsing projectMemberships:', e);
      }
    }

    const url = `${this.apiUrl}/api/projects/info-docs`;
    return this.http.post<GenericApiResponse<any>>(url, data, this.getHttpOptionsForFormData());
  }

  deleteProjectInfoDocs(projectId: string, fileType: 'rules' | 'project_detail'): Observable<GenericApiResponse<any>> {
    const url = `${this.apiUrl}/api/projects/info-docs`;
    return this.http.delete<GenericApiResponse<any>>(url, {
      ...this.getHttpOptions(),
      body: { project_id: projectId, file_type: fileType }
    });
  }

  // ==================== PDF Stream & V2 Endpoints ====================

  /**
   * Generate URL for pdf-stream endpoint (with caching support)
   * @param projectId - Project ID
   * @param cloudinaryUrl - Raw Cloudinary URL
   * @param filename - Filename for download
   * @param disposition - 'inline' (view) or 'attachment' (download)
   * @returns Full URL with authentication token
   */
  getStreamPdfUrl(projectId: string, cloudinaryUrl: string, filename: string = 'document.pdf', disposition: 'inline' | 'attachment' = 'inline'): string {
    if (!cloudinaryUrl || !projectId) return '';

    // Check if URL is already a stream URL (avoid double wrapping)
    if (cloudinaryUrl.includes('/pdf-stream')) return cloudinaryUrl;

    const token = localStorage.getItem('authToken') || '';
    const baseUrl = this.apiUrl;

    const encodedUrl = encodeURIComponent(cloudinaryUrl);
    const encodedFilename = encodeURIComponent(filename);

    // Note: ensure endpoint path matches backend: /api/projects/:project_id/member/pdf-stream
    return `${baseUrl}/api/projects/${projectId}/member/pdf-stream?url=${encodedUrl}&filename=${encodedFilename}&disposition=${disposition}&token=${token}`;
  }

  /**
   * V2: Get House Models (returns raw URLs for streaming)
   * GET /api/projects/:id/member/my-house-model-v2
   */
  getHouseModelsV2(projectId: string): Observable<GenericApiResponse<HouseModel[]>> {
    const url = `${this.apiUrl}/api/projects/${projectId}/member/my-house-model-v2`;
    return this.http.get<GenericApiResponse<HouseModel[]>>(url, this.getHttpOptions());
  }

  /**
   * V2: Get Project Info Docs (returns raw URLs for streaming)
   * GET /api/projects/:id/member/info-docs-v2
   */
  getProjectInfoDocsV2(projectId: string): Observable<GenericApiResponse<any[]>> {
    const url = `${this.apiUrl}/api/projects/${projectId}/member/info-docs-v2`;
    return this.http.get<GenericApiResponse<any[]>>(url, this.getHttpOptions());
  }

  // ==================== Resident Management ====================

  /**
   * Get all residents in a project
   * GET /api/residents?project_id={projectId}
   */
  getResidents(projectId: string): Observable<GenericApiResponse<any[]>> {
    const url = `${this.apiUrl}/api/residents`;
    const params = new HttpParams().set('project_id', projectId);
    return this.http.get<GenericApiResponse<any[]>>(url, { ...this.getHttpOptions(), params });
  }

  // ==================== Project Customization ====================

  getProjectCustomization(projectId: string): Observable<GenericApiResponse<any>> {
    const url = `${this.apiUrl}/api/project-customizations/${projectId}`;
    return this.http.get<GenericApiResponse<any>>(url, this.getHttpOptions());
  }

  createProjectCustomization(data: FormData): Observable<GenericApiResponse<any>> {
    const url = `${this.apiUrl}/api/project-customizations`;
    return this.http.post<GenericApiResponse<any>>(url, data, this.getHttpOptionsForFormData());
  }

  updateProjectCustomization(projectId: string, data: FormData): Observable<GenericApiResponse<any>> {
    const url = `${this.apiUrl}/api/project-customizations/${projectId}`;
    return this.http.put<GenericApiResponse<any>>(url, data, this.getHttpOptionsForFormData());
  }

  // ==================== Unit & Invitation Extras ====================

  /**
   * Import units from Excel file
   */
  importUnits(data: FormData): Observable<GenericApiResponse<any>> {
    const url = `${this.apiUrl}/api/units/import`;
    return this.http.post<GenericApiResponse<any>>(url, data, this.getHttpOptionsForFormData());
  }

  // Zone Management
  getZones(projectId: string): Observable<Zone[]> {
    const params = new HttpParams().set('project_id', projectId);
    return this.http.get<GenericApiResponse<Zone[]>>(`${this.apiUrl}/api/zones`, { ...this.getHttpOptions(), params })
      .pipe(map(response => response.data || []));
  }

  getZone(id: string): Observable<Zone> {
    return this.http.get<Zone>(`${this.apiUrl}/api/zones/${id}`, this.getHttpOptions());
  }

  createZone(data: CreateZoneRequest): Observable<Zone> {
    return this.http.post<Zone>(`${this.apiUrl}/api/zones`, data, this.getHttpOptions());
  }

  updateZone(id: string, data: UpdateZoneRequest): Observable<Zone> {
    return this.http.put<Zone>(`${this.apiUrl}/api/zones/${id}`, data, this.getHttpOptions());
  }

  deleteZone(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/zones/${id}`, this.getHttpOptions());
  }

  bindUnitsToZone(zoneId: string, unitIds: string[]): Observable<any> {
    return this.http.put(`${this.apiUrl}/api/zones/${zoneId}/units`, { unit_ids: unitIds }, this.getHttpOptions());
  }

  getZoneUnits(zoneId: string): Observable<Unit[]> {
    return this.http.get<Unit[]>(`${this.apiUrl}/api/zones/${zoneId}/units`, this.getHttpOptions());
  }

  /**
   * Helper to match existing units with string-based zones to real Zone entities
   */
  matchZoneByName(projectId: string): Observable<any> {
    // This could be a backend endpoint, but for now let's do it client-side or assume a specific endpoint exists
    // If we want a specialized endpoint: POST /api/zones/match-by-name
    return this.http.post(`${this.apiUrl}/api/zones/match-by-name`, { project_id: projectId }, this.getHttpOptions());
  }

  // Auth
  login(credentials: { email?: string; password?: string, phone?: string }): Observable<any> {
    const url = `${this.apiUrl}/api/auth/login`;
    return this.http.post(url, credentials);
  }

  /**
   * Create invitation for project (Juristic/Security)
   */
  createProjectInvitation(data: { project_id: string, role: string }): Observable<ProjectInvitationResponse> {
    const url = `${this.apiUrl}/api/project_invitations/create`;
    return this.http.post<ProjectInvitationResponse>(url, data, this.getHttpOptions());
  }

  // ==================== Visitor Management ====================

  /**
   * Get visitor statistics for dashboard
   * GET /api/security/stats?project_id={project_id}
   */
  getVisitorStats(projectId: string): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/security/stats`;
    const params = new HttpParams().set('project_id', projectId);

    return this.http.get(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Get entry logs with pagination and filtering
   * GET /api/security/entry/logs?project_id={project_id}&page={page}&limit={limit}&filter={filter}
   */
  getEntryLogs(params: {
    project_id: string;
    page?: number;
    limit?: number;
    filter?: 'all' | 'inside' | 'exited' | 'pending';
  }): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/security/entry/logs`;

    let queryParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      const value = (params as any)[key];
      if (value !== null && value !== undefined) {
        queryParams = queryParams.set(key, value.toString());
      }
    });

    return this.http.get(url, { ...this.getHttpOptions(), params: queryParams }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Get entry log by ID
   * GET /api/security/entry/logs/:id
   */
  getEntryLogById(id: string): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/security/entry/logs/${id}`;

    return this.http.get(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ==================== Juristic Permission Management ====================

  /**
   * Get juristic members with their permissions
   * GET /api/juristic/members?project_id={projectId}
   */
  getJuristicMembersWithPermissions(projectId: string): Observable<GenericApiResponse<any[]>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/members`;
    const params = new HttpParams().set('project_id', projectId);

    return this.http.get<GenericApiResponse<any[]>>(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Update juristic member permissions
   * PUT /api/juristic/members/:userId/permissions
   */
  updateJuristicPermissions(userId: string, permissions: { [key: string]: boolean }, projectId: string): Observable<GenericApiResponse<any>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/members/${userId}/permissions`;
    const body = { permissions, project_id: projectId };

    return this.http.put<GenericApiResponse<any>>(url, body, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
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
