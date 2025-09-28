import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../../components/sidebar/sidebar.component';
import { TopnavBarComponent } from '../../components/topnav-bar/topnav-bar.component';

@Component({
  selector: 'app-authen-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, TopnavBarComponent],
  templateUrl: './authen-layout.component.html',
  styleUrls: ['./authen-layout.component.scss']
})
export class AuthenLayoutComponent implements OnInit {
  sidebarCollapsed = false;

  constructor() { }

  ngOnInit(): void {
  }

  onSidebarToggle(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }
}
