import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/angular/standalone';
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
  imports: [CommonModule, IonContent, IonHeader, IonTitle, IonToolbar, IonButtons, IonButton, IonCard, IonCardContent, IonCardHeader, IonIcon, IonCardTitle, RouterLink]
})
export class InicioPage implements OnInit {
  tipoUsuario: TipoUsuario | null = null;
  visibleCards: CardAction[] = [];

  private readonly cards: CardAction[] = [
    {
      title: 'Ensaios',
      description: 'Acesse seus ensaios cadastrados',
      route: '/ensaios',
      kind: 'link',
      types: ['musico', 'secretaria', 'maestro', 'diretoria'],
    },
    {
      title: 'Registrar ensaio',
      description: 'Registre um ensaio que ocorreu',
      route: '/criar-ensaio',
      kind: 'link',
      types: ['secretaria', 'maestro', 'diretoria'],
    },
    {
      title: 'Dados do usuário',
      description: 'Revise e atualize suas informações',
      route: '/dados',
      kind: 'link',
      types: ['nulo'],
    },
    {
      title: 'Sair da conta',
      description: 'Finalize a sessão atual',
      kind: 'button',
      types: ['nulo'],
    },
  ];

  constructor(private router: Router, private usuarioService: UsuarioService) { }

  ngOnInit() {
    const usuario = JSON.parse(localStorage.getItem('usuarioAutenticado') || 'null');
    this.tipoUsuario = usuario?.tipo ?? null;
    this.visibleCards = this.tipoUsuario
      ? this.cards.filter((card) => card.types.includes(this.tipoUsuario as TipoUsuario))
      : [];
  }

  sair() {
    this.usuarioService.encerrarAutenticacao();
    this.router.navigate(['/login']);
  }

}
