import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private counter = 0;
  toasts = signal<Toast[]>([]);

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', title?: string) {
    const id = ++this.counter;
    const toast: Toast = { id, message, type, title };
    this.toasts.update(current => [...current, toast]);

    setTimeout(() => {
      this.remove(id);
    }, 4500);
  }

  success(message: string, title = 'Success') {
    this.show(message, 'success', title);
  }

  error(message: string, title = 'Error') {
    this.show(message, 'error', title);
  }

  warning(message: string, title = 'Warning') {
    this.show(message, 'warning', title);
  }

  info(message: string, title = 'Information') {
    this.show(message, 'info', title);
  }

  remove(id: number) {
    this.toasts.update(current => current.filter(t => t.id !== id));
  }
}
