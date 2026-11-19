import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonIcon, IonInput, IonLabel, IonSpinner, IonTextarea, ToastController } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { addCircleOutline, arrowBackOutline, calendarOutline, imageOutline } from 'ionicons/icons';
import { finalize, timeout } from 'rxjs';
import { AppLayoutComponent } from 'src/app/components/app-layout/app-layout.component';
import { EventoMarcadoRequest } from 'src/app/models/evento-marcado';
import { EventosMarcadosService } from 'src/app/services/eventos-marcados-service';
import { UsuarioService } from 'src/app/services/usuario-service';

@Component({
  selector: 'app-marcar-evento',
  templateUrl: './marcar-evento.page.html',
  // Reaproveita o visual dos formulários de evento
  styleUrls: ['../criar-evento/criar-evento.page.scss'],
  standalone: true,
  imports: [AppLayoutComponent, CommonModule, ReactiveFormsModule, RouterLink, IonIcon, IonLabel, IonInput, IonTextarea, IonButton, IonSpinner]
})
export class MarcarEventoPage implements OnInit {
  @ViewChild('bannerInput') private bannerInput?: ElementRef<HTMLInputElement>;

  formGroup: FormGroup;
  eventoId: number | null = null;
  modoEdicao = false;
  isSaving = false;
  bannerPreview = '';
  hoje = this.dataLocal(new Date());

  constructor(
    private formBuilder: FormBuilder,
    private eventosMarcadosService: EventosMarcadosService,
    private usuarioService: UsuarioService,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({ addCircleOutline, arrowBackOutline, calendarOutline, imageOutline });

    this.formGroup = this.formBuilder.group({
      titulo: ['', [Validators.required, Validators.maxLength(120)]],
      data: ['', Validators.required],
      hora: ['', Validators.required],
      local: ['', [Validators.required, Validators.maxLength(160)]],
      descricao: ['', Validators.required]
    });
  }

  ngOnInit() {
    const usuario = this.usuarioService.buscarAutenticacao();
    if (usuario?.tipo !== 'maestro' && usuario?.tipo !== 'diretoria') {
      this.router.navigate(['/inicio']);
      return;
    }

    const idParam = this.route.snapshot.queryParamMap.get('id');
    const id = Number(idParam);
    if (idParam && !Number.isNaN(id)) {
      this.eventoId = id;
      this.modoEdicao = true;
      this.carregarEvento(id);
    }
  }

  private carregarEvento(id: number) {
    this.isSaving = true;
    this.eventosMarcadosService.buscarPorId(id).pipe(finalize(() => this.isSaving = false)).subscribe({
      next: (evento) => {
        this.formGroup.patchValue({
          titulo: evento.titulo,
          data: evento.data,
          hora: (evento.hora || '').slice(0, 5),
          local: evento.local,
          descricao: evento.descricao
        });
        this.bannerPreview = evento.banner || '';
      },
      error: async () => {
        await this.mostrarToast('Não foi possível carregar o evento.', 'danger');
        this.router.navigate(['/inicio']);
      }
    });
  }

  salvar() {
    if (this.formGroup.invalid || this.isSaving) {
      this.formGroup.markAllAsTouched();
      this.mostrarToast('Preencha todos os campos.', 'warning');
      return;
    }

    const form = this.formGroup.value;
    const usuario = this.usuarioService.buscarAutenticacao();
    const evento: EventoMarcadoRequest = {
      id: this.eventoId ?? undefined,
      titulo: form.titulo.trim(),
      data: String(form.data).slice(0, 10),
      hora: String(form.hora).slice(0, 5),
      local: form.local.trim(),
      descricao: form.descricao.trim(),
      banner: this.bannerPreview || undefined,
      criadorId: usuario?.id
    };

    const requisicao = this.modoEdicao
      ? this.eventosMarcadosService.editar(evento)
      : this.eventosMarcadosService.salvar(evento);

    this.isSaving = true;
    requisicao.pipe(timeout(30000), finalize(() => this.isSaving = false)).subscribe({
      next: async () => {
        await this.mostrarToast(this.modoEdicao ? 'Evento atualizado.' : 'Evento marcado!', 'success');
        this.router.navigate(['/inicio']);
      },
      error: (erro) => {
        const mensagem = erro?.status === 413
          ? 'A descrição ou o banner do evento é muito grande.'
          : erro?.error?.message || 'Não foi possível salvar o evento.';
        this.mostrarToast(mensagem, 'danger');
      }
    });
  }

  async excluir() {
    if (!this.eventoId) {
      return;
    }
    const alert = await this.alertController.create({
      header: 'Desmarcar evento',
      message: 'Tem certeza que deseja desmarcar este evento?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desmarcar',
          role: 'destructive',
          handler: () => {
            this.eventosMarcadosService.excluir(this.eventoId as number).subscribe({
              next: async () => {
                await this.mostrarToast('Evento desmarcado.', 'warning');
                this.router.navigate(['/inicio']);
              },
              error: (erro) => this.mostrarToast(erro?.error?.message || 'Não foi possível desmarcar o evento.', 'danger')
            });
          }
        }
      ]
    });
    await alert.present();
  }

  cancelar() {
    this.router.navigate(['/inicio']);
  }

  // ---------- Banner (mesma lógica do cadastro de evento) ----------

  abrirSeletorDeBanner() {
    this.bannerInput?.nativeElement.click();
  }

  removerBanner(event: Event) {
    event.stopPropagation();
    this.bannerPreview = '';
  }

  aoSelecionarBanner(event: Event) {
    const arquivo = (event.target as HTMLInputElement).files?.[0];
    if (arquivo) {
      this.carregarBanner(arquivo);
    }
  }

  aoSoltarBanner(event: DragEvent) {
    event.preventDefault();
    const arquivo = event.dataTransfer?.files?.[0];
    if (arquivo) {
      this.carregarBanner(arquivo);
    }
  }

  private carregarBanner(arquivo: File) {
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(arquivo.type)) {
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onload = () => {
        const escala = Math.min(1, 1280 / Math.max(imagem.width, imagem.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(imagem.width * escala));
        canvas.height = Math.max(1, Math.round(imagem.height * escala));
        canvas.getContext('2d')?.drawImage(imagem, 0, 0, canvas.width, canvas.height);
        this.bannerPreview = canvas.toDataURL('image/jpeg', 0.82);
      };
      imagem.src = typeof leitor.result === 'string' ? leitor.result : '';
    };
    leitor.readAsDataURL(arquivo);
  }

  private async mostrarToast(message: string, color: string) {
    const toast = await this.toastController.create({ message, duration: 2500, color });
    await toast.present();
  }

  private dataLocal(data: Date): string {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  }
}
