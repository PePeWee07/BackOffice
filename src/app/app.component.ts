import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';
import { TokenStorageService } from './core/services/auth/token-storage.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Tailwick';

  constructor(private router: Router, private tokenStorage:TokenStorageService) {}

  ngOnInit() {
    // Escuchar cambios en el LocalStorage desde OTRAS pestañas/iframes
    window.addEventListener('storage', (event) => {
      if (event.key === 'token' && event.newValue) {
        console.log('Detectado login en otra ventana');
      }
    });
  }
}
