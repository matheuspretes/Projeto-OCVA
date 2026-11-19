import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuButton, IonSplitPane, MenuController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addCircleOutline, arrowBackOutline, bookOutline, calendarOutline, createOutline, documentTextOutline,
  homeOutline, keyOutline, logOutOutline, musicalNoteOutline, musicalNotesOutline, peopleOutline, personOutline
} from 'ionicons/icons';
import { UsuarioService } from 'src/app/services/usuario-service';

type ItemMenu = {
  rota: string;
  rotulo: string;
  icone: string;
  somente?: string[]; // tipos de usuário que veem o item (vazio = todos)
};

let contador = 0;

/**
 * Barra lateral + cabeçalho usados em todas as páginas internas
 * (mesmo visual da página de Eventos).
 *
 * Uso:
 *   <app-layout titulo="Ensaios" icone="musical-note-outline">
 *     <ion-button acoes class="topbar-button">Novo ensaio</ion-button>
 *     ...conteúdo da página...
 *   </app-layout>
 */
@Component({
  selector: 'app-layout',
  templateUrl: './app-layout.component.html',
  styleUrls: ['./app-layout.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, IonSplitPane, IonMenu, IonMenuButton, IonContent, IonList, IonItem, IonLabel, IonIcon]
})
export class AppLayoutComponent {
  @Input() titulo = '';
  @Input() icone = 'musical-notes-outline';
  // Rota do menu que fica destacada mesmo fora dela (ex.: "/ensaios" no cadastro de ensaio)
  @Input() secao = '';

  readonly menuId = `menu-${++contador}`;
  readonly contentId = `conteudo-${contador}`;

  readonly itens: ItemMenu[] = [
    { rota: '/inicio', rotulo: 'Início', icone: 'home-outline' },
    { rota: '/ensaios', rotulo: 'Ensaios', icone: 'musical-note-outline' },
    { rota: '/marcar-encontro', rotulo: 'Marcar Encontro', icone: 'add-circle-outline', somente: ['maestro', 'diretoria'] },
    { rota: '/eventos', rotulo: 'Eventos', icone: 'calendar-outline' },
    { rota: '/musicos', rotulo: 'Músicos', icone: 'people-outline' },
    { rota: '/partituras', rotulo: 'Partituras', icone: 'document-text-outline' },
    { rota: '/codigos-acesso', rotulo: 'Códigos de Acesso', icone: 'key-outline' },
    { rota: '/dados', rotulo: 'Meus Dados', icone: 'person-outline' },
  ];

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private menuController: MenuController
  ) {
    addIcons({
      addCircleOutline, arrowBackOutline, bookOutline, calendarOutline, createOutline, documentTextOutline,
      homeOutline, keyOutline, logOutOutline, musicalNoteOutline, musicalNotesOutline, peopleOutline, personOutline
    });
  }

  get tipoUsuario(): string {
    return (this.usuarioService.buscarAutenticacao()?.tipo || '').trim().toLowerCase();
  }

  get tipoUsuarioLabel(): string {
    const rotulos: Record<string, string> = {
      musico: 'Músico',
      maestro: 'Maestro',
      diretoria: 'Diretoria',
      secretaria: 'Secretaria'
    };
    return rotulos[this.tipoUsuario] || 'Usuário';
  }

  get itensVisiveis(): ItemMenu[] {
    return this.itens.filter((item) => !item.somente || item.somente.includes(this.tipoUsuario));
  }

  async sair() {
    await this.menuController.close(this.menuId);
    this.usuarioService.encerrarAutenticacao();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
