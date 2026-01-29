import { Routes } from '@angular/router';
import { AuthenLayoutComponent } from './layouts/authen-layout/authen-layout.component';
import { AnonymousLayoutComponent } from './layouts/anonymous-layout/anonymous-layout.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterJuristicComponent } from './components/register-juristic/register-juristic.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AuthGuard } from './services/auth.guard';
import { AnnouncementComponent } from './components/announcement/announcement.component';
import { NoProjectLayoutComponent } from './components/no-project-layout/no-project-layout.component';
import { JoinUnitComponent } from './components/join-unit/join-unit.component';
import { InternalSeverComponent } from './components/internal-sever/internal-sever.component';
// import {  } from './components/issue/issue.component';

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
      {
        path: 'internal-sever',
        component: InternalSeverComponent,
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
        path: 'issue/detail/:id',
        loadComponent: () =>
          import(
            './components/issue/detail-issue-personal/detail-issue-personal.component'
          ).then((m) => m.DetailIssuePersonalComponent),
      },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full',
      },
      {
        path: 'register',
        component: RegisterJuristicComponent,
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
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
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
        path: 'invite-management',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/invite-management/invite-management.component').then(
                (m) => m.InviteManagementComponent
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import(
                './components/invite-management/create-invite/create-invite.component'
              ).then((m) => m.CreateInviteComponent),
          },
          {
            path: 'create-unit',
            loadComponent: () =>
              import('./components/invite-management/create-unit/create-unit.component').then(
                (m) => m.CreateUnitComponent
              ),
          },
          {
            path: 'detail/:id',
            loadComponent: () =>
              import(
                './components/invite-management/invite-detail/invite-detail.component'
              ).then((m) => m.InviteDetailComponent),
          },
        ],
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
      {
        path: 'issue',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/issue/issue.component').then(
                (m) => m.IssueComponent
              ),
          },
          // {
          //   path: 'create',
          //   loadComponent: () =>
          //     import(
          //       './components/issue/create-issue-personal/create-issue-personal.component'
          //     ).then((m) => m.CreateIssuePersonalComponent),
          // },
          {
            path: 'detail/:id',
            loadComponent: () =>
              import(
                './components/issue/detail-issue-personal/detail-issue-personal.component'
              ).then((m) => m.DetailIssuePersonalComponent),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import(
                './components/issue/edit-issue-personal/edit-issue-personal.component'
              ).then((m) => m.EditIssuePersonalComponent),
          },
        ],
      },
      {
        path: 'issue-common',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/issue-common/issue-common.component').then(
                (m) => m.IssueCommonComponent
              ),
          },
          // {
          //   path: 'create',
          //   loadComponent: () =>
          //     import(
          //       './components/issue-common/create-issue-common/create-issue-common.component'
          //     ).then((m) => m.CreateIssueCommonComponent),
          // },
          {
            path: 'detail/:id',
            loadComponent: () =>
              import(
                './components/issue-common/issue-common-detail/issue-common-detail.component'
              ).then((m) => m.IssueCommonDetailComponent),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import(
                './components/issue-common/issue-common-edit/issue-common-edit.component'
              ).then((m) => m.IssueCommonEditComponent),
          },
        ],
      },
      {
        path: 'custom-theme-app',
        loadComponent: () =>
          import('./components/custom-theme-app/custom-theme-app.component').then(
            (m) => m.CustomThemeAppComponent
          ),
      },
      {
        path: 'residents-management',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/residents-management/residents-management.component').then(
                (m) => m.ResidentsManagementComponent
              ),
          },
        ],
      },
      {
        path: 'unit-management',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/unit-management/unit-management.component').then(
                (m) => m.UnitManagementComponent
              ),
          },
        ],
      },
      {
        path: 'information-home-project',
        loadComponent: () =>
          import('./components/infomation-home-project-management/infomation-home-project-management.component').then(
            (m) => m.InfomationHomeProjectManagementComponent
          ),
      },
      {
        path: 'vistor-management',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/vistor-management/vistor-management.component').then(
                (m) => m.VistorManagementComponent
              ),
          },
          {
            path: 'detail/:id',
            loadComponent: () =>
              import('./components/vistor-management/vistor-management-detail/vistor-management-detail.component').then(
                (m) => m.VistorManagementDetailComponent
              ),
          },
        ],
      },
      {
        path: 'edit-permission',
        loadComponent: () =>
          import('./components/edit-permission/edit-permission.component').then(
            (m) => m.EditPermissionComponent
          ),
      },
      {
        path: 'village',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/vilage-unit-management/vilage-unit-management.component').then(
                (m) => m.VilageUnitManagementComponent
              ),
          },
          {
            path: 'unit/:id',
            loadComponent: () =>
              import('./components/vilage-unit-management/unit-detail/unit-detail.component').then(
                (m) => m.UnitDetailComponent
              ),
          },
        ],
      },
      {
        path: 'house-guard',
        loadComponent: () =>
          import('./components/house-guard/house-guard.component').then(
            (m) => m.HouseGuardComponent
          ),
      },
      {
        path: 'vehicle-management',
        loadComponent: () =>
          import('./components/vehicle-management/vehicle-management.component').then(
            (m) => m.VehicleManagementComponent
          ),
      },
    ],
  },

  {
    path: 'super-admin',
    component: AuthenLayoutComponent,
    canActivate: [AuthGuard],
    data: { roles: ['super-admin'] },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./components/super-admin/dashboard/super-admin-dashboard.component').then(
            (m) => m.SuperAdminDashboardComponent
          ),
      },
      {
        path: 'projects',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/super-admin/projects/projects.component').then(
                (m) => m.ProjectsComponent
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./components/super-admin/projects/create-project-super-admin/create-project-super-admin.component').then(
                (m) => m.CreateProjectSuperAdminComponent
              ),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./components/super-admin/projects/edit-project-super-admin/edit-project-super-admin.component').then(
                (m) => m.EditProjectSuperAdminComponent
              ),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./components/super-admin/projects/view-project-super-admin/view-project-super-admin.component').then(
                (m) => m.ViewProjectSuperAdminComponent
              ),
          },
        ],
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./components/super-admin/users-super-admin/users-super-admin.component').then(
            (m) => m.SuperAdminUsersComponent
          ),
      },
      {
        path: 'announcements',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./components/super-admin/announcements/global-announcements.component').then(
                (m) => m.GlobalAnnouncementComponent
              ),
          },
          {
            path: 'create',
            loadComponent: () =>
              import('./components/super-admin/announcements/create-announcements-global/create-announcements-global.component').then(
                (m) => m.CreateAnnouncementsGlobalComponent
              ),
          },
        ],
      },
      // {
      //   path: 'config',
      //   loadComponent: () =>
      //     import('./components/super-admin/config/system-config.component').then(
      //       (m) => m.SystemConfigComponent
      //     ),
      // },
      {
        path: 'logs',
        loadComponent: () =>
          import('./components/super-admin/logs/activity-logs.component').then(
            (m) => m.ActivityLogsComponent
          ),
      },
    ]
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
