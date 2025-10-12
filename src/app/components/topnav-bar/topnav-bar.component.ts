import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-topnav-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topnav-bar.component.html',
  styleUrls: ['./topnav-bar.component.scss'],
})
export class TopnavBarComponent implements OnInit {
  @Input() sidebarCollapsed = false;
  showNotifications = false;
  showProfileMenu = false; // New property for profile dropdown
  notifications = [
    { id: 1, message: 'New order received', time: '2 min ago', unread: true },
    {
      id: 2,
      message: 'User registration completed',
      time: '5 min ago',
      unread: true,
    },
    {
      id: 3,
      message: 'System backup completed',
      time: '1 hour ago',
      unread: false,
    },
  ];

  unreadCount = this.notifications.filter((n) => n.unread).length;
  userName: string | null = null;
  userRole: string | null = null;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const decodedToken = this.authService.getDecodedToken();
    if (decodedToken) {
      this.userName = decodedToken.full_name || 'User'; // Assuming 'fullname' field in token
      this.userRole = decodedToken.role || 'Guest'; // Assuming 'role' field in token
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(): void {
    this.authService.removeToken(); // Assuming AuthService has a removeToken method
    this.router.navigate(['/login']);
  }

  // Method to toggle notifications dropdown
  toggleNotificationsDropdown(): void {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(notificationId: number): void {
    const notification = this.notifications.find(
      (n) => n.id === notificationId
    );
    if (notification && notification.unread) {
      notification.unread = false;
      this.unreadCount--;
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach((n) => (n.unread = false));
    this.unreadCount = 0;
  }

  onCreateNew(): void {
    // Implement create new announcement
    console.log('Creating new announcement');
  }
}
