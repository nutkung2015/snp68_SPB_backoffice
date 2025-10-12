import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { FlexLayoutModule } from '@angular/flex-layout';

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, MatIconModule, FlexLayoutModule],
  template: `
    <div
      class="header"
      fxLayout="row"
      fxLayoutAlign="space-between center"
      style="padding: 20px 24px 20px 24px; background: white;"
    >
      <div
        class="toppic"
        style="
          display: flex;
          flex-direction: row;
          justify-content: start;
          align-items: start;
          gap: 8px;
        "
      >
        <div class="fa-icon-content" fxLayoutAlign="center center">
          <img 
            [src]="iconSrc" 
            alt="" 
            srcset=""
            [style.filter]="iconColor ? 'brightness(0) saturate(100%) ' + iconColor : ''"
          />
        </div>
        <div
          style="
            display: flex;
            flex-direction: column;
            justify-content: start;
            align-items: start;
          "
        >
          <span class="text-toppic">
            {{ title }}
          </span>
          <span class="text-sub-toppic">
            {{ subtitle }}
          </span>
        </div>
      </div>
      <ng-content></ng-content>
    </div>
  `,
  styleUrls: ['./page-header.component.scss'],
})
export class PageHeaderComponent {
  @Input() iconSrc: string = '';
  @Input() title: string = '';
  @Input() subtitle: string = '';
  @Input() iconColor: string = ''; // สำหรับกำหนดสี SVG
}
