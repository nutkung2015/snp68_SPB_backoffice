import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
  UrlTree,
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    if (this.authService.isLoggedIn()) {
      const userRole = this.authService.getUserRole();
      const requiredRoles = route.data['roles'] as Array<string>;

      console.log('AuthGuard: User Role:', userRole);
      console.log('AuthGuard: Required Roles:', requiredRoles);

      // Handle juristic users without project membership
      if (userRole === 'juristic' && !this.authService.hasProjectMembership()) {
        // Allow access to no-project and register paths
        if (state.url.startsWith('/no-project') || state.url.startsWith('/register')) {
          console.log('AuthGuard: Juristic user without project membership accessing allowed path. Access Granted.');
          return true;
        } else {
          console.log('AuthGuard: Juristic user without project membership. Redirecting to no-project page.');
          return this.router.createUrlTree(['/no-project']);
        }
      }

      // Standard role-based access control
      if (requiredRoles && requiredRoles.length && userRole && requiredRoles.includes(userRole)) {
        console.log('AuthGuard: Access Granted');
        return true;
      } else if (!requiredRoles || requiredRoles.length === 0) {
        console.log('AuthGuard: Access Granted (No specific roles required)');
        return true;
      } else {
        console.log('AuthGuard: Access Denied - Role Mismatch');
        alert(`You do not have the necessary permissions to access this page. (Your role: ${userRole || 'None'}, Required: ${requiredRoles?.join(', ')})`);
        return this.router.createUrlTree(['/login']);
      }
    } else {
      console.log('AuthGuard: Access Denied - Not Logged In');
      alert('You need to log in to access this page.');
      // Pass the return URL so we can redirect back after login
      return this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
    }
  }
}
