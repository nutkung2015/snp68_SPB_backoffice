import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { LoadingDataComponent } from '../../../shared/loading-data/loading-data.component';
import { RestService } from '../../../services/rest.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../shared/toast/toast.service';

interface ImageUrl {
  url: string;
  public_id: string;
}

export interface CommonIssue {
  id: string;
  unit_id: string;
  project_id: string;
  zone: string;
  reporter_name: string;
  reporter_id: string;
  reported_date: string;
  issue_type: string;
  location: string;
  description: string;
  image_urls: ImageUrl[];
  status: string;
  assigned_to: string | null;
  priority: string;
  notes: string | null;
  resolved_date: string | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-issue-common-edit',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    FlexLayoutModule,
    FormsModule,
    ReactiveFormsModule,
    LoadingDataComponent
  ],
  templateUrl: './issue-common-edit.component.html',
  styleUrls: ['./issue-common-edit.component.scss']
})
export class IssueCommonEditComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();

  editForm: FormGroup;
  issue?: CommonIssue;
  juristicMembers: any[] = [];
  imageUrls: ImageUrl[] = [];

  statusOptions = [
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'in_progress', label: 'กำลังดำเนินการ' },
    { value: 'completed', label: 'เสร็จสิ้น' },
    { value: 'rejected', label: 'ปฏิเสธ' }
    // { value: 'reopened', label: 'เปิดใหม่' }
  ];

  priorityOptions = [
    { value: 'low', label: 'ต่ำ' },
    { value: 'medium', label: 'ปานกลาง' },
    { value: 'high', label: 'สูง' },
    { value: 'critical', label: 'วิกฤต' }
  ];

  repairCategoryOptions = [
    { value: 'AssetsFacilities', label: 'ทรัพย์สิน/สิ่งอำนวยความสะดวก' },
    { value: 'plumbing', label: 'ประปา' },
    { value: 'electrical', label: 'ไฟฟ้า' },
    { value: 'building', label: 'อาคาร' },
    { value: 'other', label: 'อื่นๆ' }
  ];

  constructor(
    private fb: FormBuilder,
    private rest: RestService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService,
    private authService: AuthService
  ) {
    this.editForm = this.fb.group({
      location: [{ value: '', disabled: true }, Validators.required],
      priority: [{ value: '', disabled: true }, Validators.required],
      issue_type: [{ value: '', disabled: true }, Validators.required],
      status: ['', Validators.required],
      assigned_to: [''],
      notes: ['']
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadIssue(id);
      this.loadJuristicMembers();
    }
  }

  loadJuristicMembers() {
    const memberships = this.authService.getProjectMemberships();
    const projectId = (memberships && memberships.length > 0) ? memberships[0].project_id : null;

    if (projectId) {
      this.rest.getJuristicMembers(projectId).subscribe({
        next: (response) => {
          if (response.status === 'success' && response.data?.members) {
            this.juristicMembers = response.data.members;
          }
        },
        error: (error) => {
          console.error('Error loading juristic members:', error);
        }
      });
    }
  }

  loadIssue(id: string) {
    this.rest.getCommonIssueById(id)
      .subscribe({
        next: (response: any) => {
          if (response.status === 'success') {
            this.issue = response.data;
            this.imageUrls = this.issue?.image_urls || [];

            this.editForm.patchValue({
              location: this.issue?.location,
              priority: this.issue?.priority,
              issue_type: this.issue?.issue_type,
              status: this.issue?.status,
              assigned_to: this.issue?.assigned_to || '', // Initially load the name if it is a string
              notes: this.issue?.notes
            });

            // Check if assigned_to matches a member name, try to map to ID if possible
            // But usually assigned_to in DB might be a Name or ID. 
            // The backend update logic uses `assigned_to` as a value. 
            // If the UI dropdown uses IDs, we need to match it.
            // Let's assume for now current data has Name, so we might need to find the ID if we want to bind it to MatSelect with IDs.
            // However, common issue data 'assigned_to' seems to be a name string from the example logic "assigned_to = ?".
            // If I bind MatSelect with Value=ID, I need ID.

            // If the current value is a Name, and we want to select the option, we should find the member with that name.
            if (this.issue?.assigned_to && this.juristicMembers.length > 0) {
              const foundMember = this.juristicMembers.find(m => m.name === this.issue?.assigned_to);
              if (foundMember) {
                this.editForm.patchValue({ assigned_to: foundMember.id });
              } else {
                // If not found in members (maybe Deleted user?), we might want to just show it or keep it as is.
                // But MatSelect needs matching value.
              }
            }

          }
          this.isLoading.next(false);
        },
        error: (error) => {
          console.error('Error loading issue:', error);
          this.toast.error('ไม่สามารถโหลดข้อมูลแจ้งซ่อมได้');
          this.isLoading.next(false);
        }
      });
  }

  isKnownIssueType(type: string | undefined): boolean {
    if (!type) return false;
    return this.repairCategoryOptions.some(o => o.value === type);
  }

  onSubmit() {
    if (this.editForm.valid && this.issue) {
      const formValue = this.editForm.getRawValue(); // To get values even if disabled? No need for disabled.

      const updatePayload: any = {
        status: this.editForm.get('status')?.value,
        notes: this.editForm.get('notes')?.value
      };

      // Handle assigned_to
      const assignedToId = this.editForm.get('assigned_to')?.value;
      if (assignedToId) {
        // Find member name because backend might be storing name (based on personal issue logic). 
        // But for Common Issue backend example: `assigned_to = ?`. It stores whatever we send.
        // It's better to store Name for easy display, OR store ID if relational. 
        // Personal Repair stored Name. Common Issue likely same.
        const selectedMember = this.juristicMembers.find(m => m.id === assignedToId);
        if (selectedMember) {
          updatePayload.assigned_to = selectedMember.name;
        }
      } else {
        // If cleared
        updatePayload.assigned_to = null;
      }

      console.log('Update payload:', updatePayload);

      this.rest.updateCommonIssueStatus(this.issue.id, updatePayload)
        .subscribe({
          next: () => {
            this.toast.success('บันทึกการแก้ไขเรียบร้อยแล้ว');
            this.router.navigate(['/issue-common']);
          },
          error: (error) => {
            console.error('Error updating issue:', error);
            this.toast.error('เกิดข้อผิดพลาดในการแก้ไขรายการแจ้งซ่อม');
          }
        });
    }
  }

  onCancel() {
    this.router.navigate(['/issue-common']);
  }
}
