import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { IonButton, IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline, createOutline, musicalNote, musicalNotesOutline, peopleOutline,
  personOutline, starOutline, trashOutline
} from 'ionicons/icons';
import { Observable, forkJoin } from 'rxjs';

import { AppLayoutComponent } from 'src/app/components/app-layout/app-layout.component';
import { Encontro } from 'src/app/models/encontro';
import { Ensaio } from 'src/app/models/ensaio';
import { EncontrosService } from 'src/app/services/encontros-service';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { UsuarioService } from 'src/app/services/usuario-service';

// Um card da página: pode ser um encontro (ainda guardado como encontro) ou um ensaio já registrado
interface ItemEncontro {
  origem: 'encontro' | 'ensaio';
  id: number;
  tipo: string;
  titulo: string;
  data: Date;
  descricao: string;
  maestro?: string;
  evento?: string;
  musicos: any[];      // ensaio: músicos escalados / encontro: quem respondeu "Vou"
  rotuloMusicos: string;
}

@Component({
  selector: 'app-encontros',
  templateUrl: './encontros.page.html',
  styleUrls: ['./encontros.page.scss'],
  standalone: true,
  imports: [AppLayoutComponent, CommonModule, IonButton, IonIcon, IonSpinner]
})
export class EncontrosPage implements OnInit {
  naoPassaram: ItemEncontro[] = [];
  jaPassaram: ItemEncontro[] = [];
  carregando = true;
  usuario: any = null;

  constructor(
    private encontrosService: EncontrosService,
    private ensaiosService: EnsaiosService,
    private usuarioService: UsuarioService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      calendarOutline, createOutline, musicalNote, musicalNotesOutline, peopleOutline,
      personOutline, starOutline, trashOutline
    });
  }

  ngOnInit() {
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.carregar();
  }

  ionViewWillEnter() {
    // Recarrega ao voltar da edição
    if (!this.carregando) {
      this.carregar();
    }
  }

  carregar() {
    this.carregando = true;
    this.naoPassaram = [];
    this.jaPassaram = [];
    forkJoin({
      futuros: this.encontrosService.listar(),
      passados: this.encontrosService.listarPassados(),
      ensaios: this.ensaiosService.listar()
    }).subscribe({
      next: ({ futuros, passados, ensaios }) => {
        // Não passaram: do mais próximo ao mais distante
        this.naoPassaram = futuros.map((encontro) => this.deEncontro(encontro));

        // Já passaram: ensaios registrados + encontros que não viram ensaio (ex.: reuniões),
        // do mais recente ao mais antigo
        const agora = new Date();
        const ensaiosVisiveis = ensaios.filter((ensaio) => this.podeVerEnsaio(ensaio));
        const itens = [
          ...ensaiosVisiveis.map((ensaio) => this.deEnsaio(ensaio)),
          ...passados.map((encontro) => this.deEncontro(encontro))
        ];

        // Ensaios cadastrados direto com data futura ficam em "Não passaram"
        for (const item of itens) {
          if (item.data > agora) {
            this.naoPassaram.push(item);
          } else {
            this.jaPassaram.push(item);
          }
        }
        this.naoPassaram.sort((a, b) => a.data.getTime() - b.data.getTime());
        this.jaPassaram.sort((a, b) => b.data.getTime() - a.data.getTime());
        this.carregando = false;
      },
      error: async () => {
        this.carregando = false;
        await this.mostrarToast('Não foi possível carregar os encontros.', 'danger');
      }
    });
  }

  // ---------- Permissões ----------

  ehEquipe(): boolean {
    return this.usuario?.tipo === 'maestro' || this.usuario?.tipo === 'diretoria';
  }

  // Encontros: maestro e diretoria. Ensaios registrados: só diretoria (mesma regra de antes).
  podeEditar(item: ItemEncontro): boolean {
    return item.origem === 'encontro' ? this.ehEquipe() : this.usuario?.tipo === 'diretoria';
  }

  // Músicos veem os ensaios em que foram escalados; maestro e diretoria veem todos
  private podeVerEnsaio(ensaio: Ensaio): boolean {
    if (this.ehEquipe()) {
      return true;
    }
    return (ensaio.musicos || []).some((musico: any) => musico.id === this.usuario?.id);
  }

  // ---------- Ações ----------

  abrir(item: ItemEncontro) {
    if (item.origem === 'ensaio') {
      this.router.navigate(['/ensaios', item.id]);
    } else if (this.podeEditar(item)) {
      this.editar(item);
    }
  }

  marcarEncontro() {
    this.router.navigate(['/marcar-encontro']);
  }

  editar(item: ItemEncontro) {
    const rota = item.origem === 'ensaio' ? '/criar-ensaio' : '/marcar-encontro';
    this.router.navigate([rota], { queryParams: { id: item.id } });
  }

  async excluir(item: ItemEncontro) {
    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir "${item.titulo}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            const requisicao: Observable<unknown> = item.origem === 'ensaio'
              ? this.ensaiosService.excluir(item.id)
              : this.encontrosService.excluir(item.id);
            requisicao.subscribe({
              next: async () => {
                await this.mostrarToast('Excluído com sucesso.', 'warning');
                this.carregar();
              },
              error: async () => this.mostrarToast('Não foi possível excluir.', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  // ---------- Formatação ----------

  formatarData(data: Date): string {
    const dia = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const semana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
    const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
    return `${dia} · ${semana.charAt(0).toUpperCase() + semana.slice(1)} · ${hora}`;
  }

  iniciais(nome: string): string {
    const partes = (nome || '?').trim().split(' ');
    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  // ---------- Conversão para o card ----------

  private deEncontro(encontro: Encontro): ItemEncontro {
    return {
      origem: 'encontro',
      id: encontro.id as number,
      tipo: encontro.tipo?.nome || 'Encontro',
      titulo: encontro.titulo,
      data: new Date(`${encontro.data}T${(encontro.hora || '00:00').slice(0, 5)}`),
      descricao: encontro.descricao,
      maestro: encontro.maestro?.nome,
      evento: encontro.evento?.titulo,
      musicos: encontro.interessados || [],
      rotuloMusicos: 'CONFIRMARAM PRESENÇA'
    };
  }

  private deEnsaio(ensaio: Ensaio): ItemEncontro {
    return {
      origem: 'ensaio',
      id: ensaio.id as number,
      tipo: ensaio.tipo || 'Ensaio',
      titulo: ensaio.titulo || 'Ensaio',
      data: new Date(ensaio.data),
      descricao: ensaio.descricao,
      maestro: ensaio.maestro?.nome,
      evento: ensaio.evento?.titulo,
      musicos: ensaio.musicos || [],
      rotuloMusicos: 'MÚSICOS ESCALADOS'
    };
  }

  private async mostrarToast(message: string, color: string) {
    const toast = await this.toastController.create({ message, duration: 2000, color });
    await toast.present();
  }
}
