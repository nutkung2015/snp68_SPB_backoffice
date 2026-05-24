import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, UserProfile, RegisterRequest } from './auth.service';
import { Auth } from '@angular/fire/auth';
import * as fireAuth from '@angular/fire/auth';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let mockAuth: jasmine.SpyObj<Auth>;

  beforeEach(() => {
    // Create a mock for Firebase Auth dependency
    mockAuth = jasmine.createSpyObj('Auth', ['currentUser']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Auth, useValue: mockAuth }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Ensure that no outstanding HTTP requests remain open
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('checkSession', () => {
    it('should successfully retrieve session and normalize user properties', (done) => {
      const mockResponse = {
        data: {
          id: 'user-123',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'JURISTIC',
          project_memberships: ['proj-1', 'proj-2']
        }
      };

      service.checkSession().subscribe((user) => {
        expect(user).toBeTruthy();
        expect(user?.id).toBe('user-123');
        expect(user?.email).toBe('test@example.com');
        // Role should be normalized to lowercase
        expect(user?.role).toBe('juristic');
        // project_memberships should be normalized to camelCase
        expect(user?.projectMemberships).toEqual(['proj-1', 'proj-2']);

        // Check if the current user state is updated in the BehaviorSubject
        expect(service.getCurrentUser()).toEqual(user);
        expect(service.isLoggedIn()).toBeTrue();
        expect(service.getUserRole()).toBe('juristic');
        expect(service.getProjectMemberships()).toEqual(['proj-1', 'proj-2']);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle alternative nested response format correctly', (done) => {
      const mockResponse = {
        data: {
          user: {
            id: 'user-456',
            email: 'admin@example.com',
            full_name: 'Admin User',
            role: 'RESIDENT'
          }
        }
      };

      service.checkSession().subscribe((user) => {
        expect(user).toBeTruthy();
        expect(user?.id).toBe('user-456');
        expect(user?.role).toBe('resident');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/profile`);
      req.flush(mockResponse);
    });

    it('should fallback to null state if API returns an error', (done) => {
      service.checkSession().subscribe((user) => {
        expect(user).toBeNull();
        expect(service.isLoggedIn()).toBeFalse();
        expect(service.getCurrentUser()).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/profile`);
      req.error(new ErrorEvent('Network error'), { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('login', () => {
    it('should update user status upon successful login', (done) => {
      const mockCredentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        data: {
          id: 'user-123',
          email: 'test@example.com',
          full_name: 'John Doe',
          role: 'JURISTIC',
          project_memberships: ['proj-1']
        }
      };

      service.login(mockCredentials).subscribe((response: any) => {
        expect(response).toBeTruthy();
        const currentUser = service.getCurrentUser();
        expect(currentUser).toBeTruthy();
        expect(currentUser?.id).toBe('user-123');
        expect(currentUser?.role).toBe('juristic');
        expect(currentUser?.projectMemberships).toEqual(['proj-1']);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCredentials);
      req.flush(mockResponse);
    });
  });

  describe('logout', () => {
    it('should reset user state and clear local storage upon logout', (done) => {
      // Set initial mock user state
      const mockUser: UserProfile = { id: 'user-123', email: 'test@example.com', full_name: 'John Doe', role: 'resident' };
      (service as any).currentUserSubject.next(mockUser);
      localStorage.setItem('some-key', 'some-value');

      service.logout().subscribe(() => {
        expect(service.getCurrentUser()).toBeNull();
        expect(service.isLoggedIn()).toBeFalse();
        expect(localStorage.getItem('some-key')).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/logout`);
      expect(req.request.method).toBe('POST');
      req.flush({ status: 'success' });
    });

    it('should still clear local state even if the logout API fails', (done) => {
      const mockUser: UserProfile = { id: 'user-123', email: 'test@example.com', full_name: 'John Doe', role: 'resident' };
      (service as any).currentUserSubject.next(mockUser);
      localStorage.setItem('some-key', 'some-value');

      service.logout().subscribe(() => {
        expect(service.getCurrentUser()).toBeNull();
        expect(service.isLoggedIn()).toBeFalse();
        expect(localStorage.getItem('some-key')).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/logout`);
      req.error(new ErrorEvent('Server error'), { status: 500 });
    });
  });

  describe('refreshToken', () => {
    it('should fetch new session details and update current user status', (done) => {
      const mockResponse = {
        data: {
          id: 'user-123',
          email: 'test@example.com',
          full_name: 'John Doe Updated',
          role: 'resident'
        }
      };

      service.refreshToken().subscribe((response: any) => {
        expect(response).toBeTruthy();
        expect(service.getCurrentUser()?.full_name).toBe('John Doe Updated');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/refresh`);
      expect(req.request.method).toBe('POST');
      expect(req.request.withCredentials).toBeTrue();
      req.flush(mockResponse);
    });
  });

  describe('hasProjectMembership', () => {
    it('should return true for residents regardless of memberships', () => {
      const mockUser: UserProfile = { id: 'user-123', email: 'test@example.com', full_name: 'John Doe', role: 'resident' };
      (service as any).currentUserSubject.next(mockUser);

      expect(service.hasProjectMembership()).toBeTrue();
    });

    it('should return true for juristic who has project memberships', () => {
      const mockUser: UserProfile = { 
        id: 'user-123', 
        email: 'test@example.com', 
        full_name: 'John Doe', 
        role: 'juristic',
        projectMemberships: ['project-1']
      };
      (service as any).currentUserSubject.next(mockUser);

      expect(service.hasProjectMembership()).toBeTrue();
    });

    it('should return false for juristic who has no project memberships', () => {
      const mockUser: UserProfile = { 
        id: 'user-123', 
        email: 'test@example.com', 
        full_name: 'John Doe', 
        role: 'juristic',
        projectMemberships: []
      };
      (service as any).currentUserSubject.next(mockUser);

      expect(service.hasProjectMembership()).toBeFalse();
    });
  });

  describe('Phone Authentication & OTP', () => {
    it('should trigger signInWithPhoneNumber on sendOTP call', async () => {
      const phone = '+66812345678';
      const mockAppVerifier = {} as any;
      const mockConfirmationResult = { confirm: jasmine.createSpy('confirm') };

      // Spy on the signInWithPhoneNumber function imported as namespace
      const signInSpy = spyOn(fireAuth, 'signInWithPhoneNumber').and.returnValue(
        Promise.resolve(mockConfirmationResult as any)
      );

      const result = await service.sendOTP(phone, mockAppVerifier);

      expect(signInSpy).toHaveBeenCalledWith(mockAuth, phone, mockAppVerifier);
      expect(result).toBe(mockConfirmationResult);
    });

    it('should trigger confirm method on verifyOTP call', async () => {
      const code = '123456';
      const mockConfirmationResult = {
        confirm: jasmine.createSpy('confirm').and.returnValue(Promise.resolve({ user: 'mock-user' }))
      };

      const result = await service.verifyOTP(mockConfirmationResult, code);

      expect(mockConfirmationResult.confirm).toHaveBeenCalledWith(code);
      expect(result).toEqual({ user: 'mock-user' });
    });
  });
});
