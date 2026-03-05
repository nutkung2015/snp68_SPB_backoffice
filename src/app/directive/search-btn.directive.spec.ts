import { SearchBtnDirective } from './search-btn.directive';

describe('SearchBtnDirective', () => {
  it('should create an instance', () => {
    const directive = new SearchBtnDirective({ nativeElement: {} } as any, { addClass: () => { } } as any);
    expect(directive).toBeTruthy();
  });
});
