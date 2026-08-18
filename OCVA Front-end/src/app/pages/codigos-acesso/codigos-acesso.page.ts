import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton,
  IonItem, IonLabel, IonButton, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonBadge, IonList, IonIcon,
  IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { copyOutline, trashOutline, refreshOutline } from 'ionicons/icons';
import { CodigoAcessoService } from 'src/app/services/codigo-acesso-service';
import { CodigoAcesso } from 'src/app/models/codigo-acesso';

@Component({
  selector: 'app-codigos-acesso',
  templateUrl: './codigos-acesso.page.html',
  styleUrls: ['./codigos-acesso.page.scss'],
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    IonIcon, IonList, IonBadge, IonLabel, IonItem, IonBackButton,
    IonButtons, IonButton, IonContent, IonHeader, IonToolbar,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle,
    IonSelect, IonSelectOption
  ]
})
export class CodigosAcessoPage implements OnInit {
  codigos: CodigoAcesso[] = [];
  filtroStatus = 'todos';
  carregando = false;
  formGroup: FormGroup;

  constructor(
    private service: CodigoAcessoService,
    private toastCtrl: ToastController,
    private formBuilder: FormBuilder
  ) {
    addIcons({ copyOutline, trashOutline, refreshOutline });
    this.formGroup = this.formBuilder.group({
      filtro: ['todos']
    });
  }

  ngOnInit() {
    this.carregarCodigos();
  }

  ionViewWillEnter() {
    this.carregarCodigos();
  }

  carregarCodigos() {
    this.carregando = true;
    this.service.listarCodigos().subscribe({
      next: (res) => {
        this.codigos = Array.isArray(res) ? res : [];
        this.carregando = false;
      },
      error: () => {
        this.mostrarMensagem('Erro ao carregar códigos');
        this.carregando = false;
      }
    });
  }

  gerarNovoCodigo() {
    this.service.gerarCodigo().subscribe({
      next: (novo) => {
        this.codigos.unshift(novo);
        this.mostrarMensagem(`Código gerado: ${novo.codigo}`);
      },
      error: () => this.mostrarMensagem('Erro ao gerar código na API')
    });
  }

  deletarCodigo(codigo: string) {
    this.service.deletarCodigo(codigo).subscribe({
      next: () => {
        this.codigos = this.codigos.filter(c => c.codigo !== codigo);
        this.mostrarMensagem('Código deletado com sucesso');
      },
      error: () => this.mostrarMensagem('Erro ao deletar código')
    });
  }

  copiarCodigo(codigo: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(codigo);
      this.mostrarMensagem(`Código ${codigo} copiado!`);
    }
  }

  aplicarFiltro() {
    this.filtroStatus = this.formGroup.get('filtro')?.value || 'todos';
  }

  get codigosFiltrados(): CodigoAcesso[] {
    if (this.filtroStatus === 'todos') return this.codigos;
    return this.codigos.filter(c => c.status === this.filtroStatus);
  }

  getCorStatus(status: string): string {
    const cores: Record<string, string> = {
      disponivel: 'success',
      usado: 'primary',
      expirado: 'warning'
    };
    return cores[status] || 'medium';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      disponivel: 'Disponível',
      usado: 'Usado',
      expirado: 'Expirado'
    };
    return labels[status] || status;
  }

  formatarData(data: any): string {
    if (!data) return '-';
    const d = new Date(data);
    return isNaN(d.getTime()) ? '-' : `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR')}`;
  }

  private async mostrarMensagem(mensagem: string) {
    const toast = await this.toastCtrl.create({
      message: mensagem,
      duration: 2500,
      position: 'bottom'
    });
    await toast.present();
  }
}