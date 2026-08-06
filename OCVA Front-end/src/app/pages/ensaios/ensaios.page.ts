import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonBackButton, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle, 
  IonCardContent, 
  IonChip,         
  IonLabel,
  IonButton
} from '@ionic/angular/standalone';
import { EnsaiosService } from '../../services/ensaios-service'; // Ajuste o caminho se necessário
import { UsuarioService } from '../../services/usuario-service'; // Ajuste o caminho se necessário
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

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
    IonTitle, 
    IonToolbar, 
    IonButtons, 
    IonBackButton, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardSubtitle, 
    IonCardContent,
    IonChip,         
    IonLabel,
    IonButton        
  ]
})
export class EnsaiosPage implements OnInit {
  
  // Alterado para any[] para evitar erros de compilação com propriedades dinâmicas no HTML
  ensaios: any[] = []; 
  usuarioAutenticado: any = null;

  constructor(
    private ensaiosService: EnsaiosService,
    private usuarioService: UsuarioService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    // 1. Recupera o usuário que está logado no sistema
    this.usuarioAutenticado = this.usuarioService.buscarAutenticacao();

    this.ensaiosService.listar().subscribe({
      next: (todosOsEnsaios) => {
        let ensaiosFiltrados: any[] = [];

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

  editarEnsaio(ensaio: any) {
    if (!ensaio.id) {
      return;
    }

    this.router.navigate(['/criar-ensaio'], { queryParams: { id: ensaio.id } });
  }

  async excluirEnsaio(ensaio: any) {
    if (!ensaio.id) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este ensaio?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.ensaiosService.excluir(ensaio.id as number).subscribe({
              next: async () => {
                const toast = await this.toastController.create({ message: 'Ensaio excluído com sucesso', duration: 1500, color: 'warning' });
                await toast.present();
                this.ngOnInit();
              },
              error: async () => {
                const toast = await this.toastController.create({ message: 'Erro ao excluir ensaio', duration: 2000, color: 'danger' });
                await toast.present();
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  async confirmarPresenca(ensaio: any) {
    if (!this.podeEditarOuExcluir()) {
      return;
    }

    const inputs = (ensaio.musicos || []).map((musico: any, index: number) => ({
      name: 'presentes',
      type: 'checkbox' as const,
      label: musico.nome,
      value: musico,
      checked: true,
      id: `musico-${ensaio.id}-${index}`
    }));

    if (inputs.length === 0) {
      const toast = await this.toastController.create({ message: 'Não há músicos cadastrados para confirmar', duration: 2000, color: 'warning' });
      await toast.present();
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar presença',
      message: 'Selecione os músicos presentes neste ensaio',
      inputs,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salvar',
          handler: (selecionados: any[]) => {
            const ensaioAtualizado = {
              ...ensaio,
              musicos: selecionados || []
            };

            this.ensaiosService.editar(ensaioAtualizado).subscribe({
              next: async () => {
                const toast = await this.toastController.create({ message: 'Presença confirmada com sucesso', duration: 1500, color: 'success' });
                await toast.present();
                this.ngOnInit();
              },
              error: async () => {
                const toast = await this.toastController.create({ message: 'Erro ao confirmar presença', duration: 2000, color: 'danger' });
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