import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar, IonFooter } from '@ionic/angular/standalone';
import { UsuarioService } from 'src/app/services/usuario-service';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, IonFooter, IonButton, IonButtons, IonIcon, IonCard, IonCardContent, IonCardHeader, IonCardTitle, CommonModule, FormsModule, RouterLink]
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
