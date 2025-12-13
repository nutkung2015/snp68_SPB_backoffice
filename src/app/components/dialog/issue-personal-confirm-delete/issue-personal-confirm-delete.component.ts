import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';

interface DialogData {
  toppic: string;
  cancel: string;
  confirm: string;
}

@Component({
  selector: 'app-issue-personal-confirm-delete',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, FlexLayoutModule],
  templateUrl: './issue-personal-confirm-delete.component.html',
  styleUrl: './issue-personal-confirm-delete.component.scss'
})
export class IssuePersonalConfirmDeleteComponent {
  constructor(
    public dialogRef: MatDialogRef<IssuePersonalConfirmDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
