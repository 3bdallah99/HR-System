import { Injectable, signal, computed, inject } from '@angular/core';
import { TranslationService } from './translation.service';

export interface CurrencyOption {
  code: string;
  symbolAr: string;
  symbolEn: string;
  nameAr: string;
  nameEn: string;
  flag: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  { code: 'SAR', symbolAr: 'ريال', symbolEn: 'SAR', nameAr: 'ريال سعودي', nameEn: 'Saudi Riyal', flag: '🇸🇦' }
];

@Injectable({ providedIn: 'root' })
export class CurrencyService {
  private ts = inject(TranslationService);
  private readonly STORAGE_KEY = 'hr_currency_code';

  currentCode = signal<string>('SAR');
  currencies = signal<CurrencyOption[]>(SUPPORTED_CURRENCIES);

  currentCurrency = computed(() => SUPPORTED_CURRENCIES[0]);

  currencySymbol = computed(() => {
    return this.ts.isRtl() ? 'ريال' : 'SAR';
  });

  currencyName = computed(() => {
    return this.ts.isRtl() ? 'ريال سعودي' : 'Saudi Riyal';
  });

  constructor() {
    try {
      localStorage.setItem(this.STORAGE_KEY, 'SAR');
    } catch {
      // Ignore if localStorage is not accessible
    }
  }

  setCurrency(_code: string) {
    this.currentCode.set('SAR');
    try {
      localStorage.setItem(this.STORAGE_KEY, 'SAR');
    } catch {
      // Ignore if localStorage is not accessible
    }
  }

  format(amount: number | null | undefined, decimals = 2): string {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return `0.00 ${this.currencySymbol()}`;
    }
    const formatted = amount.toLocaleString(this.ts.isRtl() ? 'ar-SA' : 'en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
    return `${formatted} ${this.currencySymbol()}`;
  }
}
