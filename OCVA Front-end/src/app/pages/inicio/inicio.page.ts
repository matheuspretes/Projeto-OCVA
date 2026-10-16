import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonCol, IonContent, IonGrid, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonRow, IonSplitPane } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { forkJoin } from 'rxjs';
import { TipoUsuario } from 'src/app/constantes/tipo-usuario';
import { Evento } from 'src/app/models/evento';
import { Ensaio } from 'src/app/models/ensaio';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { EventosService } from 'src/app/services/eventos-service';
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
  imports: [CommonModule, RouterLink, RouterLinkActive, IonContent, IonIcon, IonSplitPane, IonMenu, IonList, IonItem, IonLabel, IonGrid, IonRow, IonCol]
})
export class InicioPage implements OnInit {
  tipoUsuario: TipoUsuario | null = null;
  visibleCards: CardAction[] = [];
  proximoEnsaio: Ensaio | null = null;
  proximoEvento: Evento | null = null;
  carregandoDados = true;
  salvandoPresenca = false;
  minhaResposta: boolean | null = null;

  public nomeUsuario: string = "";
  public tipoUsuarioLabel = 'Usuário';
  

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
      types: ['diretoria'],
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
      types: ['maestro'],
    },
    {
      title: 'Músicos',
      description: 'Consulte e gerencie músicos e maestros',
      route: '/musicos',
      kind: 'link',
      types: ['maestro', 'diretoria'],
    },
    {
      title: 'Códigos de Acesso',
      description: 'Gere e gerencie códigos para usuários',
      route: '/codigos-acesso',
      kind: 'link',
      types: ['diretoria'],
    },
  ];


  constructor(
    private navController: NavController,
    private usuarioService: UsuarioService,
    private ensaiosService: EnsaiosService,
    private eventosService: EventosService
  ) { }

  ngOnInit() {
    const usuarioAutenticado = this.usuarioService.buscarAutenticacao();
    this.nomeUsuario = usuarioAutenticado.nome || usuarioAutenticado.login || '';
    this.tipoUsuario = typeof usuarioAutenticado.tipo === 'string'
      ? usuarioAutenticado.tipo.trim().toLowerCase() as TipoUsuario
      : null;
    this.tipoUsuarioLabel = this.obterRotuloTipo(this.tipoUsuario);
    this.visibleCards = this.tipoUsuario
      ? this.cards.filter((card) => card.types.includes(this.tipoUsuario as TipoUsuario))
      : [];

    forkJoin({
      ensaios: this.ensaiosService.listar(),
      eventos: this.eventosService.listar()
    }).subscribe({
      next: ({ ensaios, eventos }) => {
        this.proximoEnsaio = this.selecionarEnsaio(ensaios, usuarioAutenticado);
        this.proximoEvento = this.selecionarEvento(eventos, usuarioAutenticado);
        this.atualizarMinhaResposta();
        this.carregandoDados = false;
      },
      error: (erro) => {
        console.error('Não foi possível carregar os dados da página inicial.', erro);
        this.carregandoDados = false;
      }
    });
  }

  responderPresenca(presente: boolean) {
    const usuario = this.usuarioService.buscarAutenticacao();
    const ensaioId = this.proximoEnsaio?.id;
    const musicoId = usuario.id;

    if (!ensaioId || !musicoId || this.salvandoPresenca) {
      return;
    }

    this.salvandoPresenca = true;
    const requisicao = this.minhaResposta === presente
      ? this.ensaiosService.removerPresenca(ensaioId, musicoId)
      : this.ensaiosService.marcarPresenca(ensaioId, musicoId, presente);

    requisicao.subscribe({
      next: (ensaioAtualizado) => {
        this.proximoEnsaio = ensaioAtualizado;
        this.minhaResposta = this.minhaResposta === presente ? null : presente;
        this.salvandoPresenca = false;
      },
      error: (erro) => {
        console.error('Não foi possível registrar a resposta de presença.', erro);
        this.salvandoPresenca = false;
      }
    });
  }

  podeResponderPresenca(): boolean {
    const usuario = this.usuarioService.buscarAutenticacao();
    return !!this.proximoEnsaio
      && !!usuario.id;
  }

  formatarDia(data: string | undefined): string {
    const dataConvertida = this.converterData(data);
    return dataConvertida ? String(dataConvertida.getDate()).padStart(2, '0') : '--';
  }

  formatarDiaDaSemana(data: string | undefined): string {
    const dataConvertida = this.converterData(data);
    return dataConvertida
      ? ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][dataConvertida.getDay()]
      : 'Data não informada';
  }

  formatarMesAno(data: string | undefined): string {
    const dataConvertida = this.converterData(data);
    return dataConvertida
      ? `${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][dataConvertida.getMonth()]} ${dataConvertida.getFullYear()}`
      : '';
  }

  private selecionarEnsaio(ensaios: Ensaio[], usuario: any): Ensaio | null {
    const ensaiosVisiveis = this.usuarioPodeVerTudo(usuario)
      ? ensaios
      : ensaios.filter((ensaio) => (ensaio.musicos || []).some((musico: any) => this.mesmoUsuario(musico, usuario)));

    return this.ordenarPorData(ensaiosVisiveis)[0] || null;
  }

  private selecionarEvento(eventos: Evento[], usuario: any): Evento | null {
    const eventosVisiveis = this.usuarioPodeVerTudo(usuario)
      ? eventos
      : eventos.filter((evento) => (evento.musicos || []).some((musico: any) => this.mesmoUsuario(musico, usuario)));

    return this.ordenarPorData(eventosVisiveis)[0] || null;
  }

  private ordenarPorData<T extends { data: string }>(registros: T[]): T[] {
    return [...registros].sort((primeiro, segundo) => this.dataEmNumero(primeiro.data) - this.dataEmNumero(segundo.data));
  }

  private dataEmNumero(data: string | undefined): number {
    return this.converterData(data)?.getTime() || Number.MAX_SAFE_INTEGER;
  }

  private converterData(data: string | undefined): Date | null {
    if (!data) {
      return null;
    }

    const dataSomente = data.slice(0, 10);
    const partes = dataSomente.split('-').map(Number);
    if (partes.length !== 3 || partes.some(Number.isNaN)) {
      return null;
    }

    return new Date(partes[0], partes[1] - 1, partes[2]);
  }

  private usuarioPodeVerTudo(usuario: any): boolean {
    return usuario?.tipo === 'maestro' || usuario?.tipo === 'diretoria';
  }

  private obterRotuloTipo(tipo: TipoUsuario | null): string {
    const rotulos: Record<TipoUsuario, string> = {
      musico: 'Músico',
      maestro: 'Maestro',
      diretoria: 'Diretoria',
      secretaria: 'Secretaria',
      nulo: 'Usuário'
    };

    return tipo ? rotulos[tipo] : 'Usuário';
  }

  private mesmoUsuario(primeiro: any, segundo: any): boolean {
    return (primeiro.id != null && primeiro.id === segundo.id)
      || (primeiro.login && primeiro.login === segundo.login);
  }

  private atualizarMinhaResposta() {
    const usuario = this.usuarioService.buscarAutenticacao();
    const id = usuario.id;
    if (!id || !this.proximoEnsaio) {
      this.minhaResposta = null;
      return;
    }

    if ((this.proximoEnsaio.presencas || []).some((musico: any) => String(musico.id) === String(id))) {
      this.minhaResposta = true;
    } else if ((this.proximoEnsaio.faltas || []).some((musico: any) => String(musico.id) === String(id))) {
      this.minhaResposta = false;
    } else {
      this.minhaResposta = null;
    }
  }

  sair() {
    this.usuarioService.encerrarAutenticacao();
    this.navController.navigateRoot('/login');
  }
}
