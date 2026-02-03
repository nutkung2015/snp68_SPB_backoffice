import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// Notification Types จาก Backend
export type NotificationType =
    | 'new_repair_request'       // แจ้งซ่อมใหม่ (Personal Repair - PR-xxx)
    | 'new_common_issue'         // แจ้งปัญหาส่วนกลางใหม่ (Common Issue - CI-xxx)
    | 'announcement_expiring'    // ประกาศใกล้หมดอายุ
    | 'daily_report'             // รายงานประจำวัน
    | 'repair_status_update'     // อัพเดทสถานะแจ้งซ่อม
    | 'system';                  // ระบบ

// Interface ตาม API Response
export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    body: string;               // เปลี่ยนจาก message เป็น body ตาม API
    reference_type?: string;    // 'repair', 'announcement', etc.
    reference_id?: string;      // ID อ้างอิง
    is_read: boolean;           // เปลี่ยนจาก read เป็น is_read ตาม API
    created_at: string;         // เปลี่ยนเป็น string ตาม API
    data?: any;
}

// API Response Interfaces
interface NotificationResponse {
    status: string;
    data: Notification[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        total_pages: number;
    };
    summary: {
        unread_count: number;
    };
}

interface UnreadCountResponse {
    status: string;
    data: {
        unread_count: number;
    };
}

interface GenericResponse {
    status: string;
    message?: string;
}

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    private apiUrl = environment.apiUrl;

    private notifications = new BehaviorSubject<Notification[]>([]);
    public notifications$ = this.notifications.asObservable();

    private unreadCount = new BehaviorSubject<number>(0);
    public unreadCount$ = this.unreadCount.asObservable();

    private isLoading = new BehaviorSubject<boolean>(false);
    public isLoading$ = this.isLoading.asObservable();

    // Polling interval (1 นาที = 60000 ms)
    private readonly POLLING_INTERVAL = 60000;

    constructor(private http: HttpClient) {
        // เริ่มต้น polling เมื่อ service ถูกสร้าง
        this.initializeNotifications();
    }

    /**
     * เริ่มต้นระบบ notification
     */
    private initializeNotifications(): void {
        // Load notifications ทันทีเมื่อเริ่มต้น
        this.loadNotifications();
        this.loadUnreadCount();

        // ตั้ง polling ทุก 1 นาที
        timer(this.POLLING_INTERVAL, this.POLLING_INTERVAL).pipe(
            switchMap(() => {
                this.loadUnreadCount();
                return this.fetchNotifications();
            })
        ).subscribe();
    }

    /**
     * โหลด notifications จาก API
     */
    loadNotifications(page: number = 1, limit: number = 20): void {
        this.fetchNotifications(page, limit).subscribe();
    }

    /**
     * ดึง notifications จาก API
     */
    private fetchNotifications(page: number = 1, limit: number = 20): Observable<Notification[]> {
        this.isLoading.next(true);

        let params = new HttpParams()
            .set('page', page.toString())
            .set('limit', limit.toString());

        return this.http.get<NotificationResponse>(`${this.apiUrl}/api/notifications`, { params }).pipe(
            map(response => {
                if (response.status === 'success') {
                    this.notifications.next(response.data);
                    if (response.summary) {
                        this.unreadCount.next(response.summary.unread_count);
                    }
                    return response.data;
                }
                return [];
            }),
            tap(() => this.isLoading.next(false)),
            catchError(error => {
                console.error('Error fetching notifications:', error);
                this.isLoading.next(false);
                return of([]);
            })
        );
    }

    /**
     * ดึงจำนวน notifications ที่ยังไม่อ่าน
     */
    loadUnreadCount(): void {
        this.http.get<UnreadCountResponse>(`${this.apiUrl}/api/notifications/unread-count`).pipe(
            map(response => {
                if (response.status === 'success' && response.data) {
                    this.unreadCount.next(response.data.unread_count);
                }
            }),
            catchError(error => {
                console.error('Error fetching unread count:', error);
                return of(null);
            })
        ).subscribe();
    }

    /**
     * Mark notification as read
     */
    markAsRead(notificationId: string): Observable<boolean> {
        return this.http.put<GenericResponse>(
            `${this.apiUrl}/api/notifications/${notificationId}/read`,
            {}
        ).pipe(
            map(response => {
                if (response.status === 'success') {
                    // อัพเดท local state
                    const notifications = this.notifications.getValue();
                    const notification = notifications.find(n => n.id === notificationId);
                    if (notification && !notification.is_read) {
                        notification.is_read = true;
                        this.notifications.next([...notifications]);
                        this.unreadCount.next(Math.max(0, this.unreadCount.getValue() - 1));
                    }
                    return true;
                }
                return false;
            }),
            catchError(error => {
                console.error('Error marking notification as read:', error);
                return of(false);
            })
        );
    }

    /**
     * Mark all notifications as read
     */
    markAllAsRead(): Observable<boolean> {
        return this.http.put<GenericResponse>(
            `${this.apiUrl}/api/notifications/read-all`,
            {}
        ).pipe(
            map(response => {
                if (response.status === 'success') {
                    // อัพเดท local state
                    const notifications = this.notifications.getValue();
                    notifications.forEach(n => n.is_read = true);
                    this.notifications.next([...notifications]);
                    this.unreadCount.next(0);
                    return true;
                }
                return false;
            }),
            catchError(error => {
                console.error('Error marking all notifications as read:', error);
                return of(false);
            })
        );
    }

    /**
     * Delete a specific notification
     */
    deleteNotification(notificationId: string): Observable<boolean> {
        return this.http.delete<GenericResponse>(
            `${this.apiUrl}/api/notifications/${notificationId}`
        ).pipe(
            map(response => {
                if (response.status === 'success') {
                    // อัพเดท local state
                    const notifications = this.notifications.getValue();
                    const notification = notifications.find(n => n.id === notificationId);
                    const wasUnread = notification && !notification.is_read;

                    const filtered = notifications.filter(n => n.id !== notificationId);
                    this.notifications.next(filtered);

                    if (wasUnread) {
                        this.unreadCount.next(Math.max(0, this.unreadCount.getValue() - 1));
                    }
                    return true;
                }
                return false;
            }),
            catchError(error => {
                console.error('Error deleting notification:', error);
                return of(false);
            })
        );
    }

    /**
     * Clear all notifications
     */
    clearAll(): Observable<boolean> {
        return this.http.delete<GenericResponse>(
            `${this.apiUrl}/api/notifications/clear-all`
        ).pipe(
            map(response => {
                if (response.status === 'success') {
                    this.notifications.next([]);
                    this.unreadCount.next(0);
                    return true;
                }
                return false;
            }),
            catchError(error => {
                console.error('Error clearing all notifications:', error);
                return of(false);
            })
        );
    }

    /**
     * Get notifications (current value)
     */
    getNotifications(): Notification[] {
        return this.notifications.getValue();
    }

    /**
     * Get unread count (current value)
     */
    getUnreadCount(): number {
        return this.unreadCount.getValue();
    }

    /**
     * Refresh notifications manually
     */
    refresh(): void {
        this.loadNotifications();
        this.loadUnreadCount();
    }

    /**
     * Get action URL based on notification type and reference
     */
    getActionUrl(notification: Notification): string | null {
        if (notification.reference_type && notification.reference_id) {
            switch (notification.reference_type) {
                case 'repair':
                    // Personal Repair (PR-xxx) → /issue/detail
                    if (notification.reference_id.startsWith('PR-')) {
                        return `/issue/detail/${notification.reference_id}`;
                    }
                    return null;

                case 'issue':
                    // Common Issue (CI-xxx) → /issue-common/detail
                    if (notification.reference_id.startsWith('CI-')) {
                        return `/issue-common/detail/${notification.reference_id}`;
                    }
                    return null;

                case 'announcement':
                    return `/announcement/detail/${notification.reference_id}`;

                case 'daily_report':
                    return '/dashboard';

                default:
                    return null;
            }
        }
        return null;
    }

    /**
     * Get notification icon based on type
     */
    getNotificationIcon(type: NotificationType): string {
        switch (type) {
            case 'new_repair_request':
                return 'build';
            case 'new_common_issue':
                return 'report_problem';
            case 'announcement_expiring':
                return 'campaign';
            case 'daily_report':
                return 'assessment';
            case 'repair_status_update':
                return 'update';
            case 'system':
                return 'info';
            default:
                return 'notifications';
        }
    }

    /**
     * Get notification color based on type
     */
    getNotificationColor(type: NotificationType): string {
        switch (type) {
            case 'new_repair_request':
                return '#ff9800'; // orange
            case 'new_common_issue':
                return '#f44336'; // red
            case 'announcement_expiring':
                return '#2196f3'; // blue
            case 'daily_report':
                return '#4caf50'; // green
            case 'repair_status_update':
                return '#9c27b0'; // purple
            case 'system':
                return '#607d8b'; // blue-grey
            default:
                return '#9e9e9e'; // grey
        }
    }

    /**
     * Format time ago (เช่น "5 นาทีที่แล้ว")
     */
    getTimeAgo(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return 'เมื่อสักครู่';
        } else if (diffMins < 60) {
            return `${diffMins} นาทีที่แล้ว`;
        } else if (diffHours < 24) {
            return `${diffHours} ชั่วโมงที่แล้ว`;
        } else if (diffDays < 7) {
            return `${diffDays} วันที่แล้ว`;
        } else {
            return date.toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        }
    }
}
