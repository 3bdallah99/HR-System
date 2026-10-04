import { Injectable, signal, computed, effect } from '@angular/core';
import { en } from '../i18n/en';
import { ar } from '../i18n/ar';

export type Lang = 'en' | 'ar';
export type TranslationKeys = typeof en;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private translations: Record<Lang, TranslationKeys> = { en, ar };
  
  currentLang = signal<Lang>((localStorage.getItem('hr_lang') as Lang) || 'en');
  isRtl = computed(() => this.currentLang() === 'ar');
  t = computed<any>(() => this.translations[this.currentLang()]);
  
  constructor() {
    effect(() => {
      const lang = this.currentLang();
      localStorage.setItem('hr_lang', lang);
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      document.body.style.fontFamily = lang === 'ar' 
        ? "'Cairo', 'Segoe UI', system-ui, sans-serif" 
        : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    });
  }
  
  switchLang(lang: Lang) {
    this.currentLang.set(lang);
  }
  
  toggleLang() {
    this.currentLang.update(l => l === 'en' ? 'ar' : 'en');
  }
}
