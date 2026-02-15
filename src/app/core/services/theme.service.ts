import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'app-theme';

  get currentTheme(): string {
    return localStorage.getItem(this.storageKey) || 'light';
  }

  setTheme(theme: string) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.storageKey, theme);
  }

  initTheme() {
    const savedTheme = this.currentTheme;
    this.setTheme(savedTheme);
  }
}
