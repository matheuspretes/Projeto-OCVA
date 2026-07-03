import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonBackButton, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle, 
  IonCardContent, 
  IonChip,         
  IonLabel         
} from '@ionic/angular/standalone';
import { UsuarioService } from '../../services/usuario-service';

@Component({
  selector: 'app-eventos',
  templateUrl: './eventos.page.html',
  styleUrls: ['./eventos.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons, 
    IonBackButton, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardSubtitle, 
    IonCardContent,
    IonChip,         
    IonLabel         
  ]
})
export class EventosPage implements OnInit {

  eventos: any[] = [];
  usuarioAutenticado: any = null;

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit() {
    // 1. Recupera o usuário logado
    this.usuarioAutenticado = this.usuarioService.buscarAutenticacao();

    // 2. Busca a lista de eventos do localStorage
    const eventosTexto = localStorage.getItem('eventos') || '[]';
    const todosOsEventos = JSON.parse(eventosTexto);

    let eventosFiltrados = [];

    // 3. Filtro de permissões por perfil (Maestro/Diretoria vê tudo, Músicos filtram pelo cadastro)
    if (this.usuarioAutenticado && (this.usuarioAutenticado.tipo === 'maestro' || this.usuarioAutenticado.tipo === 'diretoria')) {
      eventosFiltrados = todosOsEventos;
    } else if (this.usuarioAutenticado) {
      const userLogin = this.usuarioAutenticado.login;
      const userId = this.usuarioAutenticado.id;

      eventosFiltrados = todosOsEventos.filter((e: any) => 
        (e.musicos || []).some((m: any) => m.login === userLogin || m.id === userId)
      );
    } else {
      eventosFiltrados = [];
    }

    // 4. Mapeia os nomes dos músicos escalados para exibição direta
    this.eventos = eventosFiltrados.map((evento: any) => {
      return {
        ...evento,
        nomesMusicos: (evento.musicos || []).map((m: any) => m.nome)
      };
    });

    console.log('Eventos carregados e filtrados com sucesso:', this.eventos);
  }
}