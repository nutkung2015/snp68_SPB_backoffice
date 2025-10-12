import { Routes } from '@angular/router';
import { AuthenLayoutComponent } from './layouts/authen-layout/authen-layout.component';
import { AnonymousLayoutComponent } from './layouts/anonymous-layout/anonymous-layout.component';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './services/auth.guard';
import { AnnouncementComponent } from './components/announcement/announcement.component';
import { NoProjectLayoutComponent } from './components/no-project-layout/no-project-layout.component';
import { JoinUnitComponent } from './components/join-unit/join-unit.component';

export const routes: Routes = [
  {
    path: '',
    component: AnonymousLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: '/login',
        pathMatch: 'full',
      },
      {
        path: 'login',
        component: LoginComponent,
      },
    ],
  },
  {
    path: '',
    component: AuthenLayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['juristic', 'admin'] },
    children: [
      {
        path: '',
        redirectTo: '/announcement',
        pathMatch: 'full',
      },
      {
        path: 'announcement',
        children: [
          {
            path: '',
            component: AnnouncementComponent,
          },
          {
            path: 'create',
            loadComponent: () =>
              import(
                './components/announcement/create-announcement/create-announcement.component'
              ).then((m) => m.CreateAnnouncementComponent),
          },
          {
            path: 'detail/:id', // แก้ไขโดยลบ 'announcement' ออก
            loadComponent: () =>
              import(
                './components/announcement/detail-announcement/detail-announcement.component'
              ).then((m) => m.DetailAnnouncementComponent),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import(
                './components/announcement/edit-announcement/edit-announcement.component'
              ).then((m) => m.EditAnnouncementComponent),
          },
        ],
      },
      // {
      //   path: 'dashboard',
      //   component: DashboardComponent
      // },
      {
        path: 'users',
        loadComponent: () =>
          import('./components/users/users.component').then(
            (m) => m.UsersComponent
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./components/products/products.component').then(
            (m) => m.ProductsComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./components/orders/orders.component').then(
            (m) => m.OrdersComponent
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./components/reports/reports.component').then(
            (m) => m.ReportsComponent
          ),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./components/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
      },
    ],
  },

  {
    path: 'no-project',
    component: NoProjectLayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['juristic'] },
    children: [
      {
        path: '',
        redirectTo: 'join-unit',
        pathMatch: 'full',
      },
      {
        path: 'join-unit',
        component: JoinUnitComponent,
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
