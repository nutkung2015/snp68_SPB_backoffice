import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    // Create mock spies for dependencies
    authServiceSpy = jasmine.createSpyObj('AuthService', [
      'isLoggedIn',
      'getUserRole',
      'hasProjectMembership'
    ]);
    routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    // Mock createUrlTree to return a dummy UrlTree object or itself
    routerSpy.createUrlTree.and.callFake((commands: any[], extras?: any) => {
      return { toString: () => commands.join('/') } as UrlTree;
    });

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);

    // Spy on window.alert to prevent blocking test runner
    spyOn(window, 'alert');
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    let routeSnapshot: ActivatedRouteSnapshot;
    let stateSnapshot: RouterStateSnapshot;

    beforeEach(() => {
      routeSnapshot = {
        data: {}
      } as unknown as ActivatedRouteSnapshot;

      stateSnapshot = {
        url: '/dashboard'
      } as unknown as RouterStateSnapshot;
    });

    it('should deny access and redirect to login if user is not logged in', () => {
      authServiceSpy.isLoggedIn.and.returnValue(false);

      const result = guard.canActivate(routeSnapshot, stateSnapshot);

      expect(authServiceSpy.isLoggedIn).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('You need to log in to access this page.');
      expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/dashboard' }
      });
      // The return value should be the mock UrlTree
      expect(result).toEqual({ toString: () => 'login' } as UrlTree);
    });

    describe('when logged in', () => {
      beforeEach(() => {
        authServiceSpy.isLoggedIn.and.returnValue(true);
      });

      it('should grant access if no roles are required', () => {
        authServiceSpy.getUserRole.and.returnValue('resident');
        routeSnapshot.data = { roles: [] };

        const result = guard.canActivate(routeSnapshot, stateSnapshot);

        expect(result).toBeTrue();
      });

      it('should grant access if user role matches one of the required roles', () => {
        authServiceSpy.getUserRole.and.returnValue('juristic');
        routeSnapshot.data = { roles: ['juristic', 'admin'] };
        authServiceSpy.hasProjectMembership.and.returnValue(true);

        const result = guard.canActivate(routeSnapshot, stateSnapshot);

        expect(result).toBeTrue();
      });

      it('should deny access and alert/redirect to login if role mismatch', () => {
        authServiceSpy.getUserRole.and.returnValue('resident');
        routeSnapshot.data = { roles: ['juristic', 'admin'] };

        const result = guard.canActivate(routeSnapshot, stateSnapshot);

        expect(window.alert).toHaveBeenCalled();
        expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/login']);
        expect(result).toEqual({ toString: () => 'login' } as UrlTree);
      });

      describe('Juristic User Without Project Membership', () => {
        beforeEach(() => {
          authServiceSpy.getUserRole.and.returnValue('juristic');
          authServiceSpy.hasProjectMembership.and.returnValue(false);
        });

        it('should redirect to no-project if attempting to access regular path (e.g. /dashboard)', () => {
          stateSnapshot.url = '/dashboard';

          const result = guard.canActivate(routeSnapshot, stateSnapshot);

          expect(routerSpy.createUrlTree).toHaveBeenCalledWith(['/no-project']);
          expect(result).toEqual({ toString: () => 'no-project' } as UrlTree);
        });

        it('should grant access if attempting to access allowed path (e.g. /no-project/settings)', () => {
          stateSnapshot.url = '/no-project/settings';

          const result = guard.canActivate(routeSnapshot, stateSnapshot);

          expect(result).toBeTrue();
          expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
        });

        it('should grant access if attempting to access register path', () => {
          stateSnapshot.url = '/register-juristic';

          const result = guard.canActivate(routeSnapshot, stateSnapshot);

          expect(result).toBeTrue();
          expect(routerSpy.createUrlTree).not.toHaveBeenCalled();
        });
      });
    });
  });
});
