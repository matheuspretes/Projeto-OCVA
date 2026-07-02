import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton } from '@ionic/angular/standalone';
import { Ensaio } from 'src/app/models/ensaio';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { UsuarioService } from 'src/app/services/usuario-service';
import { IonList, IonItem, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { Evento } from 'src/app/models/evento';
import { EventosService } from 'src/app/services/eventos-service';

@Component({
  selector: 'app-eventos',
  templateUrl: './eventos.page.html',
  styleUrls: ['./eventos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, CommonModule, FormsModule, IonList, IonItem, IonCard, IonCardHeader, IonCardTitle, IonCardContent, RouterLink]
})
export class EventosPage implements OnInit {

  eventos: Evento[] = [];
  usuarioAutenticado: any = null;

  constructor(
    private eventosService: EventosService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit() {
    this.usuarioAutenticado = this.usuarioService.buscarAutenticacao();
    const todos = this.eventosService.listar() || [];

    if (this.usuarioAutenticado && (this.usuarioAutenticado.tipo === 'maestro' || this.usuarioAutenticado.tipo === 'diretoria')) {
      this.eventos = todos;
    } else if (this.usuarioAutenticado) {
      const userId = this.usuarioAutenticado.id;
      this.eventos = todos.filter((e: any) => (e.musicos || []).some((m: any) => m.id === userId));
    } else {
      this.eventos = [];
    }
  }

  getMusicosNomes(evento: Evento): string {
    const nomes = (evento.musicos || []).map((m: any) => m.nome || '');
    return nomes.filter(n => !!n).join(', ');
  }   

}
