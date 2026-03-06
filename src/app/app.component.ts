import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'Tailwick';

  constructor(private router: Router) {}

  ngOnInit() {
    // Escuchar cambios en el LocalStorage desde OTRAS pestañas/iframes
    window.addEventListener('storage', (event) => {
      // Si el evento dice que se guardó el 'token' (nombre que usa en TokenStorageService)
      if (event.key === 'token' && event.newValue) {
        console.log('Detectado login en otra ventana, redirigiendo...');
        this.router.navigate(['/']);
      }

      // Si cierras sesión en una, que se cierren todas
      if (event.key === 'token' && !event.newValue) {
        this.router.navigate(['/login']);
      }
    });
  }
}
