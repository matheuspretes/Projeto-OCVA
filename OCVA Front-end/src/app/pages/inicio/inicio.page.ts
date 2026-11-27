import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonCol, IonGrid, IonIcon, IonRow } from '@ionic/angular/standalone';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { addIcons } from 'ionicons';
import {
  addCircleOutline, barChartOutline, calendarOutline, documentTextOutline, gridOutline,
  locationOutline, musicalNoteOutline, musicalNotesOutline, peopleOutline, personOutline, timeOutline
} from 'ionicons/icons';
import { AppLayoutComponent } from 'src/app/components/app-layout/app-layout.component';
import { TipoUsuario } from 'src/app/constantes/tipo-usuario';
import { Encontro } from 'src/app/models/encontro';
import { Ensaio } from 'src/app/models/ensaio';
import { Evento } from 'src/app/models/evento';
import { EventoMarcado } from 'src/app/models/evento-marcado';
import { EncontrosService } from 'src/app/services/encontros-service';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { EventosMarcadosService } from 'src/app/services/eventos-marcados-service';
import { EventosService } from 'src/app/services/eventos-service';
import { UsuarioService } from 'src/app/services/usuario-service';

/**
 * Um compromisso futuro mostrado na página inicial, com sua enquete "vou / não vou".
 * - encontro / ensaio: o card de próximo ensaio
 * - eventoMarcado / evento: o card de próximo evento
 */
type Compromisso = {
  origem: 'encontro' | 'ensaio' | 'eventoMarcado' | 'evento';
  id: number;
  categoria: string;
  titulo: string;
  descricao: string;
  local?: string;
  maestro?: string; // maestro responsável
  evento?: string;  // evento do ensaio
  data: string; // aaaa-mm-dd
  hora: string; // hh:mm
  vao: any[];
  naoVao: any[];
};

type Enquete = 'ensaio' | 'evento';

@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [AppLayoutComponent, CommonModule, RouterLink, IonIcon, IonGrid, IonRow, IonCol]
})
export class InicioPage implements OnInit {
  tipoUsuario: TipoUsuario | null = null;
  nomeUsuario = '';
  carregandoDados = true;

  proximo: Compromisso | null = null;        // próximo ensaio ou encontro
  proximoEvento: Compromisso | null = null;  // próximo evento

  minhaResposta: Record<string, boolean | null> = { ensaio: null, evento: null };
  salvando: Record<string, boolean> = { ensaio: false, evento: false };

  constructor(
    private usuarioService: UsuarioService,
    private encontrosService: EncontrosService,
    private ensaiosService: EnsaiosService,
    private eventosMarcadosService: EventosMarcadosService,
    private eventosService: EventosService
  ) {
    addIcons({
      addCircleOutline, barChartOutline, calendarOutline, documentTextOutline, gridOutline,
      locationOutline, musicalNoteOutline, musicalNotesOutline, peopleOutline, personOutline, timeOutline
    });
  }

  ngOnInit() {
    const usuario = this.usuarioService.buscarAutenticacao();
    this.nomeUsuario = usuario.nome || usuario.login || '';
    this.tipoUsuario = typeof usuario.tipo === 'string'
      ? usuario.tipo.trim().toLowerCase() as TipoUsuario
      : null;
    this.carregarDados();
  }

  ionViewWillEnter() {
    // Recarrega ao voltar para a página (ex.: depois de marcar um encontro ou evento)
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
      eventoMarcado: comFallback<EventoMarcado | null>(this.eventosMarcadosService.proximo(), 'o próximo evento', null),
      eventos: comFallback<Evento[]>(this.eventosService.listar(), 'os eventos', [])
    }).subscribe(({ encontro, ensaios, eventoMarcado, eventos }) => {
      this.proximo = this.maisProximo([
        ...(encontro ? [this.deEncontro(encontro)] : []),
        ...this.futurosVisiveis(ensaios, usuario).map((ensaio) => this.deEnsaio(ensaio))
      ]);
      this.proximoEvento = this.maisProximo([
        ...(eventoMarcado ? [this.deEventoMarcado(eventoMarcado)] : []),
        ...this.futurosVisiveis(eventos, usuario).map((evento) => this.deEvento(evento))
      ]);
      this.atualizarRespostas();
      this.carregandoDados = false;
    });
  }

  // ---------- Enquetes "vou / não vou" ----------

  compromisso(enquete: Enquete): Compromisso | null {
    return enquete === 'ensaio' ? this.proximo : this.proximoEvento;
  }

  responder(enquete: Enquete, vou: boolean) {
    const usuario = this.usuarioService.buscarAutenticacao();
    const atual = this.compromisso(enquete);
    if (!atual || !usuario.id || this.salvando[enquete]) {
      return;
    }

    const musicoId: number = usuario.id;
    const desmarcar = this.minhaResposta[enquete] === vou;
    let requisicao: Observable<Compromisso>;

    switch (atual.origem) {
      case 'encontro':
        requisicao = (desmarcar
          ? this.encontrosService.removerResposta(atual.id, musicoId)
          : this.encontrosService.responder(atual.id, musicoId, vou)
        ).pipe(map((encontro) => this.deEncontro(encontro)));
        break;

      case 'eventoMarcado':
        requisicao = (desmarcar
          ? this.eventosMarcadosService.removerResposta(atual.id, musicoId)
          : this.eventosMarcadosService.responder(atual.id, musicoId, vou)
        ).pipe(map((evento) => this.deEventoMarcado(evento)));
        break;

      case 'evento':
        // A API de eventos troca a marcação anterior sozinha
        requisicao = (desmarcar
          ? this.eventosService.removerPresenca(atual.id, musicoId)
          : this.eventosService.marcarPresenca(atual.id, musicoId, vou)
        ).pipe(map((evento) => this.deEvento(evento)));
        break;

      default: {
        // A API de ensaios não troca direto: remove a resposta antiga antes de marcar a nova
        const remover = this.ensaiosService.removerPresenca(atual.id, musicoId);
        const antes: Observable<unknown> = this.minhaResposta[enquete] === null ? of(null) : remover;
        requisicao = (desmarcar
          ? remover
          : antes.pipe(switchMap(() => this.ensaiosService.marcarPresenca(atual.id, musicoId, vou)))
        ).pipe(map((ensaio) => this.deEnsaio(ensaio)));
      }
    }

    this.salvando[enquete] = true;
    requisicao.subscribe({
      next: (atualizado) => {
        if (enquete === 'ensaio') {
          this.proximo = atualizado;
        } else {
          this.proximoEvento = atualizado;
        }
        this.atualizarRespostas();
        this.salvando[enquete] = false;
      },
      error: (erro) => {
        console.error('Não foi possível registrar a resposta.', erro);
        this.salvando[enquete] = false;
      }
    });
  }

  podeResponder(enquete: Enquete): boolean {
    return !!this.compromisso(enquete) && !!this.usuarioService.buscarAutenticacao().id;
  }

  podeMarcar(): boolean {
    return this.tipoUsuario === 'maestro' || this.tipoUsuario === 'diretoria';
  }

  // Link "Editar" / "Marcar" de cada card
  link(enquete: Enquete): { rota: string | any[]; params: any } {
    const atual = this.compromisso(enquete);
    switch (atual?.origem) {
      case 'encontro': return { rota: '/marcar-encontro', params: { id: atual.id } };
      case 'ensaio': return { rota: ['/ensaios', atual.id], params: {} };
      case 'eventoMarcado': return { rota: '/marcar-evento', params: { id: atual.id } };
      case 'evento': return { rota: ['/eventos', atual.id], params: {} };
      default: return { rota: enquete === 'ensaio' ? '/marcar-encontro' : '/marcar-evento', params: {} };
    }
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

  // ---------- Montagem dos compromissos ----------

  private maisProximo(candidatos: Compromisso[]): Compromisso | null {
    return [...candidatos].sort((a, b) => `${a.data}T${a.hora}`.localeCompare(`${b.data}T${b.hora}`))[0] || null;
  }

  // Ensaios/eventos já cadastrados cujo horário ainda não passou e que o usuário pode ver
  private futurosVisiveis<T extends { data: string; musicos?: any[] }>(registros: T[], usuario: any): T[] {
    const agora = new Date();
    return registros
      .filter((registro) => new Date(registro.data) > agora)
      .filter((registro) => this.usuarioPodeVerTudo(usuario)
        || (registro.musicos || []).some((musico: any) => this.mesmoUsuario(musico, usuario)));
  }

  private deEncontro(encontro: Encontro): Compromisso {
    return {
      origem: 'encontro',
      id: encontro.id as number,
      categoria: encontro.tipo?.nome || 'Encontro',
      titulo: encontro.titulo,
      descricao: encontro.descricao,
      maestro: encontro.maestro?.nome,
      evento: encontro.evento?.titulo,
      data: encontro.data,
      hora: (encontro.hora || '').slice(0, 5),
      vao: encontro.interessados || [],
      naoVao: encontro.recusados || []
    };
  }

  private deEnsaio(ensaio: Ensaio): Compromisso {
    const [data, hora] = (ensaio.data || '').split('T');
    return {
      origem: 'ensaio',
      id: ensaio.id as number,
      categoria: ensaio.tipo || 'Ensaio',
      titulo: ensaio.titulo || 'Ensaio',
      descricao: ensaio.descricao,
      maestro: ensaio.maestro?.nome,
      evento: ensaio.evento?.titulo,
      data,
      hora: (hora || '').slice(0, 5),
      vao: ensaio.presencas || [],
      naoVao: ensaio.faltas || []
    };
  }

  private deEventoMarcado(evento: EventoMarcado): Compromisso {
    return {
      origem: 'eventoMarcado',
      id: evento.id as number,
      categoria: 'Evento',
      titulo: evento.titulo,
      descricao: evento.descricao,
      local: evento.local,
      maestro: evento.maestro?.nome,
      data: evento.data,
      hora: (evento.hora || '').slice(0, 5),
      vao: evento.interessados || [],
      naoVao: evento.recusados || []
    };
  }

  private deEvento(evento: Evento): Compromisso {
    const [data, hora] = (evento.data || '').split('T');
    return {
      origem: 'evento',
      id: evento.id as number,
      categoria: 'Evento',
      titulo: evento.titulo || 'Evento',
      descricao: evento.descricao,
      local: evento.local,
      maestro: evento.maestro?.nome,
      data,
      hora: (hora || '').slice(0, 5),
      vao: evento.presencas || [],
      naoVao: evento.faltas || []
    };
  }

  private atualizarRespostas() {
    const id = this.usuarioService.buscarAutenticacao().id;
    const mesmo = (musico: any) => String(musico.id) === String(id);
    (['ensaio', 'evento'] as Enquete[]).forEach((enquete) => {
      const atual = this.compromisso(enquete);
      this.minhaResposta[enquete] = !id || !atual ? null
        : atual.vao.some(mesmo) ? true
        : atual.naoVao.some(mesmo) ? false
        : null;
    });
  }

  // ---------- Auxiliares ----------

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

  private mesmoUsuario(primeiro: any, segundo: any): boolean {
    return (primeiro.id != null && primeiro.id === segundo.id)
      || (primeiro.login && primeiro.login === segundo.login);
  }
}
