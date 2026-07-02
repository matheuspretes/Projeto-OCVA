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
    // 1. Recupera o usuário que está logado no sistema
    this.usuarioAutenticado = this.usuarioService.buscarAutenticacao();

    // 2. Busca a lista de todos os ensaios cadastrados no localStorage
    const eventosTexto = localStorage.getItem('eventos') || '[]';
    const todosOsEventos = JSON.parse(eventosTexto);

    let eventosFiltrados = [];

    // 3. Filtro de segurança por perfil de usuário
    if (this.usuarioAutenticado && (this.usuarioAutenticado.tipo === 'maestro' || this.usuarioAutenticado.tipo === 'diretoria')) {
      // Maestro e Diretoria têm acesso total a todos os ensaios
      eventosFiltrados = todosOsEventos;
    } else if (this.usuarioAutenticado) {
      // Músicos só vêm os ensaios onde o e-mail/login deles foi escalado
      const userLogin = this.usuarioAutenticado.login;
      const userId = this.usuarioAutenticado.id;
      
      eventosFiltrados = todosOsEventos.filter((e: any) => 
        (e.musicos || []).some((m: any) => m.login === userLogin || m.id === userId)
      );
    } else {
      // Se não houver ninguém autenticado, por segurança a lista fica vazia
      eventosFiltrados = [];
    }

    // 4. Mapeamento para extrair os nomes dos músicos que já estão dentro do ensaio
    this.eventos = eventosFiltrados.map((evento: any) => {
      return {
        ...evento,
        // Cria o array de strings 'nomesMusicos' pegando direto a propriedade '.nome' de cada músico
        nomesMusicos: (evento.musicos || []).map((m: any) => m.nome)
      };
    });

    // Log para controle no console do navegador (F12)
    console.log('Eventos carregados e filtrados com sucesso:', this.eventos);
  }   

}
