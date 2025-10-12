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
  selector: 'app-announcement-confirm-delete',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, FlexLayoutModule],
  templateUrl: './announcement-confirm-delete.component.html',
  styleUrl: './announcement-confirm-delete.component.scss',
})
export class AnnouncementConfirmDeleteComponent {
  constructor(
    public dialogRef: MatDialogRef<AnnouncementConfirmDeleteComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
