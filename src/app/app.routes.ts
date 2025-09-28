import { Routes } from '@angular/router';
import { AuthenLayoutComponent } from './layouts/authen-layout/authen-layout.component';
import { AnonymousLayoutComponent } from './layouts/anonymous-layout/anonymous-layout.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AnnouncementComponent } from './components/announcement/announcement.component';

export const routes: Routes = [
  {
    path: '',
    component: AnonymousLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full'
      },
      {
        path: 'login',
        component: LoginComponent
      }
    ]
  },
  {
    path: '',
    component: AuthenLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: '/announcement',
        pathMatch: 'full'
      },
      {
        path: 'announcement',
        component: AnnouncementComponent
      },
      // {
      //   path: 'dashboard',
      //   component: DashboardComponent
      // },
      {
        path: 'users',
        loadComponent: () => import('./components/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./components/products/products.component').then(m => m.ProductsComponent)
      },
      {
        path: 'orders',
        loadComponent: () => import('./components/orders/orders.component').then(m => m.OrdersComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./components/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
