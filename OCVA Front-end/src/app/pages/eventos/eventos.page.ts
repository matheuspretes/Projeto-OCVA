import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  addCircleOutline, calendarOutline, checkmarkDoneOutline, chevronDownOutline, imageOutline,
  locationOutline, musicalNotesOutline, peopleOutline, personOutline
} from 'ionicons/icons';
import { forkJoin } from 'rxjs';

import { AppLayoutComponent } from 'src/app/components/app-layout/app-layout.component';
import { Evento } from 'src/app/models/evento';
import { EventoMarcado } from 'src/app/models/evento-marcado';
import { Ensaio } from 'src/app/models/ensaio';
import { Encontro } from 'src/app/models/encontro';
import { EventoResumo } from 'src/app/models/evento-resumo';
import { EventosService } from 'src/app/services/eventos-service';
import { EventosMarcadosService } from 'src/app/services/eventos-marcados-service';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { EncontrosService } from 'src/app/services/encontros-service';
import { UsuarioService } from 'src/app/services/usuario-service';

// Ensaio mostrado dentro do card do evento
interface EnsaioDoEvento {
  titulo: string;
  data: Date;
  realizado: boolean;
  ensaioId?: number;   // preenchido quando o ensaio já foi registrado (abre a página de detalhe)
}

// Card da página: evento marcado (ainda não aconteceu) ou evento realizado
interface CardEvento {
  chave: string;       // "m-3" = evento marcado 3, "e-5" = evento realizado 5
  marcado: boolean;
  id: number;
  titulo: string;
  data: string;        // aaaa-mm-ddThh:mm
  descricao: string;
  local?: string;
  banner?: string;
  maestro?: string;
  nomesMusicos: string[];
  presencas: number;
  faltas: number;
  ensaios: EnsaioDoEvento[];
}

@Component({
  selector: 'app-eventos',
  templateUrl: './eventos.page.html',
  styleUrls: ['./eventos.page.scss'],
  standalone: true,
  imports: [AppLayoutComponent, CommonModule, IonIcon, IonButton, IonSpinner]
})
export class EventosPage implements OnInit {
  proximos: CardEvento[] = [];
  realizados: CardEvento[] = [];
  carregando = true;
  usuarioAutenticado: any = null;

  // Chave do card com a lista de ensaios aberta
  aberto: string | null = null;

  constructor(
    private eventosService: EventosService,
    private eventosMarcadosService: EventosMarcadosService,
    private ensaiosService: EnsaiosService,
    private encontrosService: EncontrosService,
    private usuarioService: UsuarioService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      addCircleOutline, calendarOutline, checkmarkDoneOutline, chevronDownOutline, imageOutline,
      locationOutline, musicalNotesOutline, peopleOutline, personOutline
    });
  }

  ngOnInit() {
    this.usuarioAutenticado = this.usuarioService.buscarAutenticacao();
    this.carregar();
  }

  carregar() {
    this.carregando = true;
    forkJoin({
      marcados: this.eventosMarcadosService.listar(),
      eventos: this.eventosService.listar(),
      ensaios: this.ensaiosService.listar(),
      encontros: this.encontrosService.listar()
    }).subscribe({
      next: ({ marcados, eventos, ensaios, encontros }) => {
        // Próximos: do mais perto ao mais distante (a API já devolve nessa ordem)
        this.proximos = marcados.map((evento) => this.deEventoMarcado(evento, ensaios, encontros));

        // Realizados: do mais recente ao mais antigo. Músicos veem só os eventos de que participaram.
        this.realizados = eventos
          .filter((evento) => this.podeVerEvento(evento))
          .sort((a, b) => (b.data || '').localeCompare(a.data || ''))
          .map((evento) => this.deEvento(evento, ensaios, encontros));
        this.carregando = false;
      },
      error: () => {
        this.proximos = [];
        this.realizados = [];
        this.carregando = false;
      }
    });
  }

  // ---------- Permissões ----------

  podeEditarOuExcluir(): boolean {
    return this.usuarioAutenticado?.tipo === 'diretoria';
  }

  podeMarcarEvento(): boolean {
    return this.usuarioAutenticado?.tipo === 'maestro' || this.usuarioAutenticado?.tipo === 'diretoria';
  }

  private podeVerEvento(evento: Evento): boolean {
    if (this.podeMarcarEvento()) {
      return true;
    }
    return (evento.musicos || []).some((musico: any) => musico.id === this.usuarioAutenticado?.id);
  }

  // ---------- Ações ----------

  // Clicar no card mostra (ou esconde) os ensaios do evento
  alternarEnsaios(card: CardEvento) {
    this.aberto = this.aberto === card.chave ? null : card.chave;
  }

  abrirEnsaio(ensaio: EnsaioDoEvento) {
    if (ensaio.ensaioId) {
      this.router.navigate(['/ensaios', ensaio.ensaioId]);
    }
  }

  marcarEvento() {
    this.router.navigate(['/marcar-evento']);
  }

  abrirDetalhes(card: CardEvento) {
    this.router.navigate(['/eventos', card.id]);
  }

  editarEvento(card: CardEvento) {
    if (card.marcado) {
      this.router.navigate(['/marcar-evento'], { queryParams: { id: card.id } });
    } else {
      this.router.navigate(['/criar-evento'], { queryParams: { id: card.id } });
    }
  }

  async excluirEvento(card: CardEvento) {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este evento? Os ensaios dele ficarão sem evento.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.eventosService.excluir(card.id).subscribe({
              next: async () => {
                await this.mostrarToast('Evento excluído com sucesso', 'warning');
                this.carregar();
              },
              error: async () => this.mostrarToast('Erro ao excluir evento', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // ---------- Formatação ----------

  formatarDataEvento(dataOriginal: string): string {
    const data = new Date(dataOriginal);
    if (Number.isNaN(data.getTime())) return dataOriginal || '';

    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      + ` · ${data.toLocaleDateString('pt-BR', { weekday: 'long' }).toUpperCase()}`;
  }

  formatarHorario(dataOriginal: string): string {
    const data = new Date(dataOriginal);
    if (Number.isNaN(data.getTime())) return '';
    return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
  }

  formatarDataEnsaio(data: Date): string {
    const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
    return `${dia} · ${hora}`;
  }

  // ---------- Montagem dos cards ----------

  private deEventoMarcado(evento: EventoMarcado, ensaios: Ensaio[], encontros: Encontro[]): CardEvento {
    const chave = `m-${evento.id}`;
    return {
      chave,
      marcado: true,
      id: evento.id as number,
      titulo: evento.titulo,
      data: `${evento.data}T${(evento.hora || '00:00').slice(0, 5)}`,
      descricao: evento.descricao,
      local: evento.local,
      banner: evento.banner,
      maestro: evento.maestro?.nome,
      nomesMusicos: (evento.interessados || []).map((musico: any) => musico.nome),
      presencas: 0,
      faltas: 0,
      ensaios: this.ensaiosDoEvento(chave, ensaios, encontros)
    };
  }

  private deEvento(evento: Evento, ensaios: Ensaio[], encontros: Encontro[]): CardEvento {
    const chave = `e-${evento.id}`;
    return {
      chave,
      marcado: false,
      id: evento.id as number,
      titulo: evento.titulo || 'Apresentação / Concerto',
      data: evento.data,
      descricao: evento.descricao,
      local: evento.local,
      banner: evento.banner,
      maestro: evento.maestro?.nome,
      nomesMusicos: (evento.musicos || []).map((musico: any) => musico.nome),
      presencas: evento.presencas?.length || 0,
      faltas: evento.faltas?.length || 0,
      ensaios: this.ensaiosDoEvento(chave, ensaios, encontros)
    };
  }

  // Ensaios já registrados + encontros do tipo Ensaio ainda marcados, do mais antigo ao mais novo
  private ensaiosDoEvento(chave: string, ensaios: Ensaio[], encontros: Encontro[]): EnsaioDoEvento[] {
    const lista: EnsaioDoEvento[] = [];
    const agora = new Date();

    for (const ensaio of ensaios) {
      if (this.chaveDoEvento(ensaio.evento) === chave) {
        const data = new Date(ensaio.data);
        lista.push({ titulo: ensaio.titulo || 'Ensaio', data, realizado: data <= agora, ensaioId: ensaio.id });
      }
    }
    for (const encontro of encontros) {
      if (this.chaveDoEvento(encontro.evento) === chave) {
        lista.push({
          titulo: encontro.titulo,
          data: new Date(`${encontro.data}T${(encontro.hora || '00:00').slice(0, 5)}`),
          realizado: false
        });
      }
    }
    return lista.sort((a, b) => a.data.getTime() - b.data.getTime());
  }

  private chaveDoEvento(evento: EventoResumo | null | undefined): string | null {
    return evento ? `${evento.marcado ? 'm' : 'e'}-${evento.id}` : null;
  }

  private async mostrarToast(message: string, color: string) {
    const toast = await this.toastController.create({ message, duration: 2000, color });
    await toast.present();
  }
}
