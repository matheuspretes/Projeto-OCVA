import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonDatetime, IonHeader, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonSpinner, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Ensaio } from 'src/app/models/ensaio';
import { Usuario } from 'src/app/models/usuario';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { EventosService } from 'src/app/services/eventos-service';
import { UsuarioService } from 'src/app/services/usuario-service';
import { Evento } from 'src/app/models/evento';

@Component({
  selector: 'app-criar-evento',
  templateUrl: './criar-evento.page.html',
  styleUrls: ['./criar-evento.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonDatetime, IonSelect, IonSelectOption, IonInput, IonSpinner, IonButton, RouterLink]
})
export class CriarEventoPage implements OnInit {
  formGroup: FormGroup;
  musicos: Usuario[] = [];
  submitted = false;
  isSaving = false;
  eventoId: number | null = null;
  modoEdicao = false;

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
    this.formGroup = this.formBuilder.group({
      data: ['', Validators.compose([Validators.required])],
      descricao: ['', Validators.compose([Validators.required])]
      ,musicos: [[], Validators.compose([Validators.required])]
    });
  }

  ngOnInit() {
    this.ensaiosService.listar().subscribe({
      next: (ensaios) => {
        this.usuarioService.listar().subscribe({
          next: (usuarios) => {
            this.musicos = this.filtrarMusicosComMinimoDePresencas(usuarios, ensaios, 2);
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

    ensaios.forEach((ensaio) => {
      (ensaio.musicos || []).forEach((musico) => {
        if (!musico || musico.id == null) {
          return;
        }

        const presencasAtuais = presencasPorMusico.get(musico.id) || 0;
        presencasPorMusico.set(musico.id, presencasAtuais + 1);
      });
    });

    return usuarios.filter((usuario) => usuario.tipo === 'musico' && (presencasPorMusico.get(usuario.id) || 0) >= minimoPresencas);
  }

  private carregarEvento(id: number) {
    this.isSaving = true;
    this.eventosService.buscarPorId(id).subscribe({
      next: (evento) => {
        this.formGroup.patchValue({
          data: evento.data,
          descricao: evento.descricao,
          musicos: evento.musicos || []
        });
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
      data: this.formatDateOnly(form.data),
      descricao: form.descricao,
      musicos: form.musicos || []
    };

    const requisicao = this.modoEdicao && this.eventoId
      ? this.eventosService.editar(evento)
      : this.eventosService.salvar(evento);

    requisicao.subscribe({
      next: async () => {
        const success = await this.toastController.create({ message: this.modoEdicao ? 'Evento atualizado com sucesso' : 'Evento salvo com sucesso', duration: 1500, color: 'success' });
        await success.present();

        this.formGroup.reset({ data: '', descricao: '', musicos: [] });
        this.router.navigate(['/eventos']);
        this.isSaving = false;
      },
      error: async () => {
        const errorToast = await this.toastController.create({ message: this.modoEdicao ? 'Não foi possível atualizar o evento' : 'Não foi possível salvar o evento', duration: 2000, color: 'danger' });
        await errorToast.present();
        this.isSaving = false;
      }
    });
  }

  isInvalid(controlName: string): boolean {
    const control = this.formGroup.get(controlName);
    if (!control) return false;
    return control.invalid && (control.touched || control.dirty || this.submitted);
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
    this.formGroup.reset({ data: '', descricao: '', musicos: [] });
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
