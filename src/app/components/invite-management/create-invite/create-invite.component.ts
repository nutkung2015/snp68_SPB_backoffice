import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LoadingDataComponent } from '../../../shared/loading-data/loading-data.component';
import { BehaviorSubject } from 'rxjs';
import { FlexLayoutModule } from '@angular/flex-layout';
import { AuthService } from '../../../services/auth.service';
import { InvitationSuccessDialogComponent, InvitationSuccessData } from '../../dialog/invitation-success-dialog/invitation-success-dialog.component';
import { RestService } from '../../../services/rest.service';
import { ToastService } from '../../../shared/toast/toast.service';

interface ProjectMembership {
  project_id: string;
  project_name: string;
  role: string;
}

@Component({
  selector: 'app-create-invite',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    HttpClientModule,
    MatCardModule,
    MatRadioModule,
    MatCheckboxModule,
    MatDialogModule,
    LoadingDataComponent,
    FlexLayoutModule,
  ],
  templateUrl: './create-invite.component.html',
  styleUrls: ['./create-invite.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CreateInviteComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  inviteForm: FormGroup;
  inviteType: 'resident' | 'juristic' = 'resident';
  projectName: string = '';
  projectId: string = '';

  // Options for resident role
  residentRoles = [
    { value: 'owner', label: 'เจ้าบ้าน' },
    { value: 'family', label: 'สมาชิกในบ้าน(ไม่ใช่เจ้าบ้าน)' },
    // { value: 'tenant', label: 'ผู้เช่า' }
  ];

  // Options for juristic/security role
  juristicRoles = [
    { value: 'juristicLeader', label: 'ผู้นำนิติบุคคล' },
    { value: 'juristicMember', label: 'สมาชิกนิติบุคคล' },
    { value: 'security', label: 'รปภ.' }
  ];

  // ประกาศ unit list
  units: any[] = [];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private authService: AuthService,
    private dialog: MatDialog,
    private restService: RestService,
    private toast: ToastService
  ) {
    this.inviteForm = this.fb.group({
      unit_id: [''],
      role: ['', [Validators.required]],
      invited_email: ['']
    });
  }

  ngOnInit() {
    this.loadProjectData();
    this.updateFormValidators();
  }

  loadProjectData() {
    const projectMemberships = this.authService.getProjectMemberships();
    if (projectMemberships && projectMemberships.length > 0) {
      const firstProject = projectMemberships[0];
      this.projectId = firstProject.project_id;
      this.projectName = firstProject.project_name || 'ไม่ระบุชื่อโครงการ';

      // ดึง uinit มาเช็ค
      this.loadUnits();
    }
  }

  loadUnits() {
    this.isLoading.next(true);
    // Use RestService to get units
    this.restService.getUnits(this.projectId)
      .subscribe({
        next: (response: any) => {
          // Adjust based on RestService return type
          if (Array.isArray(response)) {
            this.units = response;
          } else if (response && response.data) {
            this.units = response.data;
          } else {
            this.units = [];
          }
          this.isLoading.next(false);
        },
        error: (error) => {
          console.error('Error loading units:', error);
          this.isLoading.next(false);
        }
      });
  }

  onInviteTypeChange(type: 'resident' | 'juristic') {
    this.inviteType = type;
    this.inviteForm.reset();
    this.updateFormValidators();
  }

  updateFormValidators() {
    const unitIdControl = this.inviteForm.get('unit_id');
    const emailControl = this.inviteForm.get('invited_email');

    if (this.inviteType === 'resident') {
      unitIdControl?.setValidators([Validators.required]);
      emailControl?.setValidators([Validators.required, Validators.email]);
    } else {
      unitIdControl?.clearValidators();
      emailControl?.clearValidators();
    }

    unitIdControl?.updateValueAndValidity();
    emailControl?.updateValueAndValidity();
  }

  async onSubmit(): Promise<void> {
    if (this.inviteForm.valid) {
      this.isLoading.next(true);

      try {
        const formValue = this.inviteForm.value;
        let response: any;

        if (this.inviteType === 'resident') {
          // Use RestService for unit invitation
          const payload: any = {
            unit_id: formValue.unit_id,
            role: formValue.role,
            invited_email: formValue.invited_email
          };

          response = await this.restService.createUnitInvitation(payload).toPromise();

        } else {
          // Use RestService for project invitation
          const payload = {
            project_id: this.projectId,
            role: formValue.role
          };

          response = await this.restService.createProjectInvitation(payload).toPromise();
        }

        console.log('Response:', response);

        if (response) {
          // เปิด dialog แทนการใช้ alert
          const dialogData: InvitationSuccessData = {
            invitationCode: response.invitation_code || response.code || response.invitationCode || 'N/A',
            role: formValue.role,
            type: this.inviteType
          };

          const dialogRef = this.dialog.open(InvitationSuccessDialogComponent, {
            data: dialogData,
            width: '500px',
            disableClose: false
          });

          // รอให้ dialog ปิดแล้วค่อย navigate
          dialogRef.afterClosed().subscribe(() => {
            this.router.navigate(['/invite-management']);
          });
        } else {
          this.toast.error('ไม่สามารถสร้างคำเชิญได้');
          this.router.navigate(['/invite-management']);
        }
      } catch (error) {
        console.error('Error creating invitation:', error);
        this.toast.error('เกิดข้อผิดพลาดในการส่งคำเชิญ');
      } finally {
        this.isLoading.next(false);
      }
    } else {
      this.toast.warning('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
  }

  onCancel(): void {
    this.router.navigate(['/invite-management']);
  }
}
