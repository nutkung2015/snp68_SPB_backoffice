import { ResetBtnDirective } from './reset-btn.directive';

describe('ResetBtnDirective', () => {
  it('should create an instance', () => {
    const directive = new ResetBtnDirective({ nativeElement: {} } as any, { addClass: () => { } } as any);
    expect(directive).toBeTruthy();
  });
});
