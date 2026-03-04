import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotificationService, Notification, NotificationType } from '../../services/notification.service';
import { Subscription, forkJoin } from 'rxjs';

@Component({
  selector: 'app-topnav-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topnav-bar.component.html',
  styleUrls: ['./topnav-bar.component.scss'],
})
export class TopnavBarComponent implements OnInit, OnDestroy {
  @Input() sidebarCollapsed = false;
  showNotifications = false;
  showProfileMenu = false;

  // Notification data from service
  notifications: Notification[] = [];
  unreadCount = 0;

  userName: string | null = null;
  userRole: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) { }

  ngOnInit(): void {
    // Subscribe to currentUser$ to get updates on user state
    const userSub = this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.userName = user.full_name;
        this.userRole = user.role === 'juristic' ? 'นิติบุคคล' : (user.role || 'Guest');
      } else {
        this.userName = null;
        this.userRole = null;
      }
    });
    this.subscriptions.push(userSub);

    // Subscribe to notifications
    const notifSub = this.notificationService.notifications$.subscribe(notifications => {
      this.notifications = notifications;
    });
    this.subscriptions.push(notifSub);

    // Subscribe to unread count
    const countSub = this.notificationService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
    this.subscriptions.push(countSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout failed', err);
        this.router.navigate(['/login']);
      }
    });
  }

  // Method to toggle notifications dropdown
  toggleNotificationsDropdown(): void {
    this.showNotifications = !this.showNotifications;
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId).subscribe();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  // Navigate to notification action URL
  onNotificationClick(notification: Notification): void {
    this.markAsRead(notification.id);
    const actionUrl = this.notificationService.getActionUrl(notification);
    if (actionUrl) {
      this.router.navigate([actionUrl]);
      this.showNotifications = false;
    }
  }

  onProfileClick(): void {
    this.router.navigate(['/profile']);
    this.showProfileMenu = false;
  }

  // Get icon for notification type
  getNotificationIcon(type: NotificationType): string {
    return this.notificationService.getNotificationIcon(type);
  }

  // Get color for notification type
  getNotificationColor(type: NotificationType): string {
    return this.notificationService.getNotificationColor(type);
  }

  // Format time ago - ใช้ method จาก service
  getTimeAgo(dateString: string): string {
    return this.notificationService.getTimeAgo(dateString);
  }

  // Refresh notifications
  refreshNotifications(): void {
    this.notificationService.refresh();
  }

  onCreateNew(): void {
    // Implement create new announcement
    console.log('Creating new announcement');
  }

  // --- API-based notification deletion (persists server-side) ---

  /** Check if there are any read notifications that can be deleted */
  get hasReadNotifications(): boolean {
    return this.notifications.some(n => n.is_read);
  }

  /** Delete a single read notification via API */
  dismissNotification(event: Event, notification: Notification): void {
    event.stopPropagation(); // Prevent triggering onNotificationClick
    this.notificationService.deleteNotification(notification.id).subscribe();
  }

  /** Delete all read notifications via API (batch) */
  dismissAllRead(): void {
    const readNotifications = this.notifications.filter(n => n.is_read);
    if (readNotifications.length === 0) return;

    const deleteRequests = readNotifications.map(n =>
      this.notificationService.deleteNotification(n.id)
    );

    forkJoin(deleteRequests).subscribe();
  }
}
