import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-anonymous-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './anonymous-layout.component.html',
  styleUrls: ['./anonymous-layout.component.scss']
})
export class AnonymousLayoutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
