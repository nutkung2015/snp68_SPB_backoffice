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
import { RestService } from '../../services/rest.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../shared/toast/toast.service';

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
  selectedFile: File | null = null;

  // Theme Style Presets - จัดกลุ่มตามสไตล์โครงการบ้านในไทย
  themeStyleGroups = [
    {
      groupName: 'Luxury & Trust',
      groupNameTH: 'หรูหรา น่าเชื่อถือ',
      groupIcon: 'diamond',
      description: 'เหมาะกับคอนโดหรู โครงการระดับ High-end',
      themes: [
        {
          id: 'elegant-dark',
          name: 'Elegant Dark',
          nameTH: 'หรูหราเข้ม',
          primary: '#0D2A4A',
          secondary: '#C5A065',
          preview: 'สไตล์ Sansiri / SC Asset'
        },
        {
          id: 'platinum',
          name: 'Platinum',
          nameTH: 'แพลทินัม',
          primary: '#1C1C1E',
          secondary: '#A8A9AD',
          preview: 'โทนเทาหรู ทันสมัย'
        }
      ]
    },
    {
      groupName: 'Nature & Well-being',
      groupNameTH: 'ธรรมชาติ ร่มรื่น',
      groupIcon: 'park',
      description: 'เหมาะกับบ้านเดี่ยว โครงการแนว Green Living',
      themes: [
        {
          id: 'eco-life',
          name: 'Eco Life',
          nameTH: 'ธรรมชาติสดใส',
          primary: '#2E5945',
          secondary: '#E3D5CA',
          preview: 'สไตล์ Land & Houses'
        },
        {
          id: 'fresh-garden',
          name: 'Fresh Garden',
          nameTH: 'สวนสดใส',
          primary: '#82BC00',
          secondary: '#8D7B68',
          preview: 'สไตล์ Pruksa'
        }
      ]
    },
    {
      groupName: 'Modern & Energetic',
      groupNameTH: 'ทันสมัย กระฉับกระเฉง',
      groupIcon: 'bolt',
      description: 'เหมาะกับคอนโดติดรถไฟฟ้า ทาวน์โฮมคนรุ่นใหม่',
      themes: [
        {
          id: 'urban-loft',
          name: 'Urban Loft',
          nameTH: 'เมืองทันสมัย',
          primary: '#A00000',
          secondary: '#F4F4F5',
          preview: 'สไตล์ AP Thailand'
        },
        {
          id: 'sunrise-energy',
          name: 'Sunrise Energy',
          nameTH: 'พลังใหม่',
          primary: '#E87D2E',
          secondary: '#282828',
          preview: 'สไตล์ Origin'
        }
      ]
    },
    {
      groupName: 'Minimal & Zen',
      groupNameTH: 'เรียบง่าย สงบ',
      groupIcon: 'spa',
      description: 'เหมาะกับโครงการแนว Muji / Nordic / Japanese',
      themes: [
        {
          id: 'zen-minimal',
          name: 'Zen Minimal',
          nameTH: 'มินิมอลเซน',
          primary: '#8D8D8D',
          secondary: '#F5F5F0',
          preview: 'โทนญี่ปุ่นเรียบ'
        },
        {
          id: 'warm-nordic',
          name: 'Warm Nordic',
          nameTH: 'นอร์ดิกอบอุ่น',
          primary: '#A69082',
          secondary: '#F5F5F0',
          preview: 'โทนครีมอุ่น'
        }
      ]
    },
    {
      groupName: 'SPB Signature',
      groupNameTH: 'SPB ซิกเนเจอร์',
      groupIcon: 'star',
      description: 'โทนสีประจำแบรนด์ SPB สไตล์ทันสมัย น่าเชื่อถือ',
      themes: [
        {
          id: 'spb-ocean-blue',
          name: 'SPB Ocean Blue',
          nameTH: 'SPB โอเชี่ยนบลู',
          primary: '#1F7EFF',
          secondary: '#2A405E',
          preview: 'โทนฟ้าสด ทันสมัย'
        },
        {
          id: 'spb-deep-navy',
          name: 'SPB Deep Navy',
          nameTH: 'SPB ดีพเนวี่',
          primary: '#2A405E',
          secondary: '#1F7EFF',
          preview: 'โทนน้ำเงินเข้ม มั่นคง'
        }
      ]
    }
  ];

  // Selected theme ID for highlighting
  selectedThemeId: string = '';

  quickActions = [
    { icon: 'receipt', label: 'บิลค่าใช้จ่าย' },
    { icon: 'chat', label: 'แชท' },
    { icon: 'build', label: 'แจ้งซ่อม' },
    { icon: 'qr_code', label: 'QR Code' },
    { icon: 'notifications', label: 'การแจ้งเตือน' },
    { icon: 'menu_book', label: 'คู่มือ' },
  ];
  constructor(
    private toast: ToastService,
    private http: HttpClient,
    private restService: RestService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    console.log('ngOnInit เริ่มทำงาน');
    console.log('localStorage มีข้อมูลดังนี้:', Object.keys(localStorage));
    this.loadTheme();
  }

  loadTheme() {
    console.log('loadTheme เริ่มทำงาน');

    // Load project memberships first to get project_id
    this.loadProjectMemberships();

    // Then fetch customizations from API
    if (this.theme.project_id) {
      this.fetchProjectCustomizations(this.theme.project_id);
    } else {
      console.warn('No project_id found, using default theme');
      this.updatePreview();
    }
  }

  private fetchProjectCustomizations(projectId: string) {
    console.log('Fetching project customizations for project_id:', projectId);

    this.restService.getProjectCustomization(projectId).subscribe({
      next: (response: any) => {
        console.log('API Response:', response);

        // รองรับทั้ง 2 format:
        // 1. { status: 'success', data: {...} }
        // 2. { customization_id, project_id, primary_color, ... } (ข้อมูลโดยตรง)
        const customizations = response.data || response;

        // ตรวจสอบว่ามีข้อมูล customization หรือไม่
        if (customizations && (customizations.primary_color || customizations.project_id)) {
          this.theme = {
            project_id: customizations.project_id || this.theme.project_id,
            primary_color: customizations.primary_color || this.theme.primary_color,
            secondary_color: customizations.secondary_color || this.theme.secondary_color,
            logo_url: customizations.logo_url || this.theme.logo_url,
            favicon_url: customizations.favicon_url || this.theme.favicon_url,
          };

          this.isDefaultTheme = false;
          this.hasExistingCustomization = true;

          console.log('Theme loaded from API:', this.theme);
        } else {
          console.log('No customizations found, using default theme');
          this.hasExistingCustomization = false;
        }

        this.updatePreview();
      },
      error: (error) => {
        console.error('Error fetching project customizations:', error);
        console.log('Using default theme due to error');
        this.hasExistingCustomization = false;
        this.updatePreview();
      }
    });
  }

  private loadProjectMemberships() {
    const memberships = this.authService.getProjectMemberships();
    if (memberships && memberships.length > 0) {
      const project = memberships[0];
      this.theme.project_id = project.project_id;
      this.projectName = project.project_name;
    } else {
      this.projectName = 'Unknown Project';
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (file) {
      // ตรวจสอบประเภทไฟล์
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        this.toast.error('รองรับเฉพาะไฟล์ JPG และ PNG เท่านั้น');
        return;
      }

      // ตรวจสอบขนาดไฟล์
      if (file.size > maxSize) {
        this.toast.error('ขนาดไฟล์ต้องไม่เกิน 5MB');
        return;
      }

      console.log('Selected file:', file);
      this.selectedFile = file;

      // แสดง preview ของรูปที่เลือก
      const reader = new FileReader();
      reader.onload = () => {
        this.theme.logo_url = reader.result as string;
        this.updatePreview();
        this.isDefaultTheme = false;
      };
      reader.readAsDataURL(file);
    }
  }

  updatePreview() {
    this.previewTheme = { ...this.theme };
  }

  // เลือก Theme Style จาก preset
  selectThemeStyle(themeId: string, primary: string, secondary: string) {
    this.selectedThemeId = themeId;
    this.theme.primary_color = primary;
    this.theme.secondary_color = secondary;
    this.updatePreview();
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
    // สร้าง FormData สำหรับส่งไฟล์และข้อมูลอื่นๆ
    const formData = new FormData();
    const projectId = this.theme.project_id;

    if (!projectId) {
      this.toast.error('ไม่พบรหัสโครงการ');
      return;
    }

    formData.append('project_id', projectId);
    formData.append('primary_color', this.theme.primary_color);
    formData.append('secondary_color', this.theme.secondary_color);

    // เพิ่มไฟล์โลโก้ถ้ามีการเลือก
    if (this.selectedFile) {
      formData.append('logo', this.selectedFile, this.selectedFile.name);
    }

    console.log('Creating new theme with FormData');

    this.restService.createProjectCustomization(formData).subscribe({
      next: (response: any) => {
        console.log('Create API Response:', response);

        this.toast.success('สร้างธีมเรียบร้อยแล้ว');

        // Re-fetch จาก API เพื่อให้แน่ใจว่าข้อมูลตรงกัน
        this.hasExistingCustomization = true;
        this.fetchProjectCustomizations(projectId);
      },
      error: (error) => {
        console.error('Error creating theme:', error);
        this.toast.error('เกิดข้อผิดพลาดในการสร้างธีม');
      },
    });
  }

  // อัปเดต customization ที่มีอยู่
  updateTheme() {
    const projectId = this.theme.project_id;

    if (!projectId) {
      this.toast.error('ไม่พบรหัสโครงการ');
      return;
    }

    // สร้าง FormData สำหรับส่งไฟล์และข้อมูลอื่นๆ
    const formData = new FormData();

    formData.append('primary_color', this.theme.primary_color);
    formData.append('secondary_color', this.theme.secondary_color);

    // เพิ่มไฟล์โลโก้ถ้ามีการเลือกใหม่
    if (this.selectedFile) {
      formData.append('logo', this.selectedFile, this.selectedFile.name);
    }

    console.log('Updating theme with FormData');

    this.restService.updateProjectCustomization(projectId, formData).subscribe({
      next: (response: any) => {
        console.log('Update API Response:', response);

        this.toast.success('อัปเดตธีมเรียบร้อยแล้ว');

        // Re-fetch จาก API เพื่อให้แน่ใจว่าข้อมูลตรงกัน
        this.fetchProjectCustomizations(projectId);
      },
      error: (error) => {
        console.error('Error updating theme:', error);
        this.toast.error('เกิดข้อผิดพลาดในการอัปเดตธีม');
      },
    });
  }

  resetToDefault() {
    const projectId = this.theme.project_id;
    if (!projectId) return;

    // กำหนดค่า default
    const defaultTheme = {
      primary_color: '#3f51b5',
      secondary_color: '#ff4081',
      logo_url: 'assets/livlink_logo.png',
      favicon_url: 'assets/favicon.ico',
    };

    // Fetch รูป default logo แล้วส่งไปพร้อม FormData
    fetch(defaultTheme.logo_url)
      .then(response => response.blob())
      .then(blob => {
        // สร้าง FormData สำหรับส่งค่า default ไป Backend
        const formData = new FormData();
        formData.append('primary_color', defaultTheme.primary_color);
        formData.append('secondary_color', defaultTheme.secondary_color);

        // สร้าง File จาก Blob และ append เข้า FormData
        const defaultLogoFile = new File([blob], 'livlink_logo.png', { type: 'image/png' });
        formData.append('logo', defaultLogoFile, 'livlink_logo.png');

        // เรียก API เพื่ออัปเดตค่า default ไปที่ Backend
        this.restService.updateProjectCustomization(projectId, formData).subscribe({
          next: (response: any) => {
            console.log('Reset to default API Response:', response);

            this.isDefaultTheme = true;
            this.selectedThemeId = ''; // ล้าง theme ที่เลือก
            this.toast.success('รีเซ็ตธีมเป็นค่าเริ่มต้นแล้ว');

            // Re-fetch จาก API เพื่อให้แน่ใจว่าข้อมูลตรงกัน
            this.fetchProjectCustomizations(projectId);
          },
          error: (error) => {
            console.error('Error resetting theme:', error);
            this.toast.error('เกิดข้อผิดพลาดในการรีเซ็ตธีม');
          },
        });
      })
      .catch(error => {
        console.error('Error fetching default logo:', error);
        this.toast.error('เกิดข้อผิดพลาดในการโหลดรูป default');
      });
  }
}
