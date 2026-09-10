import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastController } from '@ionic/angular';
import {
  IonBackButton,
  IonBadge,
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/angular/standalone';
import { EnsaiosService } from '../../services/ensaios-service';

@Component({
  selector: 'app-ensaio-detalhe',
  templateUrl: './ensaio-detalhe.page.html',
  styleUrls: ['./ensaio-detalhe.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonBackButton,
    IonBadge,
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
    IonTitle,
    IonToolbar
  ]
})
export class EnsaioDetalhePage implements OnInit {
  ensaio: any = null;
  carregando = true;
  usuarioAutenticado: any = null;
  marcacoesEmAndamento = new Set<number>();

  constructor(
    private route: ActivatedRoute,
    private ensaiosService: EnsaiosService,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.usuarioAutenticado = JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}');
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.carregando = false;
      return;
    }

    this.ensaiosService.buscarPorId(id).subscribe({
      next: (ensaio) => {
        this.ensaio = ensaio;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });
  }

  podeMarcarPresenca(): boolean {
    return this.usuarioAutenticado?.tipo === 'maestro' || this.usuarioAutenticado?.tipo === 'diretoria';
  }

  estaPresente(musico: any): boolean {
    return (this.ensaio?.presencas || []).some((item: any) => item.id === musico.id);
  }

  estaAusente(musico: any): boolean {
    return (this.ensaio?.faltas || []).some((item: any) => item.id === musico.id);
  }

  jaFoiMarcado(musico: any): boolean {
    return this.estaPresente(musico) || this.estaAusente(musico) || this.marcacoesEmAndamento.has(musico.id);
  }

  async marcarPresenca(musico: any, presente: boolean) {
    if (!this.podeMarcarPresenca() || !this.ensaio?.id || !musico.id || this.jaFoiMarcado(musico)) {
      return;
    }

    this.marcacoesEmAndamento.add(musico.id);

    this.ensaiosService.marcarPresenca(this.ensaio.id, musico.id, presente).subscribe({
      next: async (ensaioAtualizado) => {
        this.ensaio = ensaioAtualizado;
        this.marcacoesEmAndamento.delete(musico.id);
        const toast = await this.toastController.create({
          message: presente ? `${musico.nome} marcado como presente` : `${musico.nome} marcado como falta`,
          duration: 1500,
          color: presente ? 'success' : 'warning'
        });
        await toast.present();
      },
      error: async () => {
        this.marcacoesEmAndamento.delete(musico.id);
        const toast = await this.toastController.create({ message: 'Não foi possível salvar a presença', duration: 2000, color: 'danger' });
        await toast.present();
      }
    });
  }
}
