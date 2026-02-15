import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'marvick-personality-assessment';

  isDark = false;

  constructor(private themeService: ThemeService) {
    this.themeService.initTheme();
    this.isDark = this.themeService.currentTheme === 'dark';
  }

  toggleTheme(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.isDark = checked;
    this.themeService.setTheme(checked ? 'dark' : 'light');
  }

}
