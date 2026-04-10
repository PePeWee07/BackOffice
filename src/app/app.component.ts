import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'UCACUE';

  constructor() {}

  ngOnInit() {
    // Escuchar cambios en el LocalStorage desde OTRAS pestañas/iframes
    window.addEventListener('storage', (event) => {
      if (event.key === 'token' && event.newValue) {
        console.log('Detectado login en otra ventana');
      }
    });
  }
}
