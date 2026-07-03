import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonToolbar } from '@ionic/angular/standalone';
import { TipoUsuario } from 'src/app/constantes/tipo-usuario';
import { UsuarioService } from 'src/app/services/usuario-service';

type CardAction = {
  title: string;
  description: string;
  route?: string;
  kind: 'link' | 'button';
  types: TipoUsuario[];
};

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonHeader, IonToolbar, IonButtons, IonButton, IonCard, IonCardContent, IonCardHeader, IonIcon, IonCardTitle, RouterLink]
})
export class InicioPage implements OnInit {
  tipoUsuario: TipoUsuario | null = null;
  visibleCards: CardAction[] = [];

  public nomeUsuario: string = "";

  private readonly cards: CardAction[] = [
    {
      title: 'Ensaios',
      description: 'Acesse seus ensaios cadastrados',
      route: '/ensaios',
      kind: 'link',
      types: ['musico', 'maestro', 'diretoria'],
    },
    {
      title: 'Registrar ensaio',
      description: 'Registre um ensaio que ocorreu',
      route: '/criar-ensaio',
      kind: 'link',
      types: ['maestro', 'diretoria'],
    },
    {
      title: 'Dados do usuário',
      description: 'Revise e atualize suas informações',
      route: '/dados',
      kind: 'link',
      types: ['nulo'],
    },
    {
      title: 'Eventos',
      description: 'Confira eventos registrados',
      route: '/eventos',
      kind: 'link',
      types: ['diretoria','maestro','musico'],
    },
    {
      title: 'Registrar evento',
      description: 'Registre eventos futuros',
      route: '/criar-evento',
      kind: 'link',
      types: ['diretoria'],
    },
    {
      title: 'Músicos',
      description: 'Confira os músicos registrados',
      route: '/musicos',
      kind: 'link',
      types: ['nulo'],
    },
  ];


  constructor(private router: Router, private usuarioService: UsuarioService) { }

  ngOnInit() {
    // 1. Buscamos a string do localStorage
    const usuarioLogadoRaw = localStorage.getItem('usuarioAutenticado');

    if (usuarioLogadoRaw) {
      try {
        // 2. Fazemos o PARSE apenas UMA vez com segurança
        const usuarioAutenticado = JSON.parse(usuarioLogadoRaw);
        
        // 3. Pegamos as propriedades do objeto convertido
        this.nomeUsuario = usuarioAutenticado.nome || usuarioAutenticado.login || '';
        this.tipoUsuario = usuarioAutenticado?.tipo ?? null;

        // 4. Se ainda precisar alimentar o array 'nomes', faça aqui dentro com segurança:
      } catch (e) {
        console.error('O formato do utilizador no localStorage está inválido:', e);
        this.nomeUsuario = '';
        this.tipoUsuario = null;
        localStorage.removeItem('usuarioAutenticado'); // Limpa a chave errada
      }
    }

    // 5. Filtra os cards baseando-se no tipo do usuário recuperado
    this.visibleCards = this.tipoUsuario
      ? this.cards.filter((card) => card.types.includes(this.tipoUsuario as TipoUsuario))
      : [];
  }

  sair() {
    this.usuarioService.encerrarAutenticacao();
    this.router.navigate(['/login']);
  }
}
