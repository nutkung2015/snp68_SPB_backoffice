import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FlexLayoutModule } from '@angular/flex-layout';

// Shared Components
import { PageHeaderComponent } from '../shared/page-header/page-header.component';

// Services
import { AuthService, UserProfile } from '../services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSlideToggleModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    FlexLayoutModule,
    PageHeaderComponent
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  @ViewChild('editProfileDialog') editProfileDialog!: TemplateRef<any>;

  userProfile: UserProfile | null = null;
  isLoading = false;
  has2FA = false;
  profileForm!: FormGroup;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      full_name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.pattern(/^[0-9]{9,10}$/)]],
    });
  }

  loadProfile(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (response) => {
        // Handle different response structures
        let user = response;
        if (response.data) {
          user = response.data;
        }
        if (user.user) {
          user = user.user;
        }

        // Normalize role
        if (user.role && typeof user.role === 'string') {
          user.role = user.role.toLowerCase();
        }

        // Normalize project_memberships
        if (!user.projectMemberships && user.project_memberships) {
          user.projectMemberships = user.project_memberships;
        }

        this.userProfile = user;
        this.has2FA = user.mfa_enabled || false;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.isLoading = false;
        this.showSnackbar('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้', 'error');
      }
    });
  }

  getRoleBadgeClass(): string {
    if (!this.userProfile?.role) return 'role-default';
    const role = this.userProfile.role.toLowerCase();
    switch (role) {
      case 'juristicleader':
        return 'role-juristicleader';
      case 'juristicmember':
      case 'juristic':
        return 'role-juristicmember';
      case 'security':
        return 'role-security';
      case 'superadmin':
        return 'role-superadmin';
      default:
        return 'role-default';
    }
  }

  getRoleDisplayName(): string {
    if (!this.userProfile?.role) return 'ไม่ระบุ';
    const role = this.userProfile.role.toLowerCase();
    switch (role) {
      case 'juristicleader':
        return 'หัวหน้านิติบุคคล';
      case 'juristicmember':
      case 'juristic':
        return 'นิติบุคคล';
      case 'security':
        return 'รปภ.';
      case 'superadmin':
        return 'Super Admin';
      case 'resident':
        return 'ผู้อยู่อาศัย';
      default:
        return role;
    }
  }

  getProjectRoleName(role: string): string {
    if (!role) return '-';
    const roleLower = role.toLowerCase();
    switch (roleLower) {
      case 'juristicleader':
        return 'หัวหน้านิติบุคคล';
      case 'juristicmember':
      case 'juristic':
        return 'นิติบุคคล';
      case 'security':
        return 'รปภ.';
      default:
        return role;
    }
  }

  onEditProfile(): void {
    if (this.userProfile) {
      this.profileForm.patchValue({
        full_name: this.userProfile.full_name || '',
        phone: this.userProfile.phone || '',
      });
    }

    this.dialog.open(this.editProfileDialog, {
      width: '450px',
      panelClass: 'profile-dialog'
    });
  }

  saveProfile(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;
      // TODO: Implement update profile API call
      // For now, we'll just close the dialog and show a message
      this.dialog.closeAll();
      this.showSnackbar('บันทึกข้อมูลเรียบร้อยแล้ว', 'success');
      this.isLoading = false;

      // Update local profile data
      if (this.userProfile) {
        this.userProfile.full_name = this.profileForm.value.full_name;
        this.userProfile.phone = this.profileForm.value.phone;
      }
    }
  }

  onEditAvatar(): void {
    // TODO: Implement avatar upload functionality
    this.showSnackbar('ฟีเจอร์นี้กำลังพัฒนา', 'info');
  }

  onChangePassword(): void {
    this.router.navigate(['/reset-password']);
  }

  onToggle2FA(): void {
    // TODO: Implement 2FA toggle functionality
    this.has2FA = !this.has2FA;
    const message = this.has2FA
      ? 'เปิดใช้งานการยืนยันตัวตนสองขั้นตอนแล้ว'
      : 'ปิดการยืนยันตัวตนสองขั้นตอนแล้ว';
    this.showSnackbar(message, 'success');
  }

  onNotificationSettings(): void {
    // TODO: Navigate to notification settings page or open dialog
    this.showSnackbar('ฟีเจอร์นี้กำลังพัฒนา', 'info');
  }

  onLogout(): void {
    this.isLoading = true;
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        // Even on error, navigate to login
        this.router.navigate(['/login']);
      }
    });
  }

  private showSnackbar(message: string, type: 'success' | 'error' | 'info'): void {
    const panelClass = type === 'success' ? 'toast-success'
      : type === 'error' ? 'toast-error'
        : 'toast-info';

    this.snackBar.open(message, 'ปิด', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: [panelClass]
    });
  }
}
