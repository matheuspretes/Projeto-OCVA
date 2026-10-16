import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';
import { AlertController, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  musicalNotesOutline, 
  musicalNote, 
  calendarOutline, 
  peopleOutline, 
  createOutline, 
  trashOutline,
  addOutline
} from 'ionicons/icons';

import { EnsaiosService } from '../../services/ensaios-service';
import { UsuarioService } from '../../services/usuario-service';
import { Ensaio } from '../../models/ensaio';

@Component({
  selector: 'app-ensaios',
  templateUrl: './ensaios.page.html',
  styleUrls: ['./ensaios.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink,
    IonContent, 
    IonHeader, 
    IonToolbar, 
    IonButton,
    IonIcon
  ]
})
export class EnsaiosPage implements OnInit {
  ensaios: any[] = []; 
  usuarioAutenticado: any = null;

  constructor(
    private ensaiosService: EnsaiosService,
    private usuarioService: UsuarioService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      musicalNotesOutline,
      musicalNote,
      calendarOutline,
      peopleOutline,
      createOutline,
      trashOutline,
      addOutline
    });
  }

  ngOnInit() {
    this.carregarEnsaios();
  }

  carregarEnsaios() {
    this.usuarioAutenticado = this.usuarioService.buscarAutenticacao();

    this.ensaiosService.listar().subscribe({
      next: (todosOsEnsaios: Ensaio[]) => {
        let ensaiosFiltrados: Ensaio[] = [];

        if (this.usuarioAutenticado && (this.usuarioAutenticado.tipo === 'maestro' || this.usuarioAutenticado.tipo === 'diretoria')) {
          ensaiosFiltrados = todosOsEnsaios;
        } else if (this.usuarioAutenticado) {
          const userLogin = this.usuarioAutenticado.login;
          const userId = this.usuarioAutenticado.id;

          ensaiosFiltrados = todosOsEnsaios.filter((ensaio: any) =>
            (ensaio.musicos || []).some((m: any) => m.login === userLogin || m.id === userId)
          );
        }

        this.ensaios = ensaiosFiltrados.map((ensaio: any) => ({
          ...ensaio,
          dataExibicao: this.formatarDataExibicao(ensaio.data),
          nomesMusicos: (ensaio.musicos || []).map((m: any) => m.nome)
        }));
      },
      error: () => {
        this.ensaios = [];
      }
    });
  }

  podeEditarOuExcluir(): boolean {
    return this.usuarioAutenticado?.tipo === 'maestro';
  }

  criarNovoEnsaio() {
    this.router.navigate(['/criar-ensaio']);
  }

  editarEnsaio(ensaio: any) {
    if (!ensaio.id) return;
    this.router.navigate(['/criar-ensaio'], { queryParams: { id: ensaio.id } });
  }

  abrirDetalhes(ensaio: any) {
    if (ensaio.id) {
      this.router.navigate(['/ensaios', ensaio.id]);
    }
  }

  getIniciais(nome: string): string {
    if (!nome) return '';
    const partes = nome.trim().split(' ');
    if (partes.length === 1) {
      return partes[0].substring(0, 2).toUpperCase();
    }
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  formatarDataExibicao(dataOriginal: string): string {
    if (!dataOriginal) return '';
    const data = new Date(dataOriginal);
    if (isNaN(data.getTime())) return dataOriginal;

    const dataFormatada = data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const diaSemana = data.toLocaleDateString('pt-BR', { weekday: 'long' });
    const diaSemanaCapitalizado = diaSemana.charAt(0).toUpperCase() + diaSemana.slice(1);

    const horaFormatada = data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    }).replace(':', 'h');

    return `${dataFormatada} · ${diaSemanaCapitalizado} · ${horaFormatada}`;
  }

  async excluirEnsaio(ensaio: any) {
    console.log('Dados do ensaio a excluir:', ensaio);
    const ensaioId = Number(ensaio?.id);
    if (!Number.isInteger(ensaioId) || ensaioId <= 0)
    return;
  

    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este ensaio?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.ensaiosService.excluir(ensaioId).subscribe({
              next: async () => {
                const toast = await this.toastController.create({ 
                  message: 'Ensaio excluído com sucesso', 
                  duration: 1500, 
                  color: 'warning' 
                });
                await toast.present();
                this.carregarEnsaios();
              },
              error: async () => {
                const toast = await this.toastController.create({ 
                  message: 'Erro ao excluir ensaio', 
                  duration: 2000, 
                  color: 'danger' 
                });
                await toast.present();
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }
}