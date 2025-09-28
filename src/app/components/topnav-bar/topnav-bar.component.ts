import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topnav-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topnav-bar.component.html',
  styleUrls: ['./topnav-bar.component.scss']
})
export class TopnavBarComponent implements OnInit {
  @Input() sidebarCollapsed = false;
  showNotifications = false;
  notifications = [
    { id: 1, message: 'New order received', time: '2 min ago', unread: true },
    { id: 2, message: 'User registration completed', time: '5 min ago', unread: true },
    { id: 3, message: 'System backup completed', time: '1 hour ago', unread: false }
  ];

  unreadCount = this.notifications.filter(n => n.unread).length;

  constructor() { }

  ngOnInit(): void {
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(notificationId: number): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.unread) {
      notification.unread = false;
      this.unreadCount--;
    }
  }

  markAllAsRead(): void {
    this.notifications.forEach(n => n.unread = false);
    this.unreadCount = 0;
  }

  onCreateNew(): void {
    // Implement create new announcement
    console.log('Creating new announcement');
  }
}
