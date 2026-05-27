import { Component } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { UsuarioService } from './services/usuario-service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent {
  constructor(private usuarioService: UsuarioService) {
    // Clear any authenticated user on app startup so login is required each run
  }
}
