import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastContainerComponent } from './shared/ui/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastContainerComponent],
  template: `
    <router-outlet />
    <app-toast-container />
  `
})
export class AppComponent implements OnInit {
  ngOnInit() {
    if (typeof window !== 'undefined') {
      window.addEventListener('wheel', () => {
        const active = document.activeElement as HTMLInputElement | null;
        if (active && active.tagName === 'INPUT' && active.type === 'number') {
          active.blur();
        }
      }, { passive: true });
    }
  }
}
