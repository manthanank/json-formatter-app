import { Component, signal, effect, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TrackService } from './services/track.service';
import { Visit } from './models/visit.model';

@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'json-formatter-app';

  jsonInput = signal<string>('');
  formattedJson = signal<string>('');
  errorMessage = signal<string>('');
  isDarkMode = signal<boolean>(this.getInitialTheme());

  private trackService = inject(TrackService);

  // Visitor count state
  visitorCount = signal<number>(0);
  isVisitorCountLoading = signal<boolean>(false);
  visitorCountError = signal<string | null>(null);

  constructor() {
    effect(() => {
      this.applyTheme(this.isDarkMode());
    });
  }

  ngOnInit() {
    this.trackVisit();
  }

  private trackVisit(): void {
    this.isVisitorCountLoading.set(true);
    this.visitorCountError.set(null);

    this.trackService.trackProjectVisit(this.title).subscribe({
      next: (response: Visit) => {
        this.visitorCount.set(response.uniqueVisitors);
        this.isVisitorCountLoading.set(false);
      },
      error: (err: Error) => {
        console.error('Failed to track visit:', err);
        this.visitorCountError.set('Failed to load visitor count');
        this.isVisitorCountLoading.set(false);
      },
    });
  }

  formatJson() {
    try {
      const parsed = JSON.parse(this.jsonInput());
      this.formattedJson.set(JSON.stringify(parsed, null, 2));
      this.errorMessage.set('');
    } catch (error) {
      this.formattedJson.set('');
      this.errorMessage.set('Invalid JSON format!');
    }
  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.formattedJson());
  }

  updateJsonInput(value: string) {
    this.jsonInput.set(value);
  }

  toggleTheme() {
    this.isDarkMode.update((current) => !current);
    localStorage.setItem('darkMode', this.isDarkMode().toString());
  }

  private getInitialTheme(): boolean {
    const savedTheme = localStorage.getItem('darkMode');
    // If user has explicitly set a theme, use it
    if (savedTheme !== null) {
      return savedTheme === 'true';
    }
    // Otherwise, use system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private applyTheme(isDark: boolean): void {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}
