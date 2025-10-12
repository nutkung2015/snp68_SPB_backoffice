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
  constructor(private authService: AuthService, private router: Router) {}

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
        // If the user is already on a route within the no-project path, allow access
        if (state.url.startsWith('/no-project')) {
          console.log('AuthGuard: Juristic user without project membership accessing no-project path. Access Granted.');
          return true;
        } else {
          // Otherwise, redirect to the no-project page
          console.log('AuthGuard: Juristic user without project membership. Redirecting to no-project page.');
          return this.router.createUrlTree(['/no-project']);
        }
      }

      // Standard role-based access control
      if (requiredRoles && requiredRoles.length && userRole && requiredRoles.includes(userRole)) {
        console.log('AuthGuard: Access Granted');
        return true;
      } else if (!requiredRoles || requiredRoles.length === 0) {
        // If no specific roles are required, just being logged in is enough
        console.log('AuthGuard: Access Granted (No specific roles required)');
        return true;
      } else {
        console.log('AuthGuard: Access Denied - Role Mismatch');
        alert('You do not have the necessary permissions to access this page.');
        return this.router.createUrlTree(['/login']);
      }
    } else {
      // Redirect to the login page
      console.log('AuthGuard: Access Denied - Not Logged In');
      alert('You need to log in to access this page.');
      return this.router.createUrlTree(['/login']);
    }
    // This part should ideally not be reached if all conditions are handled
    console.log('AuthGuard: Access Denied - Fallback');
    alert('Access Denied.');
    return this.router.createUrlTree(['/login']); // Redirect if not authorized
  }
}
