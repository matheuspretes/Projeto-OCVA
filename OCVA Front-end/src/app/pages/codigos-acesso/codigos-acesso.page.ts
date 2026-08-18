import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonButtons,
  IonBackButton, IonItem, IonInput, IonLabel, IonButton, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonBadge, IonList, IonIcon, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { CodigoAcessoService } from 'src/app/services/codigo-acesso-service';
import { CodigoAcesso } from 'src/app/models/codigo-acesso';
import { ToastController, AlertController, LoadingController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { copyOutline, trashOutline, refreshOutline, fileTrayOutline } from 'ionicons/icons';

@Component({
  selector: 'app-codigos-acesso',
  templateUrl: './codigos-acesso.page.html',
  styleUrls: ['./codigos-acesso.page.scss'],
  standalone: true,
  imports: [
    IonIcon, IonList, IonBadge, IonLabel, IonInput, IonItem, IonBackButton,
    IonButtons, IonButton, IonContent, IonHeader, IonToolbar, IonCard, IonCardContent,
    IonCardHeader, IonCardTitle, CommonModule, FormsModule, ReactiveFormsModule, RouterLink,
    IonSelect, IonSelectOption
  ]
})
export class CodigosAcessoPage implements OnInit {
  private readonly CODIGOS_LOCAL_STORAGE_KEY = 'ocva_codigos_acesso_local';
  codigos: CodigoAcesso[] = [];
  filtroStatus: 'todos' | 'disponivel' | 'usado' | 'expirado' = 'todos';
  carregando = false;
  formGroup: FormGroup;

  constructor(
    private codigoAcessoService: CodigoAcessoService,
    private toastController: ToastController,
    private alertController: AlertController,
    private formBuilder: FormBuilder,
    private loadingController: LoadingController
  ) {
    addIcons({ copyOutline, trashOutline, refreshOutline, fileTrayOutline });

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

    this.codigoAcessoService.listarCodigos().subscribe({
      next: (codigos) => {
        this.codigos = Array.isArray(codigos) ? codigos : [];
        this.aplicarFiltro();
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar códigos:', erro);
        this.codigos = this.carregarCodigosLocais();
        this.aplicarFiltro();
        this.exibirMensagem('API indisponível. Carregando códigos locais.');
        this.carregando = false;
      }
    });
  }
  gerarNovoCodigo() {
    this.alertController.create({
      header: 'Gerar Novo Código',
      message: 'Tem certeza que deseja gerar um novo código de acesso?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Gerar',
          handler: () => {
            this.executarGeracaoCodigo();
          }
        }
      ]
    }).then(alert => alert.present());
  }

  private async executarGeracaoCodigo() {
    const loading = await this.loadingController.create({
      message: 'Gerando código...'
    });
    await loading.present();

    this.codigoAcessoService.gerarCodigo().subscribe({
      next: (novoCodigo) => {
        loading.dismiss();
        this.codigos.unshift(novoCodigo);
        this.salvarCodigosLocais();
        this.aplicarFiltro();
        this.exibirMensagem(`Código gerado: ${novoCodigo.codigo}`);
      },
      error: (erro) => {
        console.error('Erro ao gerar código:', erro);
        loading.dismiss();
        this.gerarCodigoLocalComoFallback();
      }
    });
  }

  private gerarCodigoLocalComoFallback() {
    const codigoLocal = new CodigoAcesso(this.criarCodigoAleatorio(8));
    codigoLocal.status = 'disponivel';
    codigoLocal.dataCriacao = new Date();

    this.codigos.unshift(codigoLocal);
    this.salvarCodigosLocais();
    this.aplicarFiltro();
    this.exibirMensagem(`Código local gerado: ${codigoLocal.codigo}`);
  }

  private criarCodigoAleatorio(tamanho: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let resultado = '';

    for (let i = 0; i < tamanho; i++) {
      const indice = Math.floor(Math.random() * chars.length);
      resultado += chars.charAt(indice);
    }

    return resultado;
  }

  copiarCodigo(codigo: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(codigo).then(() => {
        this.exibirMensagem(`Código ${codigo} copiado!`);
      }).catch(err => {
        console.error('Erro ao copiar:', err);
        this.exibirMensagem('Erro ao copiar código');
      });
    }
  }

  deletarCodigo(codigo: string) {
    this.alertController.create({
      header: 'Deletar Código',
      message: `Tem certeza que deseja deletar o código ${codigo}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Deletar',
          role: 'destructive',
          handler: () => {
            this.executarDelecao(codigo);
          }
        }
      ]
    }).then(alert => alert.present());
  }

  private executarDelecao(codigo: string) {
    this.codigoAcessoService.deletarCodigo(codigo).subscribe({
      next: () => {
        this.codigos = this.codigos.filter(c => c.codigo !== codigo);
        this.salvarCodigosLocais();
        this.aplicarFiltro();
        this.exibirMensagem('Código deletado com sucesso');
      },
      error: (erro) => {
        console.error('Erro ao deletar código:', erro);
        const quantidadeAntes = this.codigos.length;
        this.codigos = this.codigos.filter(c => c.codigo !== codigo);

        if (this.codigos.length < quantidadeAntes) {
          this.salvarCodigosLocais();
          this.aplicarFiltro();
          this.exibirMensagem('Código local deletado com sucesso');
          return;
        }

        this.exibirMensagem('Erro ao deletar código. Ele pode estar em uso.');
      }
    });
  }

  private salvarCodigosLocais() {
    localStorage.setItem(this.CODIGOS_LOCAL_STORAGE_KEY, JSON.stringify(this.codigos));
  }

  private carregarCodigosLocais(): CodigoAcesso[] {
    const conteudo = localStorage.getItem(this.CODIGOS_LOCAL_STORAGE_KEY);
    if (!conteudo) {
      return [];
    }

    try {
      const codigos = JSON.parse(conteudo) as CodigoAcesso[];
      return Array.isArray(codigos) ? codigos : [];
    } catch {
      return [];
    }
  }

  aplicarFiltro() {
    this.filtroStatus = this.formGroup.get('filtro')?.value || 'todos';
  }

  get codigosFiltrados(): CodigoAcesso[] {
    if (!this.codigos) return [];
    if (this.filtroStatus === 'todos') {
      return this.codigos;
    }
    return this.codigos.filter(c => c.status === this.filtroStatus);
  }

  getCorStatus(status: string): string {
    switch (status) {
      case 'disponivel':
        return 'success';
      case 'usado':
        return 'primary';
      case 'expirado':
        return 'warning';
      default:
        return 'medium';
    }
  }
  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'disponivel': 'Disponível',
      'usado': 'Usado',
      'expirado': 'Expirado'
    };
    return labels[status] || status;
  }

  formatarData(data: any): string {
    if (!data) return '-';
    const d = new Date(data);
    return isNaN(d.getTime()) ? '-' : `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR')}`;
  }

  private async exibirMensagem(mensagem: string) {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      position: 'bottom'
    });
    await toast.present();
  }
}