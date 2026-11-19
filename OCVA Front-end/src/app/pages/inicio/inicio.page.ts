import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonCol, IonContent, IonGrid, IonIcon, IonItem, IonLabel, IonList, IonMenu, IonMenuButton, IonRow, IonSplitPane } from '@ionic/angular/standalone';
import { NavController } from '@ionic/angular';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  addCircleOutline, barChartOutline, calendarOutline, documentTextOutline, gridOutline,
  homeOutline, keyOutline, logOutOutline, musicalNoteOutline, musicalNotesOutline,
  peopleOutline, personOutline
} from 'ionicons/icons';
import { TipoUsuario } from 'src/app/constantes/tipo-usuario';
import { Evento } from 'src/app/models/evento';
import { Encontro } from 'src/app/models/encontro';
import { Ensaio } from 'src/app/models/ensaio';
import { EncontrosService } from 'src/app/services/encontros-service';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { EventosService } from 'src/app/services/eventos-service';
import { UsuarioService } from 'src/app/services/usuario-service';
import { AppLayoutComponent } from 'src/app/components/app-layout/app-layout.component';

/**
 * O próximo compromisso da orquestra: pode ser um encontro marcado
 * ou um ensaio já cadastrado com data futura.
 */
type ProximoCompromisso = {
  origem: 'encontro' | 'ensaio';
  id: number;
  categoria: string;
  titulo: string;
  descricao: string;
  data: string; // aaaa-mm-dd
  hora: string; // hh:mm
  vao: any[];
  naoVao: any[];
};

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [AppLayoutComponent, CommonModule, RouterLink, RouterLinkActive, IonContent, IonIcon, IonMenuButton, IonSplitPane, IonMenu, IonList, IonItem, IonLabel, IonGrid, IonRow, IonCol]
})
export class InicioPage implements OnInit {
  tipoUsuario: TipoUsuario | null = null;
  proximo: ProximoCompromisso | null = null;
  proximoEvento: Evento | null = null;
  carregandoDados = true;
  salvandoPresenca = false;
  minhaResposta: boolean | null = null;

  public nomeUsuario = '';
  public tipoUsuarioLabel = 'Usuário';

  constructor(
    private navController: NavController,
    private usuarioService: UsuarioService,
    private encontrosService: EncontrosService,
    private ensaiosService: EnsaiosService,
    private eventosService: EventosService
  ) {
    addIcons({
      addCircleOutline, barChartOutline, calendarOutline, documentTextOutline, gridOutline,
      homeOutline, keyOutline, logOutOutline, musicalNoteOutline, musicalNotesOutline,
      peopleOutline, personOutline
    });
  }

  ngOnInit() {
    const usuario = this.usuarioService.buscarAutenticacao();
    this.nomeUsuario = usuario.nome || usuario.login || '';
    this.tipoUsuario = typeof usuario.tipo === 'string'
      ? usuario.tipo.trim().toLowerCase() as TipoUsuario
      : null;
    this.tipoUsuarioLabel = this.obterRotuloTipo(this.tipoUsuario);
    this.carregarDados();
  }

  ionViewWillEnter() {
    // Recarrega ao voltar para a página (ex.: depois de marcar um encontro)
    if (!this.carregandoDados) {
      this.carregarDados();
    }
  }

  private carregarDados() {
    const usuario = this.usuarioService.buscarAutenticacao();
    const comFallback = <T>(origem: Observable<T>, oQue: string, padrao: T): Observable<T> =>
      origem.pipe(catchError((erro) => {
        console.error(`Não foi possível carregar ${oQue}.`, erro);
        return of(padrao);
      }));

    this.carregandoDados = true;
    forkJoin({
      encontro: comFallback<Encontro | null>(this.encontrosService.proximo(), 'o próximo encontro', null),
      ensaios: comFallback<Ensaio[]>(this.ensaiosService.listar(), 'os ensaios', []),
      eventos: comFallback<Evento[]>(this.eventosService.listar(), 'os eventos', [])
    }).subscribe(({ encontro, ensaios, eventos }) => {
      this.proximo = this.escolherProximo(encontro, ensaios, usuario);
      this.proximoEvento = this.escolherProximoEvento(eventos, usuario);
      this.atualizarMinhaResposta();
      this.carregandoDados = false;
    });
  }

  // ---------- Enquete "vou / não vou" ----------

  responderPresenca(vou: boolean) {
    const usuario = this.usuarioService.buscarAutenticacao();
    const proximo = this.proximo;
    if (!proximo || !usuario.id || this.salvandoPresenca) {
      return;
    }

    const desmarcar = this.minhaResposta === vou;
    let requisicao: Observable<ProximoCompromisso>;

    if (proximo.origem === 'encontro') {
      const chamada = desmarcar
        ? this.encontrosService.removerResposta(proximo.id, usuario.id)
        : this.encontrosService.responder(proximo.id, usuario.id, vou);
      requisicao = chamada.pipe(map((encontro) => this.deEncontro(encontro)));
    } else {
      // A API de ensaios não deixa trocar a resposta direto: remove a antiga antes de marcar a nova
      const musicoId = usuario.id;
      const remover: Observable<Ensaio> = this.ensaiosService.removerPresenca(proximo.id, musicoId);
      const antesDeMarcar: Observable<unknown> = this.minhaResposta === null ? of(null) : remover;
      const chamada: Observable<Ensaio> = desmarcar
        ? remover
        : antesDeMarcar.pipe(switchMap(() => this.ensaiosService.marcarPresenca(proximo.id, musicoId, vou)));
      requisicao = chamada.pipe(map((ensaio) => this.deEnsaio(ensaio)));
    }

    this.salvandoPresenca = true;
    requisicao.subscribe({
      next: (atualizado) => {
        this.proximo = atualizado;
        this.atualizarMinhaResposta();
        this.salvandoPresenca = false;
      },
      error: (erro) => {
        console.error('Não foi possível registrar a resposta.', erro);
        this.salvandoPresenca = false;
      }
    });
  }

  podeResponder(): boolean {
    return !!this.proximo && !!this.usuarioService.buscarAutenticacao().id;
  }

  podeMarcarEncontro(): boolean {
    return this.tipoUsuario === 'maestro' || this.tipoUsuario === 'diretoria';
  }

  linkEdicao(): { rota: string; params: any } {
    if (this.proximo?.origem === 'ensaio') {
      return { rota: '/criar-ensaio', params: { id: this.proximo.id } };
    }
    return { rota: '/marcar-encontro', params: this.proximo ? { id: this.proximo.id } : {} };
  }

  // ---------- Formatação ----------

  formatarDia(data: string | undefined): string {
    const d = this.converterData(data);
    return d ? String(d.getDate()).padStart(2, '0') : '--';
  }

  formatarDiaDaSemana(data: string | undefined): string {
    const d = this.converterData(data);
    return d
      ? ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'][d.getDay()]
      : 'Data não informada';
  }

  formatarMesAno(data: string | undefined): string {
    const d = this.converterData(data);
    return d
      ? `${['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][d.getMonth()]} de ${d.getFullYear()}`
      : '';
  }

  formatarHora(hora: string | undefined): string {
    return hora ? hora.slice(0, 5).replace(':', 'h') : '';
  }

  // ---------- Escolha do próximo compromisso ----------

  private escolherProximo(encontro: Encontro | null, ensaios: Ensaio[], usuario: any): ProximoCompromisso | null {
    const hoje = this.hojeTexto();
    const candidatos: ProximoCompromisso[] = [];

    if (encontro) {
      candidatos.push(this.deEncontro(encontro));
    }

    ensaios
      .filter((ensaio) => (ensaio.data || '').slice(0, 10) >= hoje)
      .filter((ensaio) => this.usuarioPodeVerTudo(usuario)
        || (ensaio.musicos || []).some((musico: any) => this.mesmoUsuario(musico, usuario)))
      .forEach((ensaio) => candidatos.push(this.deEnsaio(ensaio)));

    candidatos.sort((a, b) => `${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`));
    return candidatos[0] || null;
  }

  private escolherProximoEvento(eventos: Evento[], usuario: any): Evento | null {
    const hoje = this.hojeTexto();
    return eventos
      .filter((evento) => (evento.data || '').slice(0, 10) >= hoje)
      .filter((evento) => this.usuarioPodeVerTudo(usuario)
        || (evento.musicos || []).some((musico: any) => this.mesmoUsuario(musico, usuario)))
      .sort((a, b) => (a.data || '').localeCompare(b.data || ''))[0] || null;
  }

  private deEncontro(encontro: Encontro): ProximoCompromisso {
    return {
      origem: 'encontro',
      id: encontro.id as number,
      categoria: encontro.tipo?.nome || 'Encontro',
      titulo: encontro.titulo,
      descricao: encontro.descricao,
      data: encontro.data,
      hora: (encontro.hora || '').slice(0, 5),
      vao: encontro.interessados || [],
      naoVao: encontro.recusados || []
    };
  }

  private deEnsaio(ensaio: Ensaio): ProximoCompromisso {
    const [data, hora] = (ensaio.data || '').split('T');
    return {
      origem: 'ensaio',
      id: ensaio.id as number,
      categoria: 'Ensaio',
      titulo: ensaio.titulo || 'Ensaio',
      descricao: ensaio.descricao,
      data,
      hora: (hora || '').slice(0, 5),
      vao: ensaio.presencas || [],
      naoVao: ensaio.faltas || []
    };
  }

  private atualizarMinhaResposta() {
    const id = this.usuarioService.buscarAutenticacao().id;
    const mesmo = (musico: any) => String(musico.id) === String(id);
    if (!id || !this.proximo) {
      this.minhaResposta = null;
    } else if (this.proximo.vao.some(mesmo)) {
      this.minhaResposta = true;
    } else if (this.proximo.naoVao.some(mesmo)) {
      this.minhaResposta = false;
    } else {
      this.minhaResposta = null;
    }
  }

  // ---------- Auxiliares ----------

  private hojeTexto(): string {
    const agora = new Date();
    return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
  }

  private converterData(data: string | undefined): Date | null {
    if (!data) {
      return null;
    }
    const partes = data.slice(0, 10).split('-').map(Number);
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

  sair() {
    this.usuarioService.encerrarAutenticacao();
    this.navController.navigateRoot('/login');
  }
}
