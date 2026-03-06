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
import { AuthService } from './auth.service';

export interface Zone {
  id: string;
  project_id: string;
  name: string;
  code?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  guard_post_id?: string;
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
  guard_post_id?: string;
}

export interface UpdateZoneRequest {
  name?: string;
  code?: string;
  description?: string;
  color?: string;
  sort_order?: number;
  guard_post_id?: string;
}


export interface BindUnitsRequest {
  unit_ids: string[];
}

export interface GuardPost {
  id: string;
  project_id: string;
  post_name: string;
  phone_1?: string;
  phone_2?: string | null;
  status: string;
  created_at?: string;
  updated_at?: string;
  zone_count?: number;
  zones?: Zone[];
}

export interface CreateGuardPostRequest {
  project_id: string;
  post_name: string;
  phone_1?: string;
  phone_2?: string | null;
  status?: string;
}

export interface UpdateGuardPostRequest {
  post_name?: string;
  phone_1?: string;
  phone_2?: string | null;
  status?: string;
}

export interface BindZonesToGuardPostRequest {
  zone_ids: string[];
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
  expires_at?: string; // วันหมดอายุ (optional)
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
  expires_at?: string; // วันหมดอายุ (optional) - format: ISO 8601
}

type IssueType = 'personal' | 'common';

export interface Unit {
  id: string;
  project_id: string;
  unit_number: string;
  zone: string;
  zone_id?: string | null;
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
  unit_number?: string;
  project_id?: string;
  invited_by: string;
  invited_by_name?: string;
  code: string;
  qr_code_url?: string | null;
  status: string;
  role: string;
  invited_email?: string;
  invited_phone?: string;
  expires_at: Date | string;
  created_at: Date | string;
  updated_at?: Date | string;
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

export interface ProjectInvitationItem {
  id: string;
  project_id: string;
  sender_id: string;
  invitation_code: string;
  role: string;
  status: string;
  expires_at: Date | null;
  created_at: Date | null;
  project_name: string;
  sender_name: string;
  sender_email: string;
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

// ==================== Vehicle Management Interfaces ====================
export interface Vehicle {
  id: string;
  project_id: string;
  unit_id: string;
  plate_number: string;
  province: string | null;
  brand: string | null;
  color: string | null;
  is_active: boolean;
  created_at: string;
  unit_number: string;
  zone_id: string | null;
  zone_name: string | null;
}

export interface VehicleSearchResult {
  id: string;
  unit_id: string;
  plate_number: string;
  province: string | null;
  brand: string | null;
  color: string | null;
  is_active: boolean;
  unit_number: string;
  zone_name: string | null;
}

export interface VehiclePagination {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface GetAllVehiclesResponse {
  status: 'success' | 'error';
  message: string;
  data: Vehicle[];
  pagination: VehiclePagination;
}

export interface GetUnitVehiclesResponse {
  status: 'success' | 'error';
  message: string;
  data: Vehicle[];
  unit: {
    id: string;
    unit_number: string;
  };
  count: number;
}

export interface GetVehicleByIdResponse {
  status: 'success' | 'error';
  message: string;
  data: Vehicle;
}

export interface AddVehicleRequest {
  project_id: string;
  unit_id: string;
  plate_number: string;
  province?: string;
  brand?: string;
  color?: string;
  is_active?: boolean;
}

export interface AddVehicleResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    vehicle_id: string;
    plate_number: string;
  };
}

export interface UpdateVehicleRequest {
  project_id: string;
  plate_number?: string;
  province?: string;
  brand?: string;
  color?: string;
  is_active?: boolean;
}

export interface SearchVehiclesResponse {
  status: 'success' | 'error';
  message: string;
  data: VehicleSearchResult[];
  count: number;
}

export interface ZoneVehicleCount {
  zone_id: string;
  zone_name: string;
  vehicle_count: number;
}

export interface VehicleStats {
  total_vehicles: number;
  active_vehicles: number;
  inactive_vehicles: number;
  units_with_vehicles: number;
  total_units: number;
  units_without_vehicles: number;
  vehicles_by_zone: ZoneVehicleCount[];
  recent_vehicles_7_days: number;
}

export interface VehicleStatsResponse {
  status: 'success' | 'error';
  message: string;
  data: VehicleStats;
}

export interface BulkUpdateVehicleRequest {
  project_id: string;
  vehicle_ids: string[];
  is_active: boolean;
}

export interface BulkUpdateVehicleResponse {
  status: 'success' | 'error';
  message: string;
  data: {
    updated_count: number;
  };
}

export interface GetVehiclesParams {
  project_id: string;
  page?: number;
  limit?: number;
  search?: string;
  unit_id?: string;
  zone_id?: string;
  is_active?: boolean;
  sort_by?: 'plate_number' | 'created_at' | 'unit_number' | 'brand' | 'color' | 'is_active';
  sort_order?: 'asc' | 'desc';
}

// ==================== Unit Detail Interfaces ====================
export interface UnitDetailInfo {
  id: string;
  unit_number: string;
  zone: string;
  status: string;
  area_sqm: number;
  building: string;
  floor: number | null;
  project_name: string;
}

export interface UnitResident {
  full_name: string;
  email: string;
  phone: string;
  role: string;
  joined_at: string;
}

export interface UnitHouseModel {
  id: string;
  model_name: string;
  plan_file_url: string | null;
  detail_file_url: string | null;
}

export interface UnitInvitationHistory {
  id: string;
  code: string;
  status: string;
  role: string;
  invited_email: string | null;
  invited_phone: string | null;
  created_at: string;
  expires_at: string;
  invited_by_name: string;
}

export interface UnitDetailData {
  unit_info: UnitDetailInfo;
  residents: UnitResident[];
  house_model: UnitHouseModel | null;
  invitation_history: UnitInvitationHistory[];
}

export interface UnitDetailResponse {
  status: 'success' | 'error';
  message?: string;
  data: UnitDetailData;
}

// ==========================================
// Super Admin Interfaces
// ==========================================

export interface SuperAdminDashboardStats {
  projects: number;
  units: number;
  users: {
    resident: number;
    security: number;
    juristic: number;
    "super-admin": number;
  };
  timestamp: string;
}

export interface ActivityLog {
  id: number;
  admin_user_id: string;
  admin_name: string;
  admin_email: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT' | 'OTHER';
  target_type: string;
  target_id: string | null;
  details: any | null;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface SystemConfig {
  maintenance_mode: {
    value: boolean;
    description: string;
    updated_at: string;
  };
  default_theme_color: {
    value: string;
    description: string;
    updated_at: string;
  };
  rate_limit_requests: {
    value: number;
    description: string;
    updated_at: string;
  };
}

export interface GlobalAnnouncement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'maintenance' | 'update' | 'emergency';
  target_projects: number[] | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
}

export interface FeatureFlag {
  feature_name: string;
  is_enabled: boolean;
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

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

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

    // Get project_id from AuthService
    const memberships = this.authService.getProjectMemberships();
    let projectId: string | null = null;

    if (memberships && memberships.length > 0) {
      projectId = memberships[0].project_id;
      console.log('RestService: Using project_id from AuthService:', projectId);
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

    // Get project_id from AuthService
    const memberships = this.authService.getProjectMemberships();
    if (memberships && memberships.length > 0) {
      const projectId = memberships[0].project_id;
      formData.append('project_id', projectId);
      console.log('RestService: Added project_id to FormData:', projectId);
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
      }),
    };
  }

  private getHttpOptionsForFormData() {
    return {
      headers: new HttpHeaders({
        // 'Content-Type': 'multipart/form-data' is usually handled automatically by HttpClient when body is FormData
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

    // Get project_id from AuthService
    const memberships = this.authService.getProjectMemberships();
    const projectId = (memberships && memberships.length > 0) ? memberships[0].project_id : null;

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
   * Remove a juristic member from a project
   * DELETE /api/juristic/members/:member_id?project_id=:project_id
   */
  removeJuristicMember(memberId: string, projectId: string): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/members/${memberId}`;
    const params = new HttpParams().set('project_id', projectId);

    return this.http.delete(url, { ...this.getHttpOptions(), params }).pipe(
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

  /**
   * Get list of project invitations (Juristic/Security) with optional filtering
   * GET /api/project_invitations?project_id=...&status=...
   */
  getProjectInvitations(
    projectId: string,
    status?: string
  ): Observable<ProjectInvitationItem[]> {
    this.isLoadingSubject.next(true);
    let params = new HttpParams();

    params = params.append('project_id', projectId);

    if (status && status !== 'all') {
      params = params.append('status', status);
    }

    const url = `${this.apiUrl}/api/project_invitations`;
    return this.http.get<any>(url, { ...this.getHttpOptions(), params }).pipe(
      map((response) => {
        this.isLoadingSubject.next(false);
        const invitations = response.data || [];
        return invitations.map((item: any) => ({
          ...item,
          expires_at: item.expires_at ? new Date(item.expires_at) : null,
          created_at: item.created_at ? new Date(item.created_at) : null,
        }));
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Get residents/members in a unit
   * GET /api/resident-management/units/:unitId/members
   */
  getUnitResidents(unitId: string): Observable<GenericApiResponse<any[]>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/resident-management/units/${unitId}/members`;

    return this.http.get<GenericApiResponse<any[]>>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Delete a unit
   * DELETE /api/units/:unitId
   * Returns error if unit has residents
   */
  deleteUnit(unitId: string): Observable<GenericApiResponse<any>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/units/${unitId}`;

    return this.http.delete<GenericApiResponse<any>>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Delete multiple units
   * DELETE /api/units/bulk
   */
  deleteUnits(unitIds: string[]): Observable<GenericApiResponse<any>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/units/bulk`;

    return this.http.request<GenericApiResponse<any>>('delete', url, {
      ...this.getHttpOptions(),
      body: { unit_ids: unitIds }
    }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ==================== House Project Management ====================

  /**
   * ดึงข้อมูลแบบบ้านทั้งหมดในโครงการ
   * GET /api/projects/:id/house-models
   */
  getHouseModels(projectId: string): Observable<GenericApiResponse<HouseModel[]>> {
    // curl -X GET http://localhost:3000/api/projects/1/house-models
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
    // curl -X GET "http://localhost:3000/api/projects/info-docs?project_id=1"
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

  // ==================== Guard Post Management ====================

  /**
   * Get all guard posts
   * GET /api/guard-posts?project_id={projectId}
   */
  getGuardPosts(projectId: string): Observable<GenericApiResponse<GuardPost[]>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/guard-posts`;
    const params = new HttpParams().set('project_id', projectId);

    return this.http.get<GenericApiResponse<GuardPost[]>>(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Get guard post by ID
   * GET /api/guard-posts/:id
   */
  getGuardPostById(id: string): Observable<GenericApiResponse<GuardPost>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/guard-posts/${id}`;

    return this.http.get<GenericApiResponse<GuardPost>>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Create new guard post
   * POST /api/guard-posts
   */
  createGuardPost(data: CreateGuardPostRequest): Observable<GenericApiResponse<GuardPost>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/guard-posts`;

    return this.http.post<GenericApiResponse<GuardPost>>(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Update guard post
   * PUT /api/guard-posts/:id
   */
  updateGuardPost(id: string, data: UpdateGuardPostRequest): Observable<GenericApiResponse<any>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/guard-posts/${id}`;

    return this.http.put<GenericApiResponse<any>>(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Delete guard post
   * DELETE /api/guard-posts/:id
   */
  deleteGuardPost(id: string): Observable<GenericApiResponse<any>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/guard-posts/${id}`;

    return this.http.delete<GenericApiResponse<any>>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Bind zones to guard post (Bulk)
   * PUT /api/guard-posts/:id/zones
   */
  bindZonesToGuardPost(id: string, zoneIds: string[]): Observable<GenericApiResponse<any>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/guard-posts/${id}/zones`;
    const body: BindZonesToGuardPostRequest = { zone_ids: zoneIds };

    return this.http.put<GenericApiResponse<any>>(url, body, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Unbind all zones from guard post
   * DELETE /api/guard-posts/:id/zones
   */
  unbindZonesFromGuardPost(id: string): Observable<GenericApiResponse<any>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/guard-posts/${id}/zones`;

    return this.http.delete<GenericApiResponse<any>>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Get zones linked to guard post
   * GET /api/guard-posts/:id/zones
   */
  getGuardPostZones(id: string): Observable<GenericApiResponse<Zone[]>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/guard-posts/${id}/zones`;

    return this.http.get<GenericApiResponse<Zone[]>>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ==================== Unit Detail ====================

  /**
   * Get unit detail by ID
   * GET /api/units/:unitId
   * Returns unit info, residents, house model, and invitation history
   */
  getUnitDetail(unitId: string): Observable<UnitDetailResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/units/${unitId}`;

    return this.http.get<UnitDetailResponse>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Get unit invitation detail by ID
   * GET /api/units/invitations/:id
   */
  getUnitInvitationById(id: string): Observable<GenericApiResponse<UnitInvitation>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/units/invitations/${id}`;

    return this.http.get<GenericApiResponse<UnitInvitation>>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Get project invitation detail by ID
   * GET /api/project_invitations/:id
   */
  getProjectInvitationById(id: string): Observable<GenericApiResponse<ProjectInvitationItem>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/project_invitations/${id}`;

    return this.http.get<GenericApiResponse<ProjectInvitationItem>>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Handle HTTP errors
   */
  // ==========================================
  // Super Admin APIs
  // ==========================================

  // 1. Dashboard Stats
  getSuperAdminDashboard(): Observable<any> {
    const url = `${this.apiUrl}/api/super-admin/dashboard`;
    return this.http.get<any>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  // 2. Activity Logs
  getSuperAdminLogs(params: any): Observable<any> {
    const url = `${this.apiUrl}/api/super-admin/logs`;
    return this.http.get<any>(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  // 3. System Configuration
  getSystemConfig(): Observable<any> {
    const url = `${this.apiUrl}/api/super-admin/config`;
    return this.http.get<any>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  updateSystemConfig(data: any): Observable<any> {
    const url = `${this.apiUrl}/api/super-admin/config`;
    return this.http.put<any>(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  // 4. Global Announcements
  getGlobalAnnouncements(params: any): Observable<any> {
    const url = `${this.apiUrl}/api/super-admin/announcements`;
    return this.http.get<any>(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  createGlobalAnnouncement(data: any): Observable<any> {
    const url = `${this.apiUrl}/api/super-admin/announcements`;
    return this.http.post<any>(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  updateGlobalAnnouncement(id: number, data: any): Observable<any> {
    const url = `${this.apiUrl}/api/super-admin/announcements/${id}`;
    return this.http.put<any>(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  deleteGlobalAnnouncement(id: number): Observable<any> {
    const url = `${this.apiUrl}/api/super-admin/announcements/${id}`;
    return this.http.delete<any>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  // 5. Feature Flags
  getProjectFeatures(projectId: number): Observable<any> {
    const url = `${this.apiUrl}/api/super-admin/features/${projectId}`;
    return this.http.get<any>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  updateFeatureFlag(data: any): Observable<any> {
    const url = `${this.apiUrl}/api/super-admin/features`;
    return this.http.post<any>(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  // 6. Projects & Users Lists
  getSuperAdminProjects(params?: any): Observable<any> {
    const url = `${this.apiUrl}/api/super-admin/projects`;
    return this.http.get<any>(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  getSuperAdminUsers(params?: any): Observable<any> {
    const url = `${this.apiUrl}/api/super-admin/users`;
    return this.http.get<any>(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error))
    );
  }

  createJuristicUser(data: any): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/super-admin/users/create-juristic`;
    return this.http.post<any>(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Get all projects (Super Admin only)
   * GET /api/projects
   * Supports pagination: page, limit
   * Supports search by project name
   */
  getProjects(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/projects`;

    let httpParams = new HttpParams();
    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.status) httpParams = httpParams.set('status', params.status);
    }

    return this.http.get<any>(url, { ...this.getHttpOptions(), params: httpParams }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Create a new project
   */
  createProject(data: { name: string; address?: string }): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/projects`;
    return this.http.post<any>(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Update an existing project
   */
  updateProject(id: string, data: { name?: string; address?: string }): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/projects/${id}`;
    return this.http.put<any>(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Soft delete a project
   */
  deleteProject(id: string): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/projects/${id}`;
    return this.http.delete<any>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Restore a soft-deleted project
   */
  restoreProject(id: string): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/projects/${id}/restore`;
    return this.http.post<any>(url, {}, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Get a single project by ID
   */
  getProjectById(id: string): Observable<any> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/projects/${id}`;
    return this.http.get<any>(url, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  // ==================== Juristic Vehicle Management ====================

  /**
   * Get all vehicles in project with pagination
   * GET /api/juristic/vehicles
   */
  getVehicles(params: GetVehiclesParams): Observable<GetAllVehiclesResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/vehicles`;

    let httpParams = new HttpParams().set('project_id', params.project_id);

    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.unit_id) httpParams = httpParams.set('unit_id', params.unit_id);
    if (params.zone_id) httpParams = httpParams.set('zone_id', params.zone_id);
    if (params.is_active !== undefined) httpParams = httpParams.set('is_active', params.is_active.toString());
    if (params.sort_by) httpParams = httpParams.set('sort_by', params.sort_by);
    if (params.sort_order) httpParams = httpParams.set('sort_order', params.sort_order);

    return this.http.get<GetAllVehiclesResponse>(url, { ...this.getHttpOptions(), params: httpParams }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Get vehicles by unit ID
   * GET /api/juristic/vehicles/unit/:unitId
   */
  getVehiclesByUnit(unitId: string, projectId: string): Observable<GetUnitVehiclesResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/vehicles/unit/${unitId}`;
    const params = new HttpParams().set('project_id', projectId);

    return this.http.get<GetUnitVehiclesResponse>(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Get vehicle by ID
   * GET /api/juristic/vehicles/:vehicleId
   */
  getVehicleById(vehicleId: string, projectId: string): Observable<GetVehicleByIdResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/vehicles/${vehicleId}`;
    const params = new HttpParams().set('project_id', projectId);

    return this.http.get<GetVehicleByIdResponse>(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Add new vehicle
   * POST /api/juristic/vehicles
   */
  addVehicle(data: AddVehicleRequest): Observable<AddVehicleResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/vehicles`;

    return this.http.post<AddVehicleResponse>(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Update vehicle by ID
   * PUT /api/juristic/vehicles/:vehicleId
   */
  updateVehicle(vehicleId: string, data: UpdateVehicleRequest): Observable<GenericApiResponse<any>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/vehicles/${vehicleId}`;

    return this.http.put<GenericApiResponse<any>>(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Delete vehicle by ID
   * DELETE /api/juristic/vehicles/:vehicleId
   */
  deleteVehicle(vehicleId: string, projectId: string): Observable<GenericApiResponse<any>> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/vehicles/${vehicleId}`;
    const params = new HttpParams().set('project_id', projectId);

    return this.http.delete<GenericApiResponse<any>>(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Quick search vehicles
   * GET /api/juristic/vehicles/search
   */
  searchVehicles(projectId: string, query: string, limit: number = 10): Observable<SearchVehiclesResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/vehicles/search`;
    let params = new HttpParams()
      .set('project_id', projectId)
      .set('q', query)
      .set('limit', limit.toString());

    return this.http.get<SearchVehiclesResponse>(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Get vehicle statistics
   * GET /api/juristic/vehicles/stats
   */
  getVehicleStats(projectId: string): Observable<VehicleStatsResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/vehicles/stats`;
    const params = new HttpParams().set('project_id', projectId);

    return this.http.get<VehicleStatsResponse>(url, { ...this.getHttpOptions(), params }).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
    );
  }

  /**
   * Bulk update vehicles (active/inactive)
   * PATCH /api/juristic/vehicles/bulk-update
   */
  bulkUpdateVehicles(data: BulkUpdateVehicleRequest): Observable<BulkUpdateVehicleResponse> {
    this.isLoadingSubject.next(true);
    const url = `${this.apiUrl}/api/juristic/vehicles/bulk-update`;

    return this.http.patch<BulkUpdateVehicleResponse>(url, data, this.getHttpOptions()).pipe(
      catchError((error) => this.handleError(error)),
      finalize(() => this.isLoadingSubject.next(false))
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

    console.error('RestService Error:', error);
    return throwError(errorMessage);
  }
}
