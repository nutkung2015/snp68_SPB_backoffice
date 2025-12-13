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
import { RestService, PersonalRepair } from '../../../services/rest.service';

interface AttachmentUrl {
  url: string;
  public_id: string;
}

@Component({
  selector: 'app-edit-issue-personal',
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
  templateUrl: './edit-issue-personal.component.html',
  styleUrls: ['./edit-issue-personal.component.scss']
})
export class EditIssuePersonalComponent implements OnInit {
  isLoading = new BehaviorSubject<boolean>(true);
  isLoading$ = this.isLoading.asObservable();

  editForm: FormGroup;
  issue?: PersonalRepair;
  juristicMembers: any[] = [];

  // Image upload properties
  attachmentUrls: AttachmentUrl[] = [];
  selectedFile: File | null = null;
  previewUrl: string | null = null;
  uploadProgress = 0;

  statusOptions = [
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'in_progress', label: 'กำลังดำเนินการ' },
    { value: 'completed', label: 'เสร็จสิ้น' },
    { value: 'rejected', label: 'ปฏิเสธ' }
  ];

  priorityOptions = [
    { value: 'low', label: 'ต่ำ' },
    { value: 'medium', label: 'ปานกลาง' },
    { value: 'high', label: 'สูง' },
    { value: 'urgent', label: 'เร่งด่วน' }
  ];

  repairCategoryOptions = [
    { value: 'plumbing', label: 'ประปา' },
    { value: 'electrical', label: 'ไฟฟ้า' },
    { value: 'door_window', label: 'ประตู-หน้าต่าง' },
    { value: 'wall_ceiling', label: 'ผนัง-เพดาน' },
    { value: 'floor', label: 'พื้น' },
    { value: 'roof', label: 'หลังคา' },
    { value: 'air_conditioning', label: 'เครื่องปรับอากาศ' },
    { value: 'other', label: 'อื่นๆ' }
  ];

  repairAreaOptions = [
    { value: 'bedroom', label: 'ห้องนอน' },
    { value: 'bathroom', label: 'ห้องน้ำ' },
    { value: 'kitchen', label: 'ห้องครัว' },
    { value: 'living_room', label: 'ห้องนั่งเล่น' },
    { value: 'balcony', label: 'ระเบียง' },
    { value: 'common_area', label: 'พื้นที่ส่วนกลาง' },
    { value: 'other', label: 'อื่นๆ' }
  ];

  constructor(
    private fb: FormBuilder,
    private rest: RestService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.editForm = this.fb.group({
      repair_area: [{ value: '', disabled: true }, Validators.required],
      priority: ['', Validators.required],
      repair_category: [{ value: '', disabled: true }, Validators.required],
      status: ['', Validators.required],
      assigned_to: [''],
      notes: [''],
      estimated_cost: [0],
      actual_cost: [0]
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
    const projectId = localStorage.getItem('project_id');
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
    this.rest.getPersonalRepairById(id)
      .subscribe({
        next: (data: PersonalRepair) => {
          this.issue = data;

          // Load existing image if available
          if (this.issue.image_urls && this.issue.image_urls.length > 0) {
            this.previewUrl = this.issue.image_urls[0].url;
            this.attachmentUrls = this.issue.image_urls;
          }

          this.editForm.patchValue({
            repair_area: this.issue.repair_area,
            priority: this.issue.priority,
            repair_category: this.issue.repair_category,
            status: this.issue.status,
            assigned_to: this.issue.assigned_to,
            notes: this.issue.notes,
            estimated_cost: this.issue.estimated_cost,
            actual_cost: this.issue.actual_cost
          });
        },
        error: (error) => {
          console.error('Error loading issue:', error);
        },
        complete: () => {
          this.isLoading.next(false);
        }
      });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.previewUrl = null;
  }

  onSubmit() {
    if (this.editForm.valid && this.issue) {
      // Build payload - always include required fields
      const updatePayload: any = {
        status: this.editForm.get('status')?.value,
        repair_area: this.editForm.get('repair_area')?.value,
        priority: this.editForm.get('priority')?.value,
        repair_category: this.editForm.get('repair_category')?.value,
      };

      // Handle assigned_to - store both ID and name
      const assignedToId = this.editForm.get('assigned_to')?.value;
      if (assignedToId) {
        // Find the selected member to get their name
        const selectedMember = this.juristicMembers.find(m => m.id === assignedToId);
        if (selectedMember) {
          updatePayload.assigned_to = selectedMember.name; // Store name
          updatePayload.assigned_to_id = selectedMember.id; // Store ID
        }
      }

      // Optional fields
      const notes = this.editForm.get('notes')?.value;
      if (notes) {
        updatePayload.notes = notes;
      }

      // Include cost fields (can be 0)
      const estimatedCost = this.editForm.get('estimated_cost')?.value;
      if (estimatedCost !== null && estimatedCost !== undefined) {
        updatePayload.estimated_cost = estimatedCost;
      }

      const actualCost = this.editForm.get('actual_cost')?.value;
      if (actualCost !== null && actualCost !== undefined) {
        updatePayload.actual_cost = actualCost;
      }

      console.log('Update payload:', updatePayload); // Debug log

      this.rest.updatePersonalRepair(this.issue.id, updatePayload)
        .subscribe({
          next: () => {
            this.router.navigate(['/issue']);
          },
          error: (error) => {
            console.error('Error updating issue:', error);
          }
        });
    }
  }

  onCancel() {
    this.router.navigate(['/issue']);
  }
}
