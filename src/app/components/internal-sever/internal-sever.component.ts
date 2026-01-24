import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-internal-sever',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './internal-sever.component.html',
  styleUrl: './internal-sever.component.scss'
})
export class InternalSeverComponent {
  rayId: string = '6d61540c9ef740cf';
  timestamp: string = '2022-03-31 07:46:48 UTC';
  clientIp: string = '82.169.152.13';
  hostName: string = '365.svddn.eu';

  constructor() { }

  reload() {
    window.location.reload();
  }
}
