import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { UsuarioService } from 'src/app/services/usuario-service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonCard, IonCardContent, IonCardHeader, IonIcon, IonCardTitle, RouterLink]
})
export class InicioPage implements OnInit {

  constructor(private router: Router, private usuarioService: UsuarioService) { }

  ngOnInit() {
  }

  sair() {
    this.usuarioService.encerrarAutenticacao();
    this.router.navigate(['/login']);
  }

}
