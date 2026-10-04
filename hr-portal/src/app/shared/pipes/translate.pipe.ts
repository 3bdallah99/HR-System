import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private ts = inject(TranslationService);
  
  transform(key: string): string {
    const keys = key.split('.');
    let result: any = this.ts.t();
    for (const k of keys) {
      result = result?.[k];
    }
    return result || key;
  }
}
