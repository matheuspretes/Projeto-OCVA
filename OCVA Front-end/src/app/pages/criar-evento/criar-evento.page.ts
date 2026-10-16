import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonDatetime, IonHeader, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonSpinner, IonTextarea, IonToolbar, IonIcon, ToastController } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Ensaio } from 'src/app/models/ensaio';
import { Usuario } from 'src/app/models/usuario';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { EventosService } from 'src/app/services/eventos-service';
import { UsuarioService } from 'src/app/services/usuario-service';
import { Evento } from 'src/app/models/evento';
import { addIcons } from 'ionicons';
import { arrowBackOutline, calendarOutline, imageOutline, locationOutline, musicalNotesOutline, timeOutline } from 'ionicons/icons';
import { ElementRef, ViewChild } from '@angular/core';
import { finalize, timeout } from 'rxjs';

@Component({
  selector: 'app-criar-evento',
  templateUrl: './criar-evento.page.html',
  styleUrls: ['./criar-evento.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonDatetime, IonSelect, IonSelectOption, IonInput, IonSpinner, IonTextarea, IonIcon, IonButton, RouterLink]
})
export class CriarEventoPage implements OnInit {
  @ViewChild('bannerInput') private bannerInput?: ElementRef<HTMLInputElement>;

  formGroup: FormGroup;
  musicos: Usuario[] = [];
  todosOsMusicos: Usuario[] = [];
  musicosElegiveis: Usuario[] = [];
  termoBuscaMusico = '';
  submitted = false;
  isSaving = false;
  eventoId: number | null = null;
  modoEdicao = false;
  bannerPreview = '';

  constructor(
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService,
    private ensaiosService: EnsaiosService,
    private eventosService: EventosService,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({
      arrowBackOutline,
      calendarOutline,
      imageOutline,
      locationOutline,
      musicalNotesOutline,
      timeOutline
    });

    this.formGroup = this.formBuilder.group({
      titulo: ['', Validators.required],
      data: ['', Validators.compose([Validators.required])],
      horario: ['', Validators.required],
      local: ['', Validators.required],
      descricao: ['', Validators.compose([Validators.required])],
      musicos: [[]]
    });
  }

  ngOnInit() {
    const usuarioAutenticado = this.usuarioService.buscarAutenticacao();
    if (usuarioAutenticado?.tipo !== 'diretoria') {
      this.router.navigate(['/eventos']);
      return;
    }

    this.ensaiosService.listar().subscribe({
      next: (ensaios) => {
        this.usuarioService.listar().subscribe({
          next: (usuarios) => {
            this.todosOsMusicos = usuarios.filter((usuario) => usuario.tipo === 'musico');
            this.musicosElegiveis = this.filtrarMusicosComMinimoDePresencas(this.todosOsMusicos, ensaios, 2);
            this.musicos = this.musicosElegiveis;
          },
          error: () => {
            this.musicos = [];
          }
        });
      },
      error: () => {
        this.musicos = [];
      }
    });

    this.route.queryParamMap.subscribe((params) => {
      const idParam = params.get('id');
      if (!idParam) {
        this.modoEdicao = false;
        this.eventoId = null;
        return;
      }

      const id = Number(idParam);
      if (Number.isNaN(id)) {
        return;
      }

      this.eventoId = id;
      this.modoEdicao = true;
      this.carregarEvento(id);
    });
  }

  private filtrarMusicosComMinimoDePresencas(usuarios: Usuario[], ensaios: Ensaio[], minimoPresencas: number): Usuario[] {
    const presencasPorMusico = new Map<number, number>();
    const faltasPorMusico = new Map<number, number>();

    ensaios.forEach((ensaio) => {
      (ensaio.presencas || []).forEach((musico) => {
        if (!musico || musico.id == null) {
          return;
        }

        const presencasAtuais = presencasPorMusico.get(musico.id) || 0;
        presencasPorMusico.set(musico.id, presencasAtuais + 1);
      });

      (ensaio.faltas || []).forEach((musico) => {
        if (!musico || musico.id == null) {
          return;
        }

        const faltasAtuais = faltasPorMusico.get(musico.id) || 0;
        faltasPorMusico.set(musico.id, faltasAtuais + 1);
      });
    });

    return usuarios.filter((usuario) => {
      const presencas = presencasPorMusico.get(usuario.id) || 0;
      const faltas = faltasPorMusico.get(usuario.id) || 0;
      const totalMarcacoes = presencas + faltas;
      const percentualDeFaltas = totalMarcacoes > 0 ? faltas / totalMarcacoes : 1;

      return usuario.tipo === 'musico'
        && presencas >= minimoPresencas
        && percentualDeFaltas <= 0.25;
    });
  }

  buscarMusicos() {
    const termo = this.termoBuscaMusico.trim().toLocaleLowerCase();
    if (!termo) {
      this.musicos = this.musicosElegiveis;
      return;
    }

    const resultados = this.todosOsMusicos.filter((musico) =>
      (musico.nome || '').toLocaleLowerCase().includes(termo)
      || (musico.login || '').toLocaleLowerCase().includes(termo)
    );

    this.musicos = Array.from(new Map(
      [...this.musicosElegiveis, ...resultados].map((musico) => [musico.id, musico])
    ).values());
  }

  private carregarEvento(id: number) {
    this.isSaving = true;
    this.eventosService.buscarPorId(id).subscribe({
      next: (evento) => {
        this.formGroup.patchValue({
          titulo: evento.titulo || '',
          data: evento.data?.split('T')[0] || evento.data,
          horario: evento.data?.split('T')[1]?.slice(0, 5) || '',
          local: evento.local || '',
          banner: evento.banner || '',
          descricao: evento.descricao,
          musicos: evento.musicos || []
        });
        this.bannerPreview = evento.banner || '';
        this.isSaving = false;
      },
      error: async () => {
        this.isSaving = false;
        const errorToast = await this.toastController.create({ message: 'Não foi possível carregar o evento', duration: 2000, color: 'danger' });
        await errorToast.present();
        this.router.navigate(['/eventos']);
      }
    });
  }

  async salvar() {
    this.submitted = true;
    this.isSaving = true;
    if (this.formGroup.invalid) {
      const t = await this.toastController.create({ message: 'Preencha todos os campos', duration: 2000, color: 'red' });
      await t.present();
      this.isSaving = false;
      return;
    }

    const form = this.formGroup.value;
    const evento: Evento = {
      id: this.eventoId ?? undefined,
      titulo: form.titulo,
      data: `${this.formatDateOnly(form.data)}T${form.horario}:00`,
      local: form.local,
      banner: this.bannerPreview || undefined,
      descricao: form.descricao,
      musicos: form.musicos || []
    };

    const requisicao = this.modoEdicao && this.eventoId
      ? this.eventosService.editar(evento)
      : this.eventosService.salvar(evento);

    requisicao.pipe(
      timeout(30000),
      finalize(() => {
        this.isSaving = false;
      })
    ).subscribe({
      next: async () => {
        this.isSaving = false;
        const success = await this.toastController.create({ message: this.modoEdicao ? 'Evento atualizado com sucesso' : 'Evento salvo com sucesso', duration: 1500, color: 'success' });
        await success.present();

        this.formGroup.reset({ titulo: '', data: '', horario: '', local: '', descricao: '', musicos: [] });
        this.bannerPreview = '';
        this.router.navigate(['/eventos']);
      },
      error: async (error) => {
        const mensagem = error?.status === 400
          ? 'Verifique os dados informados para o evento.'
          : error?.status === 413
            ? 'A descrição ou o banner do evento é muito grande.'
            : this.modoEdicao
              ? 'Não foi possível atualizar o evento. Verifique se a API está disponível.'
              : 'Não foi possível salvar o evento. Verifique se a API está disponível.';
        const errorToast = await this.toastController.create({
          message: mensagem,
          duration: 3000,
          color: 'danger'
        });
        await errorToast.present();
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.formGroup.get(controlName);
    if (!control) return false;
    return control.invalid && (control.touched || control.dirty || this.submitted);
  }

  abrirSeletorDeBanner() {
    this.bannerInput?.nativeElement.click();
  }

  aoSelecionarBanner(event: Event) {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
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
    const tiposPermitidos = ['image/png', 'image/jpeg', 'image/webp'];
    if (!tiposPermitidos.includes(arquivo.type)) {
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      const imagem = new Image();
      imagem.onload = () => {
        const limite = 1280;
        const escala = Math.min(1, limite / Math.max(imagem.width, imagem.height));
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

  formatDateOnly(value: any): string {
    if (!value) return '';
    if (typeof value === 'string') {
      const tIndex = value.indexOf('T');
      if (tIndex > 0) return value.slice(0, tIndex);
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      } catch {
        return value;
      }
    }
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    } catch {

    }
    return '';
  }

  cancelar() {
    this.formGroup.reset({ titulo: '', data: '', horario: '', local: '', descricao: '', musicos: [] });
    this.bannerPreview = '';
    this.router.navigate(['/inicio']);
  }

  async excluir() {
    if (!this.modoEdicao || !this.eventoId) {
      const ok = window.confirm('Deseja descartar este evento?');
      if (!ok) {
        return;
      }
      this.formGroup.reset({ data: '', descricao: '', musicos: [] });
      const t = await this.toastController.create({ message: 'Evento descartado', duration: 1500, color: 'warning' });
      await t.present();
      this.router.navigate(['/eventos']);
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este evento?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.eventosService.excluir(this.eventoId as number).subscribe({
              next: async () => {
                const t = await this.toastController.create({ message: 'Evento excluído com sucesso', duration: 1500, color: 'warning' });
                await t.present();
                this.router.navigate(['/eventos']);
              },
              error: async () => {
                const t = await this.toastController.create({ message: 'Erro ao excluir o evento', duration: 2000, color: 'danger' });
                await t.present();
              }
            });
          }
        }
      ]
    });

    await alert.present();
  }

  sairDaConta() {
    this.usuarioService.encerrarAutenticacao();
    this.router.navigate(['/login']);
  }
}
