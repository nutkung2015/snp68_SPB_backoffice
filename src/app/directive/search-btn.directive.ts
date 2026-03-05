import { Directive, ElementRef, OnInit, Renderer2, RendererStyleFlags2 } from '@angular/core';

@Directive({
  selector: '[appSearchBtn]',
  standalone: true
})
export class SearchBtnDirective implements OnInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.addClass(this.el.nativeElement, 'search-btn');

    const flags = RendererStyleFlags2.Important;
    this.renderer.setStyle(this.el.nativeElement, 'border', '1px solid #2084fc', flags);
    this.renderer.setStyle(this.el.nativeElement, 'border-radius', '8px', flags);
    this.renderer.setStyle(this.el.nativeElement, 'color', '#2084fc', flags);
    this.renderer.setStyle(this.el.nativeElement, 'height', '40px', flags);
    this.renderer.setStyle(this.el.nativeElement, 'font-weight', '500', flags);
    this.renderer.setStyle(this.el.nativeElement, 'display', 'inline-flex', flags);
    this.renderer.setStyle(this.el.nativeElement, 'align-items', 'center', flags);
    this.renderer.setStyle(this.el.nativeElement, 'justify-content', 'center', flags);
    this.renderer.setStyle(this.el.nativeElement, 'padding', '0 16px', flags);
    this.renderer.setStyle(this.el.nativeElement, 'background', 'transparent', flags);
  }

  ngOnInit() {
    setTimeout(() => {
      const labelSpan = this.el.nativeElement.querySelector('.mdc-button__label');
      const container = labelSpan || this.el.nativeElement;

      container.innerHTML = `
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 5px;">
          <mat-icon class="mat-icon notranslate material-icons mat-ligature-font mat-icon-no-color" style="width: 14px; height: 14px; font-size: 14px;">search</mat-icon>
          <span style="font-family: 'LINE Seed Sans TH', sans-serif;">ค้นหา</span>
        </div>
      `;
    });
  }
}
