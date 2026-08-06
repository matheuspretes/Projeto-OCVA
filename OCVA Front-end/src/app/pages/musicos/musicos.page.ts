import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonBackButton, IonBadge, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Usuario } from 'src/app/models/usuario';
import { UsuarioService } from 'src/app/services/usuario-service';

@Component({
  selector: 'app-musicos',
  templateUrl: './musicos.page.html',
  styleUrls: ['./musicos.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonBackButton, IonBadge, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonTitle, IonToolbar]
})
export class MusicosPage implements OnInit {
  musicos: Usuario[] = [];
  usuarioAutenticado: Usuario | null = null;

  constructor(private usuarioService: UsuarioService) { }

  ngOnInit() {
    this.usuarioAutenticado = this.usuarioService.buscarAutenticacao();

    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        if (!this.usuarioAutenticado || (this.usuarioAutenticado.tipo !== 'maestro' && this.usuarioAutenticado.tipo !== 'diretoria')) {
          this.musicos = [];
          return;
        }

        this.musicos = usuarios.filter((usuario) => usuario.tipo === 'musico');
      },
      error: () => {
        this.musicos = [];
      }
    });
  }

}
