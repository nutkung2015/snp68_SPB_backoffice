import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastConfig {
    message: string;
    type?: ToastType;
    duration?: number;
    action?: string;
}

@Injectable({
    providedIn: 'root'
})
export class ToastService {
    private snackBar = inject(MatSnackBar);

    /**
     * แสดง Toast notification
     * @param config - ToastConfig object หรือ string message
     */
    show(config: ToastConfig | string): void {
        const toastConfig: ToastConfig = typeof config === 'string'
            ? { message: config }
            : config;

        const snackBarConfig: MatSnackBarConfig = {
            duration: toastConfig.duration ?? 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top',
            panelClass: this.getPanelClass(toastConfig.type || 'info')
        };

        this.snackBar.open(
            toastConfig.message,
            toastConfig.action || 'ปิด',
            snackBarConfig
        );
    }

    /** แสดง Success toast */
    success(message: string, duration?: number): void {
        this.show({ message, type: 'success', duration });
    }

    /** แสดง Error toast */
    error(message: string, duration?: number): void {
        this.show({ message, type: 'error', duration: duration ?? 5000 });
    }

    /** แสดง Warning toast */
    warning(message: string, duration?: number): void {
        this.show({ message, type: 'warning', duration });
    }

    /** แสดง Info toast */
    info(message: string, duration?: number): void {
        this.show({ message, type: 'info', duration });
    }

    /** ปิด Toast ที่กำลังแสดงอยู่ */
    dismiss(): void {
        this.snackBar.dismiss();
    }

    private getPanelClass(type: ToastType): string[] {
        return [`toast-${type}`];
    }
}
