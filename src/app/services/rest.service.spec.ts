import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { RestService, AnnouncementResponse, Announcement, CreateAnnouncementRequest } from './rest.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

describe('RestService', () => {
  let service: RestService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getProjectMemberships']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        RestService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(RestService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAnnouncements', () => {
    it('should fetch announcements with loading indicator changes', (done) => {
      const mockResponse: AnnouncementResponse = {
        status: 'success',
        data: [
          { id: '1', title: 'Test 1', content: 'Content 1', type: 'info', posted_by: 'user1', attachment_urls: [], audience: 'all', status: 'active' }
        ],
        pagination: { currentPage: 1, totalPages: 1, totalItems: 1, itemsPerPage: 10 }
      };

      // Watch loading state
      let loadingStates: boolean[] = [];
      service.isLoading$.subscribe(state => loadingStates.push(state));

      service.getAnnouncements({ page: 1 }).subscribe(response => {
        expect(response).toEqual(mockResponse);
        // Loading state should go true -> false
        expect(loadingStates).toContain(true);
        expect(loadingStates[loadingStates.length - 1]).toBeFalse();
        done();
      });

      const req = httpMock.expectOne(req => req.url === `${environment.apiUrl}/api/announcements` && req.params.get('page') === '1');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getAnnouncementsByProject', () => {
    it('should fetch announcements filtered by project ID from AuthService', (done) => {
      const mockMemberships = [{ project_id: 'project-999', project_name: 'Main Project', role: 'juristic' }];
      authServiceSpy.getProjectMemberships.and.returnValue(mockMemberships);

      const mockResponse: AnnouncementResponse = {
        status: 'success',
        data: [],
        pagination: { currentPage: 1, totalPages: 0, totalItems: 0, itemsPerPage: 10 }
      };

      service.getAnnouncementsByProject().subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(req => 
        req.url === `${environment.apiUrl}/api/announcements/resident` && 
        req.params.get('project_id') === 'project-999'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('createAnnouncement', () => {
    it('should send a POST request with announcement payload', (done) => {
      const newAnnouncementPayload: CreateAnnouncementRequest = {
        id: 'annc-001',
        title: 'New Title',
        content: 'New Content',
        type: 'warning',
        audience: 'all',
        status: 'active',
        posted_by: 'user-777'
      };

      const mockResponse: Announcement = {
        id: 'annc-001',
        title: 'New Title',
        content: 'New Content',
        type: 'warning',
        posted_by: 'user-777',
        attachment_urls: [],
        audience: 'all',
        status: 'active'
      };

      service.createAnnouncement(newAnnouncementPayload).subscribe(response => {
        expect(response).toEqual(mockResponse);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/announcements`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(newAnnouncementPayload);
      req.flush({ status: 'success', data: mockResponse });
    });
  });

  describe('deleteAnnouncement', () => {
    it('should send a DELETE request', (done) => {
      const id = 'annc-001';

      service.deleteAnnouncement(id).subscribe(response => {
        expect(response.status).toBe('success');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/announcements/${id}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ status: 'success', message: 'Deleted successfully' });
    });
  });

  describe('handleError', () => {
    it('should format client-side errors correctly', (done) => {
      const clientError = new ErrorEvent('Network error', { message: 'Failed to resolve DNS' });

      service.getAnnouncements().subscribe({
        next: () => fail('Should have failed with network error'),
        error: (err) => {
          expect(err).toBe('เกิดข้อผิดพลาด: Failed to resolve DNS');
          done();
        }
      });

      const req = httpMock.expectOne(req => req.url === `${environment.apiUrl}/api/announcements`);
      req.error(clientError);
    });

    it('should map status 0 to connection error', (done) => {
      service.getAnnouncements().subscribe({
        next: () => fail('Should have failed with server connection error'),
        error: (err) => {
          expect(err).toBe('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้');
          done();
        }
      });

      const req = httpMock.expectOne(req => req.url === `${environment.apiUrl}/api/announcements`);
      req.error(new ErrorEvent('Connection Refused'), { status: 0, statusText: '' });
    });

    it('should return server custom error message if present', (done) => {
      const errorResponse = { message: 'เฉพาะ Juristic เท่านั้นที่มีสิทธิ์เข้าถึง' };

      service.getAnnouncements().subscribe({
        next: () => fail('Should have failed with forbidden message'),
        error: (err) => {
          expect(err).toBe('เฉพาะ Juristic เท่านั้นที่มีสิทธิ์เข้าถึง');
          done();
        }
      });

      const req = httpMock.expectOne(req => req.url === `${environment.apiUrl}/api/announcements`);
      req.flush(errorResponse, { status: 403, statusText: 'Forbidden' });
    });

    it('should fallback to status code message if custom server message is missing', (done) => {
      service.getAnnouncements().subscribe({
        next: () => fail('Should have failed with status code fallback'),
        error: (err) => {
          expect(err).toBe('เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (รหัส: 500)');
          done();
        }
      });

      const req = httpMock.expectOne(req => req.url === `${environment.apiUrl}/api/announcements`);
      req.flush(null, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
