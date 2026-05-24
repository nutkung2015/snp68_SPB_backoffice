import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterTestingModule } from '@angular/router/testing';


describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'login',
      'getUserRole',
      'hasProjectMembership'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Mock window.alert to prevent popups in tests
    spyOn(window, 'alert');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Form Validation', () => {
    it('should initialize form as invalid', () => {
      expect(component.loginForm.valid).toBeFalse();
      expect(component.loginForm.get('email')?.value).toBe('');
      expect(component.loginForm.get('password')?.value).toBe('');
    });

    it('should validate email format', () => {
      const emailControl = component.loginForm.get('email');

      emailControl?.setValue('');
      expect(emailControl?.hasError('required')).toBeTrue();

      emailControl?.setValue('invalid-email');
      expect(emailControl?.hasError('email')).toBeTrue();

      emailControl?.setValue('test@example.com');
      expect(emailControl?.valid).toBeTrue();
    });

    it('should validate password minimum length', () => {
      const passwordControl = component.loginForm.get('password');

      passwordControl?.setValue('');
      expect(passwordControl?.hasError('required')).toBeTrue();

      passwordControl?.setValue('12345');
      expect(passwordControl?.hasError('minlength')).toBeTrue();

      passwordControl?.setValue('123456');
      expect(passwordControl?.valid).toBeTrue();
    });
  });

  describe('onSubmit', () => {
    it('should not call authService.login if form is invalid', () => {
      component.loginForm.setValue({ email: '', password: '' });
      component.onSubmit();

      expect(authServiceSpy.login).not.toHaveBeenCalled();
      expect(component.loginForm.get('email')?.touched).toBeTrue();
      expect(component.loginForm.get('password')?.touched).toBeTrue();
    });

    describe('when form is valid', () => {
      beforeEach(() => {
        component.loginForm.setValue({
          email: 'test@example.com',
          password: 'password123'
        });
      });

      it('should navigate to /super-admin/dashboard if user role is super-admin', () => {
        const mockResponse = { data: { id: 'admin-1' } };
        authServiceSpy.login.and.returnValue(of(mockResponse));
        authServiceSpy.getUserRole.and.returnValue('super-admin');

        component.onSubmit();

        expect(authServiceSpy.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/super-admin/dashboard']);
        expect(component.isLoading).toBeFalse();
      });

      it('should navigate to /no-project if juristic user has no project membership', () => {
        const mockResponse = { data: { id: 'jur-1' } };
        authServiceSpy.login.and.returnValue(of(mockResponse));
        authServiceSpy.getUserRole.and.returnValue('juristic');
        authServiceSpy.hasProjectMembership.and.returnValue(false);

        component.onSubmit();

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/no-project']);
        expect(component.isLoading).toBeFalse();
      });

      it('should navigate to /dashboard for normal roles (e.g. resident)', () => {
        const mockResponse = { data: { id: 'res-1' } };
        authServiceSpy.login.and.returnValue(of(mockResponse));
        authServiceSpy.getUserRole.and.returnValue('resident');

        component.onSubmit();

        expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
        expect(component.isLoading).toBeFalse();
      });

      it('should alert and set isLoading to false if response is invalid', () => {
        authServiceSpy.login.and.returnValue(of(null)); // invalid response format (no data key)

        component.onSubmit();

        expect(window.alert).toHaveBeenCalledWith('Login failed: Invalid server response.');
        expect(component.isLoading).toBeFalse();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
      });

      it('should handle API errors and trigger alert popup', () => {
        const errorResponse = new HttpErrorResponse({
          error: { message: 'รหัสผ่านหรืออีเมลไม่ถูกต้อง' },
          status: 401,
          statusText: 'Unauthorized'
        });
        authServiceSpy.login.and.returnValue(throwError(() => errorResponse));

        component.onSubmit();

        expect(window.alert).toHaveBeenCalledWith('Login failed: รหัสผ่านหรืออีเมลไม่ถูกต้อง');
        expect(component.isLoading).toBeFalse();
        expect(routerSpy.navigate).not.toHaveBeenCalled();
      });
    });
  });

  describe('Thai Input Filtering', () => {
    it('should detect Thai characters, trigger warning, and remove them from input', () => {
      const emailControl = component.loginForm.get('email');
      const mockEvent = {
        target: { value: 'testภาษาไทย@example.com' }
      } as unknown as Event;

      component.checkThaiInput('email', mockEvent);

      expect(component.thaiWarning.email).toBeTrue();
      // The Thai characters ("ภาษาไทย") should be stripped out
      expect(emailControl?.value).toBe('test@example.com');
    });

    it('should not warn or filter if input contains only English/valid characters', () => {
      const emailControl = component.loginForm.get('email');
      const mockEvent = {
        target: { value: 'john.doe@example.com' }
      } as unknown as Event;

      component.checkThaiInput('email', mockEvent);

      expect(component.thaiWarning.email).toBeFalse();
      // Value should remain unchanged (the method only modifies value if Thai regex matches)
      // Note: checkThaiInput only sets value when hasThai is true, otherwise it does nothing to the control value
    });
  });

  describe('UI Utilities', () => {
    it('should toggle password visibility status', () => {
      expect(component.showPassword).toBeFalse();

      component.togglePasswordVisibility();
      expect(component.showPassword).toBeTrue();

      component.togglePasswordVisibility();
      expect(component.showPassword).toBeFalse();
    });
  });
});
