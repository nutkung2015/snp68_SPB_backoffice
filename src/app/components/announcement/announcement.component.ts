import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-announcement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './announcement.component.html',
  styleUrl: './announcement.component.scss'
})
export class AnnouncementComponent implements OnInit {
  searchTerm = '';
  selectedRecipient = '';
  recipients = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'all', label: 'ลูกบ้านทุกคน' },
    { value: 'committee', label: 'กรรมการหมู่บ้าน' },
    { value: 'security', label: 'รปภ.' }
  ];

  announcements = [
    {
      id: 1,
      title: 'แจ้งเตือนการปรับปรุงถนน',
      content: 'Lorem ipsum sit in egestas odio ipsum mauris viverra tempor eget...',
      recipient: 'ลูกบ้านทุกคน',
      postDate: '11/25/2025',
      hasAttachment: true,
      attachmentName: 'road_improvement.pdf'
    },
    {
      id: 2,
      title: 'แจ้งเตือนการปรับปรุงถนน',
      content: 'Lorem ipsum sit in egestas odio ipsum mauris viverra tempor eget...',
      recipient: 'ลูกบ้านทุกคน',
      postDate: '11/25/2025',
      hasAttachment: true,
      attachmentName: 'road_improvement.pdf'
    },
    {
      id: 3,
      title: 'แจ้งเตือนการปรับปรุงถนน',
      content: 'Lorem ipsum sit in egestas odio ipsum mauris viverra tempor eget...',
      recipient: 'ลูกบ้านทุกคน',
      postDate: '11/25/2025',
      hasAttachment: true,
      attachmentName: 'road_improvement.pdf'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  onSearch(): void {
    // Implement search functionality
    console.log('Searching for:', this.searchTerm);
  }

  onReset(): void {
    this.searchTerm = '';
    this.selectedRecipient = '';
  }

  onCreateNew(): void {
    // Implement create new announcement
    console.log('Creating new announcement');
  }

  viewAttachment(announcement: any): void {
    // Implement view attachment
    console.log('Viewing attachment:', announcement.attachmentName);
  }

  viewDetails(announcement: any): void {
    // Implement view details
    console.log('Viewing details for:', announcement.title);
  }
}
