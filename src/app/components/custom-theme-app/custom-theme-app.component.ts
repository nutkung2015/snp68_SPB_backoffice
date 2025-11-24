import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';

// shared component
import { PageHeaderComponent } from '../../shared/page-header/page-header.component';
import { environment } from '../../../environments/environment';

interface ThemeSettings {
  project_id: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  favicon_url: string;
}

@Component({
  selector: 'app-custom-theme-app',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatToolbarModule,
    MatSnackBarModule,
    PageHeaderComponent,
  ],
  templateUrl: './custom-theme-app.component.html',
  styleUrls: ['./custom-theme-app.component.scss'],
})
export class CustomThemeAppComponent implements OnInit {
  theme: ThemeSettings = {
    project_id: '',
    primary_color: '#3f51b5',
    secondary_color: '#ff4081',
    logo_url: 'assets/images/logo-default.png',
    favicon_url: 'assets/favicon.ico',
  };

  projectName: string = '';
  previewTheme: Partial<ThemeSettings> = {};
  isDefaultTheme = true;
  hasExistingCustomization = false; // ตรวจสอบว่ามี customization อยู่แล้วหรือไม่

  quickActions = [
    { icon: 'receipt', label: 'บิลค่าใช้จ่าย' },
    { icon: 'chat', label: 'แชท' },
    { icon: 'build', label: 'แจ้งซ่อม' },
    { icon: 'qr_code', label: 'QR Code' },
    { icon: 'notifications', label: 'การแจ้งเตือน' },
    { icon: 'menu_book', label: 'คู่มือ' },
  ];
  constructor(private snackBar: MatSnackBar, private http: HttpClient) { }

  ngOnInit() {
    console.log('ngOnInit เริ่มทำงาน');
    console.log('localStorage มีข้อมูลดังนี้:', Object.keys(localStorage));
    this.loadTheme();
  }

  async loadTheme() {
    console.log('loadTheme เริ่มทำงาน');
    this.loadSavedTheme();
    this.loadProjectMemberships();
    console.log('Calling updatePreview...');
    this.updatePreview();
    console.log('updatePreview called successfully.');
  }

  private loadSavedTheme() {
    // โหลดข้อมูลจาก projectCustomizations ใน localStorage
    const projectCustomizationsStr = localStorage.getItem('projectCustomizations');
    console.log('projectCustomizations จาก localStorage:', projectCustomizationsStr);

    if (projectCustomizationsStr) {
      try {
        const projectCustomizations = JSON.parse(projectCustomizationsStr);
        console.log('Parsed projectCustomizations:', projectCustomizations);

        // ตรวจสอบว่ามีข้อมูลและนำมาใช้
        if (projectCustomizations) {
          // Map ข้อมูลจาก projectCustomizations ไปยัง theme
          this.theme = {
            project_id: projectCustomizations.project_id || this.theme.project_id,
            primary_color: projectCustomizations.primary_color || this.theme.primary_color,
            secondary_color: projectCustomizations.secondary_color || this.theme.secondary_color,
            logo_url: projectCustomizations.logo_url || this.theme.logo_url,
            favicon_url: projectCustomizations.favicon_url || this.theme.favicon_url,
          };

          console.log('Theme loaded from projectCustomizations:', this.theme);
          this.isDefaultTheme = false;
          this.hasExistingCustomization = true; // มี customization อยู่แล้ว
        }
      } catch (e) {
        console.error('Error loading projectCustomizations:', e);
        this.hasExistingCustomization = false;
      }
    } else {
      console.log('No projectCustomizations found in localStorage');
      this.hasExistingCustomization = false; // ไม่มี customization
    }
  }

  private loadProjectMemberships() {
    const projectMembershipsStr = localStorage.getItem('projectMemberships');
    console.log('Raw projectMemberships string:', projectMembershipsStr);

    if (projectMembershipsStr) {
      try {
        const projectMemberships = JSON.parse(projectMembershipsStr);
        console.log('Parsed Project Memberships:', projectMemberships);

        if (Array.isArray(projectMemberships) && projectMemberships.length > 0) {
          const project = projectMemberships[0];
          this.theme.project_id = project.project_id;
          this.projectName = project.project_name;
          console.log(
            'Using project_id and project_name from projectMemberships:',
            this.theme.project_id,
            this.projectName
          );
        } else {
          console.log('No project memberships found or empty array');
          this.projectName = 'Unknown Project';
        }
      } catch (e) {
        console.error('Error parsing project memberships:', e);
        this.snackBar.open(
          'เกิดข้อผิดพลาดในการโหลดข้อมูล Project Memberships',
          'ปิด',
          {
            duration: 3000,
          }
        );
        this.projectName = 'Unknown Project';
      }
    } else {
      console.log('No projectMemberships found in localStorage');
      this.projectName = 'Unknown Project';
    }
  }

  onFileSelected(event: Event, type: 'logo' | 'favicon') {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        if (type === 'logo') {
          this.theme.logo_url = url;
        } else {
          this.theme.favicon_url = url;
        }
        this.updatePreview();
        this.isDefaultTheme = false;
      };
      reader.readAsDataURL(file);
    }
  }

  updatePreview() {
    this.previewTheme = { ...this.theme };
  }

  // ฟังก์ชันหลักที่ตรวจสอบว่าจะ create หรือ update
  saveTheme() {
    if (this.hasExistingCustomization) {
      this.updateTheme();
    } else {
      this.createTheme();
    }
  }

  // สร้าง customization ใหม่
  createTheme() {
    const apiUrl = `${environment.apiUrl}/api/project-customizations`;
    const payload = {
      project_id:
        this.theme.project_id || localStorage.getItem('project_id') || '',
      primary_color: this.theme.primary_color,
      secondary_color: this.theme.secondary_color,
      logo_url: this.theme.logo_url,
      favicon_url: this.theme.favicon_url,
    };

    console.log('Creating new theme with payload:', payload);

    this.http.post(apiUrl, payload).subscribe({
      next: (response: any) => {
        console.log('Create API Response:', response);

        // บันทึกข้อมูลลง localStorage ในคีย์ projectCustomizations
        try {
          const customizationData = {
            customization_id: response.customization_id || response.id,
            project_id: this.theme.project_id,
            primary_color: this.theme.primary_color,
            secondary_color: this.theme.secondary_color,
            accent_color: response.accent_color || null,
            logo_url: this.theme.logo_url,
            favicon_url: this.theme.favicon_url,
            created_at: response.created_at || new Date().toISOString(),
            updated_at: response.updated_at || new Date().toISOString(),
          };

          localStorage.setItem('projectCustomizations', JSON.stringify(customizationData));
          this.isDefaultTheme = false;
          this.hasExistingCustomization = true; // อัปเดตสถานะ
          console.log('Saved to projectCustomizations:', customizationData);

          this.snackBar.open('สร้างธีมเรียบร้อยแล้ว', 'ปิด', {
            duration: 3000,
          });
        } catch (e) {
          console.error('Error saving to localStorage:', e);
          this.snackBar.open('บันทึกไปยัง API สำเร็จ แต่เกิดข้อผิดพลาดในการบันทึกลง localStorage', 'ปิด', {
            duration: 3000,
          });
        }
      },
      error: (error) => {
        console.error('Error creating theme:', error);
        this.snackBar.open('เกิดข้อผิดพลาดในการสร้างธีม', 'ปิด', {
          duration: 3000,
        });
      },
    });
  }

  // อัปเดต customization ที่มีอยู่
  updateTheme() {
    const projectId = this.theme.project_id || localStorage.getItem('project_id') || '';
    const apiUrl = `${environment.apiUrl}/api/project-customizations/${projectId}`;
    const payload = {
      primary_color: this.theme.primary_color,
      secondary_color: this.theme.secondary_color,
      logo_url: this.theme.logo_url,
      favicon_url: this.theme.favicon_url,
    };

    console.log('Updating theme with payload:', payload);

    this.http.put(apiUrl, payload).subscribe({
      next: (response: any) => {
        console.log('Update API Response:', response);

        // อัปเดตข้อมูลใน localStorage
        try {
          const existingData = JSON.parse(localStorage.getItem('projectCustomizations') || '{}');
          const customizationData = {
            ...existingData,
            primary_color: this.theme.primary_color,
            secondary_color: this.theme.secondary_color,
            logo_url: this.theme.logo_url,
            favicon_url: this.theme.favicon_url,
            updated_at: response.updated_at || new Date().toISOString(),
          };

          localStorage.setItem('projectCustomizations', JSON.stringify(customizationData));
          console.log('Updated projectCustomizations:', customizationData);

          this.snackBar.open('อัปเดตธีมเรียบร้อยแล้ว', 'ปิด', {
            duration: 3000,
          });
        } catch (e) {
          console.error('Error updating localStorage:', e);
          this.snackBar.open('อัปเดตไปยัง API สำเร็จ แต่เกิดข้อผิดพลาดในการบันทึกลง localStorage', 'ปิด', {
            duration: 3000,
          });
        }
      },
      error: (error) => {
        console.error('Error updating theme:', error);
        this.snackBar.open('เกิดข้อผิดพลาดในการอัปเดตธีม', 'ปิด', {
          duration: 3000,
        });
      },
    });
  }

  resetToDefault() {
    this.theme = {
      project_id: this.theme.project_id || localStorage.getItem('project_id') || '',
      primary_color: '#3f51b5',
      secondary_color: '#ff4081',
      logo_url: 'assets/images/logo-default.png',
      favicon_url: 'assets/favicon.ico',
    };
    localStorage.removeItem('projectCustomizations');
    this.isDefaultTheme = true;
    this.hasExistingCustomization = false; // รีเซ็ตสถานะ
    this.updatePreview();

    this.snackBar.open('รีเซ็ตธีมเป็นค่าเริ่มต้นแล้ว', 'ปิด', {
      duration: 3000,
    });
  }
}
