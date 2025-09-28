import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  stats = [
    { title: 'Total Users', value: '1,234', change: '+12%', trend: 'up' },
    { title: 'Total Orders', value: '5,678', change: '+8%', trend: 'up' },
    { title: 'Revenue', value: '$45,678', change: '+15%', trend: 'up' },
    { title: 'Active Products', value: '234', change: '-2%', trend: 'down' }
  ];

  recentOrders = [
    { id: '#12345', customer: 'John Doe', amount: '$299.99', status: 'Completed' },
    { id: '#12346', customer: 'Jane Smith', amount: '$149.99', status: 'Pending' },
    { id: '#12347', customer: 'Bob Johnson', amount: '$89.99', status: 'Processing' },
    { id: '#12348', customer: 'Alice Brown', amount: '$199.99', status: 'Completed' }
  ];

  constructor() { }

  ngOnInit(): void {
  }
}
