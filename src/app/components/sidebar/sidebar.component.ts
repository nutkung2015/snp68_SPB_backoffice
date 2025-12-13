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
      icon: 'assets/icons/visitor.svg',
      route: '/visitors',
      active: false
    },
    {
      title: 'ขอความช่วยเหลือ',
      icon: 'assets/icons/help.svg',
      route: '/help-request',
      active: false
    },
    {
      title: 'จัดการรปภ.',
      icon: 'assets/icons/security.svg',
      route: '/security',
      active: false
    },
    {
      title: 'จัดการเบอร์',
      icon: 'assets/icons/phone.svg',
      route: '/phone-management',
      active: false
    },
    {
      title: 'จัดการลูกบ้าน',
      icon: 'assets/icons/residents.svg',
      route: '/residents-management',
      active: false
    },
    {
      title: 'จัดการคำเชิญ',
      icon: 'assets/icons/invite.svg',
      route: '/invite-management',
      active: false
    },
    {
      title: 'ธีม',
      icon: 'assets/icons/theme.svg',
      route: '/custom-theme-app',
      active: false
    },
    {
      title: 'ข้อมูลแบบบ้าน',
      icon: 'assets/icons/village.svg', // Using village icon temporarily or you can change to a new one
      route: '/information-home-project',
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
    const projectMemberships = this.authService.getProjectMemberships();
    if (projectMemberships && projectMemberships.length > 0) {
      const firstProject = projectMemberships[0];
      this.projectName = firstProject.project_name || 'ผู้ดูแลระบบนิติบุคคล';
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
    if (currentUrl === '/' || currentUrl.startsWith('/announcement')) {
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