import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuButton, IonSplitPane, MenuController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addCircleOutline, archiveOutline, arrowBackOutline, bookOutline, calendarOutline, chevronDownOutline, createOutline, documentTextOutline,
  homeOutline, keyOutline, logOutOutline, musicalNoteOutline, musicalNotesOutline, peopleOutline, personOutline
} from 'ionicons/icons';
import { UsuarioService } from 'src/app/services/usuario-service';

type ItemMenu = {
  rota: string;
  rotulo: string;
  icone: string;
  somente?: string[]; // tipos de usuário que veem o item (vazio = todos)
};

// Páginas que ficam dentro do item "Arquivo"
const ROTAS_ARQUIVO = ['/encontros', '/ensaios', '/eventos'];

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
export class AppLayoutComponent implements OnInit {
  @Input() titulo = '';
  @Input() icone = 'musical-notes-outline';
  // Rota do menu que fica destacada mesmo fora dela (ex.: "/encontros" no cadastro de ensaio)
  @Input() secao = '';

  readonly menuId = `menu-${++contador}`;
  readonly contentId = `conteudo-${contador}`;

  // Itens antes do "Arquivo"
  readonly itensTopo: ItemMenu[] = [
    { rota: '/inicio', rotulo: 'Início', icone: 'home-outline' },
    { rota: '/marcar-encontro', rotulo: 'Marcar Encontro', icone: 'add-circle-outline', somente: ['maestro', 'diretoria'] },
    { rota: '/marcar-evento', rotulo: 'Marcar Evento', icone: 'add-circle-outline', somente: ['maestro', 'diretoria'] },
  ];

  // Opções do "Arquivo": encontros (inclui os ensaios) e eventos
  readonly itensArquivo: ItemMenu[] = [
    { rota: '/encontros', rotulo: 'Encontros', icone: 'musical-note-outline' },
    { rota: '/eventos', rotulo: 'Eventos', icone: 'calendar-outline' },
  ];

  // Itens depois do "Arquivo"
  readonly itensBase: ItemMenu[] = [
    { rota: '/musicos', rotulo: 'Músicos', icone: 'people-outline' },
    { rota: '/partituras', rotulo: 'Partituras', icone: 'document-text-outline' },
    { rota: '/codigos-acesso', rotulo: 'Códigos de Acesso', icone: 'key-outline' },
    { rota: '/dados', rotulo: 'Meus Dados', icone: 'person-outline' },
  ];

  arquivoAberto = false;

  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private menuController: MenuController
  ) {
    addIcons({
      addCircleOutline, archiveOutline, arrowBackOutline, bookOutline, calendarOutline, chevronDownOutline, createOutline, documentTextOutline,
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

  visiveis(itens: ItemMenu[]): ItemMenu[] {
    return itens.filter((item) => !item.somente || item.somente.includes(this.tipoUsuario));
  }

  // O "Arquivo" fica destacado (e aberto) quando a página atual está dentro dele
  get emArquivo(): boolean {
    const atual = this.secao || this.router.url;
    return ROTAS_ARQUIVO.some((rota) => atual === rota || atual.startsWith(rota + '/') || atual.startsWith(rota + '?'));
  }

  alternarArquivo() {
    this.arquivoAberto = !this.arquivoAberto;
  }

  ngOnInit() {
    this.arquivoAberto = this.emArquivo;
  }

  async sair() {
    await this.menuController.close(this.menuId);
    this.usuarioService.encerrarAutenticacao();
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
