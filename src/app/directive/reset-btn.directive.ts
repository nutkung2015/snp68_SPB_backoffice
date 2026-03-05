import { Directive, ElementRef, HostListener, OnInit, Renderer2, RendererStyleFlags2 } from '@angular/core';

@Directive({
  selector: '[appResetBtn]',
  standalone: true
})
export class ResetBtnDirective implements OnInit {
  constructor(private el: ElementRef, private renderer: Renderer2) {
    this.renderer.addClass(this.el.nativeElement, 'reset-btn');

    const flags = RendererStyleFlags2.Important;
    this.renderer.setStyle(this.el.nativeElement, 'border', '1px solid #23272d', flags);
    this.renderer.setStyle(this.el.nativeElement, 'border-radius', '8px', flags);
    this.renderer.setStyle(this.el.nativeElement, 'color', '#23272d', flags);
    this.renderer.setStyle(this.el.nativeElement, 'height', '40px', flags);
    this.renderer.setStyle(this.el.nativeElement, 'font-weight', '500', flags);
    this.renderer.setStyle(this.el.nativeElement, 'display', 'inline-flex', flags);
    this.renderer.setStyle(this.el.nativeElement, 'align-items', 'center', flags);
    this.renderer.setStyle(this.el.nativeElement, 'justify-content', 'center', flags);
    this.renderer.setStyle(this.el.nativeElement, 'padding', '0 16px', flags);
    this.renderer.setStyle(this.el.nativeElement, 'background', 'transparent', flags);
  }

  @HostListener('mouseenter') onMouseEnter() {
    this.renderer.setStyle(this.el.nativeElement, 'background', 'rgba(35, 39, 45, 0.04)', RendererStyleFlags2.Important);
  }

  @HostListener('mouseleave') onMouseLeave() {
    this.renderer.setStyle(this.el.nativeElement, 'background', 'transparent', RendererStyleFlags2.Important);
  }

  ngOnInit() {
    setTimeout(() => {
      const labelSpan = this.el.nativeElement.querySelector('.mdc-button__label');
      const container = labelSpan || this.el.nativeElement;

      container.innerHTML = `
        <div style="display: flex; flex-direction: row; align-items: center; justify-content: center; gap: 5px;">
          <span style="font-family: 'LINE Seed Sans TH', sans-serif;">ล้างค่า</span>
        </div>
      `;
    });
  }
}
