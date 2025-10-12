import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
// import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { SidebarNoProjectComponent } from '../sidebar-no-project/sidebar-no-project.component';
import { TopnavBarComponent } from '../../components/topnav-bar/topnav-bar.component';

// shared component
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';

@Component({
  selector: 'app-no-project-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    SidebarNoProjectComponent,
    TopnavBarComponent,
    // PageHeaderComponent,
  ],
  templateUrl: './no-project-layout.component.html',
  styleUrl: './no-project-layout.component.scss',
})
export class NoProjectLayoutComponent {
  sidebarCollapsed = false;

  constructor() {}

  ngOnInit(): void {}

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }
}
