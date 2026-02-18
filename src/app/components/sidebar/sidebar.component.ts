import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() sidebarToggle = new EventEmitter<boolean>();

  projectName: string = 'ผู้ดูแลระบบนิติบุคคล';

  menuItems = [
    {
      title: 'ภาพรวม',
      icon: 'assets/icons/pajamas--overview.svg',
      route: '/dashboard',
      active: false
    },
    {
      title: 'ประกาศ',
      icon: 'assets/icons/announcement.svg',
      route: '/announcement',
      active: false
    },
    {
      title: 'ปัญหาส่วนบุคคล',
      icon: 'assets/icons/problem.svg',
      route: '/issue',
      active: false
    },
    {
      title: 'ปัญหาส่วนกลาง',
      icon: 'assets/icons/common-problem.svg',
      route: '/issue-common',
      active: false
    },
    {
      title: 'หมู่บ้านและบ้าน',
      icon: 'assets/icons/village.svg',
      route: '/village',
      active: false
    },
    {
      title: 'ผู้มาเยี่ยม',
      icon: 'assets/icons/bxs--car-garage.svg',
      route: '/vistor-management',
      active: false
    },
    {
      title: 'จัดการยานพาหนะ',
      icon: 'assets/icons/material-symbols--car-gear-rounded.svg',
      route: '/vehicle-management',
      active: false
    },
    {
      title: 'จัดการเบอร์โทรป้อมยาม',
      icon: 'assets/icons/mdi--security-home.svg',
      route: '/house-guard',
      active: false
    },
    // {
    //   title: 'จัดการรปภ.',
    //   icon: 'assets/icons/security.svg',
    //   route: '/security',
    //   active: false
    // },
    // {
    //   title: 'จัดการเบอร์',
    //   icon: 'assets/icons/phone.svg',
    //   route: '/phone-management',
    //   active: false
    // },
    {
      title: 'จัดการลูกบ้าน',
      icon: 'assets/icons/residents.svg',
      route: '/residents-management',
      active: false
    },
    // {
    //   title: 'จัดการบ้าน/ยูนิต',
    //   icon: 'assets/icons/village.svg',
    //   route: '/unit-management',
    //   active: false
    // },
    {
      title: 'จัดการคำเชิญ',
      icon: 'assets/icons/invite.svg',
      route: '/invite-management',
      active: false
    },
    {
      title: 'ธีม',
      icon: 'assets/icons/mdi--theme.svg',
      route: '/custom-theme-app',
      active: false
    },
    {
      title: 'ข้อมูลแบบบ้าน',
      icon: 'assets/icons/hugeicons--floor-plan.svg', // Using village icon temporarily or you can change to a new one
      route: '/information-home-project',
      active: false
    },
    {
      title: 'จัดการสิทธิ์นิติ',
      icon: 'assets/icons/icon-park-solid--permissions.svg',
      route: '/edit-permission',
      active: false
    }
  ];

  superAdminMenuItems = [
    {
      title: 'ภาพรวม',
      icon: 'assets/icons/pajamas--overview.svg',
      route: '/super-admin/dashboard',
      active: false
    },
    {
      title: 'โครงการ',
      icon: 'assets/icons/village.svg',
      route: '/super-admin/projects',
      active: false
    },
    {
      title: 'ผู้ใช้งาน',
      icon: 'assets/icons/residents.svg',
      route: '/super-admin/users',
      active: false
    },
    {
      title: 'ประกาศ',
      icon: 'assets/icons/announcement.svg',
      route: '/super-admin/announcements',
      active: false
    },
    // {
    //   title: 'ตั้งค่าระบบ',
    //   icon: 'assets/icons/theme.svg',
    //   route: '/super-admin/config',
    //   active: false
    // },
    {
      title: 'ประวัติการใช้งาน',
      icon: 'assets/icons/common-problem.svg',
      route: '/super-admin/logs',
      active: false
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadProjectName();
    this.updateActiveMenuItem();
    // Listen to route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updateActiveMenuItem();
      });
  }

  loadProjectName(): void {
    const role = this.authService.getUserRole();
    if (role === 'super-admin') {
      this.projectName = 'Super Admin Console';
      this.menuItems = this.superAdminMenuItems;
    } else {
      const projectMemberships = this.authService.getProjectMemberships();
      if (projectMemberships && projectMemberships.length > 0) {
        const firstProject = projectMemberships[0];
        this.projectName = firstProject.project_name || 'ผู้ดูแลระบบนิติบุคคล';
      }
    }
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit(this.isCollapsed);
  }

  setActiveItem(item: any): void {
    this.menuItems.forEach(menuItem => menuItem.active = false);
    item.active = true;
  }

  private updateActiveMenuItem(): void {
    const currentUrl = this.router.url;

    // Handle special cases
    if (currentUrl === '/' || currentUrl.startsWith('/dashboard')) {
      this.setActiveByRoute('/dashboard');
    } else if (currentUrl.startsWith('/announcement')) {
      this.setActiveByRoute('/announcement');
    } else if (currentUrl.startsWith('/invite-management')) {
      this.setActiveByRoute('/invite-management');
    } else if (currentUrl.startsWith('/residents')) {
      this.setActiveByRoute('/residents');
    } else {
      // Try to match exact route
      this.setActiveByRoute(currentUrl);
    }
  }

  private setActiveByRoute(route: string): void {
    this.menuItems.forEach(menuItem => {
      menuItem.active = menuItem.route === route;
    });
  }
}