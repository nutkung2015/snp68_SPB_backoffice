import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar-no-project',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar-no-project.component.html',
  styleUrl: './sidebar-no-project.component.scss',
})
export class SidebarNoProjectComponent implements OnInit {
  @Input() isCollapsed = false;
  @Output() sidebarToggle = new EventEmitter<boolean>();

  menuItems = [
    {
      title: 'เข้าสู่โครงการ',
      icon: 'assets/icons/announcement.svg',
      route: '/join-unit',
      active: true,
    },
    // {
    //   title: 'ปัญหา',
    //   icon: 'assets/icons/problem.svg',
    //   route: '/problems',
    //   active: false,
    // },
    // {
    //   title: 'หมู่บ้านและบ้าน',
    //   icon: 'assets/icons/village.svg',
    //   route: '/village',
    //   active: false,
    // },
    // {
    //   title: 'ผู้มาเยี่ยม',
    //   icon: 'assets/icons/visitor.svg',
    //   route: '/visitors',
    //   active: false,
    // },
    // {
    //   title: 'ขอความช่วยเหลือ',
    //   icon: 'assets/icons/help.svg',
    //   route: '/help-request',
    //   active: false,
    // },
    // {
    //   title: 'จัดการรปภ.',
    //   icon: 'assets/icons/security.svg',
    //   route: '/security',
    //   active: false,
    // },
    // {
    //   title: 'จัดการเบอร์',
    //   icon: 'assets/icons/phone.svg',
    //   route: '/phone-management',
    //   active: false,
    // },
    // {
    //   title: 'จัดการลูกบ้าน',
    //   icon: 'assets/icons/residents.svg',
    //   route: '/residents',
    //   active: false,
    // },
  ];

  constructor() {}

  ngOnInit(): void {}

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    this.sidebarToggle.emit(this.isCollapsed);
  }

  setActiveItem(item: any): void {
    this.menuItems.forEach((menuItem) => (menuItem.active = false));
    item.active = true;
  }
}
