import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline, calendarOutline, checkmarkCircleOutline, closeCircleOutline,
  locationOutline, musicalNoteOutline, musicalNotesOutline, peopleOutline, starOutline, timeOutline
} from 'ionicons/icons';
import { forkJoin } from 'rxjs';

import { AppLayoutComponent } from 'src/app/components/app-layout/app-layout.component';
import { Usuario } from 'src/app/models/usuario';
import { Ensaio } from 'src/app/models/ensaio';
import { Evento } from 'src/app/models/evento';
import { Encontro } from 'src/app/models/encontro';
import { EventoMarcado } from 'src/app/models/evento-marcado';
import { UsuarioService } from 'src/app/services/usuario-service';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { EventosService } from 'src/app/services/eventos-service';
import { EncontrosService } from 'src/app/services/encontros-service';
import { EventosMarcadosService } from 'src/app/services/eventos-marcados-service';

// Um ensaio ou evento mostrado na página do músico
interface ItemAgenda {
  titulo: string;
  tipo: string;
  data: Date;
  local?: string;
  situacao: string;      // ex.: "Presente", "Falta", "Escalado"
  classe: string;        // classe css da situação: presente, falta, escalado, neutro
  link?: string;         // página de detalhe, quando existir
}

@Component({
  selector: 'app-musico-detalhe',
  templateUrl: './musico-detalhe.page.html',
  styleUrls: ['./musico-detalhe.page.scss'],
  standalone: true,
  imports: [AppLayoutComponent, CommonModule, RouterLink, IonIcon, IonSpinner]
})
export class MusicoDetalhePage implements OnInit {
  musico: Usuario | null = null;
  carregando = true;
  erro = false;
  podeAcessar = false;

  proximosEnsaios: ItemAgenda[] = [];
  proximosEventos: ItemAgenda[] = [];
  ensaiosRealizados: ItemAgenda[] = [];
  eventosRealizados: ItemAgenda[] = [];

  totalPresencas = 0;
  totalFaltas = 0;

  constructor(
    private route: ActivatedRoute,
    private usuarioService: UsuarioService,
    private ensaiosService: EnsaiosService,
    private eventosService: EventosService,
    private encontrosService: EncontrosService,
    private eventosMarcadosService: EventosMarcadosService
  ) {
    addIcons({
      arrowBackOutline, calendarOutline, checkmarkCircleOutline, closeCircleOutline,
      locationOutline, musicalNoteOutline, musicalNotesOutline, peopleOutline, starOutline, timeOutline
    });
  }

  ngOnInit() {
    // Mesma regra da página de músicos: só maestro e diretoria
    const usuario = this.usuarioService.buscarAutenticacao();
    this.podeAcessar = usuario?.tipo === 'maestro' || usuario?.tipo === 'diretoria';
    if (!this.podeAcessar) {
      this.carregando = false;
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));

    forkJoin({
      musico: this.usuarioService.buscarPorId(id),
      ensaios: this.ensaiosService.listar(),
      eventos: this.eventosService.listar(),
      encontros: this.encontrosService.listar(),
      eventosMarcados: this.eventosMarcadosService.listar()
    }).subscribe({
      next: (dados) => {
        this.musico = dados.musico;
        this.separarEnsaios(dados.ensaios, id);
        this.separarEventos(dados.eventos, id);
        this.adicionarEncontros(dados.encontros, id);
        this.adicionarEventosMarcados(dados.eventosMarcados, id);
        this.ordenarListas();
        this.carregando = false;
      },
      error: () => {
        this.erro = true;
        this.carregando = false;
      }
    });
  }

  // Ensaios já registrados: passados vão para o histórico, futuros para os próximos
  private separarEnsaios(ensaios: Ensaio[], musicoId: number) {
    const agora = new Date();

    for (const ensaio of ensaios) {
      const escalado = this.contem(ensaio.musicos, musicoId);
      const presente = this.contem(ensaio.presencas, musicoId);
      const faltou = this.contem(ensaio.faltas, musicoId);
      if (!escalado && !presente && !faltou) {
        continue;
      }

      const item: ItemAgenda = {
        titulo: ensaio.titulo || 'Ensaio',
        tipo: ensaio.tipo || 'Ensaio',
        data: new Date(ensaio.data),
        situacao: 'Escalado',
        classe: 'escalado',
        link: `/ensaios/${ensaio.id}`
      };

      if (item.data >= agora) {
        this.proximosEnsaios.push(item);
        continue;
      }

      this.definirSituacao(item, presente, faltou);
      this.ensaiosRealizados.push(item);
    }
  }

  // Eventos já registrados: passados vão para o histórico, futuros para os próximos
  private separarEventos(eventos: Evento[], musicoId: number) {
    const agora = new Date();

    for (const evento of eventos) {
      const escalado = this.contem(evento.musicos, musicoId);
      const presente = this.contem(evento.presencas, musicoId);
      const faltou = this.contem(evento.faltas, musicoId);
      if (!escalado && !presente && !faltou) {
        continue;
      }

      const item: ItemAgenda = {
        titulo: evento.titulo || 'Evento',
        tipo: 'Evento',
        data: new Date(evento.data),
        local: evento.local,
        situacao: 'Escalado',
        classe: 'escalado',
        link: `/eventos/${evento.id}`
      };

      if (item.data >= agora) {
        this.proximosEventos.push(item);
        continue;
      }

      this.definirSituacao(item, presente, faltou);
      this.eventosRealizados.push(item);
    }
  }

  // Encontros marcados (ainda não aconteceram) em que o músico respondeu "Vou"
  private adicionarEncontros(encontros: Encontro[], musicoId: number) {
    for (const encontro of encontros) {
      if (this.contem(encontro.interessados, musicoId)) {
        this.proximosEnsaios.push({
          titulo: encontro.titulo,
          tipo: encontro.tipo?.nome || 'Encontro',
          data: new Date(`${encontro.data}T${encontro.hora}`),
          situacao: 'Confirmou presença',
          classe: 'escalado'
        });
      }
    }
  }

  // Eventos marcados (ainda não aconteceram) em que o músico respondeu "Vou"
  private adicionarEventosMarcados(eventos: EventoMarcado[], musicoId: number) {
    for (const evento of eventos) {
      if (this.contem(evento.interessados, musicoId)) {
        this.proximosEventos.push({
          titulo: evento.titulo,
          tipo: 'Evento',
          data: new Date(`${evento.data}T${evento.hora}`),
          local: evento.local,
          situacao: 'Confirmou presença',
          classe: 'escalado'
        });
      }
    }
  }

  private definirSituacao(item: ItemAgenda, presente: boolean, faltou: boolean) {
    if (presente) {
      item.situacao = 'Presente';
      item.classe = 'presente';
      this.totalPresencas++;
    } else if (faltou) {
      item.situacao = 'Falta';
      item.classe = 'falta';
      this.totalFaltas++;
    } else {
      item.situacao = 'Sem registro';
      item.classe = 'neutro';
    }
  }

  // Próximos: do mais perto ao mais longe. Histórico: do mais recente ao mais antigo.
  private ordenarListas() {
    this.proximosEnsaios.sort((a, b) => a.data.getTime() - b.data.getTime());
    this.proximosEventos.sort((a, b) => a.data.getTime() - b.data.getTime());
    this.ensaiosRealizados.sort((a, b) => b.data.getTime() - a.data.getTime());
    this.eventosRealizados.sort((a, b) => b.data.getTime() - a.data.getTime());
  }

  private contem(lista: any[] | undefined, musicoId: number): boolean {
    return (lista || []).some((musico) => musico?.id === musicoId);
  }

  formatarDia(data: Date): string {
    return String(data.getDate()).padStart(2, '0');
  }

  // Ex.: "NOV/26"
  formatarMesAno(data: Date): string {
    const mes = data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    const ano = String(data.getFullYear()).slice(2);
    return `${mes}/${ano}`.toUpperCase();
  }

  formatarHora(data: Date): string {
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  get iniciais(): string {
    return (this.musico?.nome || '?').slice(0, 2).toUpperCase();
  }

  // Porcentagem de presença nos ensaios e eventos já marcados
  get percentualPresenca(): number {
    const total = this.totalPresencas + this.totalFaltas;
    return total === 0 ? 0 : Math.round((this.totalPresencas / total) * 100);
  }
}
