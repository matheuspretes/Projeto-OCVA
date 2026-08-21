import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonDatetime, IonHeader, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonSpinner, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Ensaio } from 'src/app/models/ensaio';
import { Usuario } from 'src/app/models/usuario';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { UsuarioService } from 'src/app/services/usuario-service';

@Component({
  selector: 'app-criar-ensaio',
  templateUrl: './criar-ensaio.page.html',
  styleUrls: ['./criar-ensaio.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonDatetime, IonSelect, IonSelectOption, IonInput, IonSpinner, IonButton, RouterLink]
})
export class CriarEnsaioPage implements OnInit {
  formGroup: FormGroup;
  musicos: Usuario[] = [];
  submitted = false;
  isSaving = false;
  ensaioId: number | null = null;
  modoEdicao = false;

  constructor(
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService,
    private ensaiosService: EnsaiosService,
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
    this.usuarioService.listar().subscribe((usuarios) => {
      this.musicos = usuarios.filter((usuario) => usuario.tipo === 'musico');
    });

    this.route.queryParamMap.subscribe((params) => {
      const idParam = params.get('id');
      if (!idParam) {
        this.modoEdicao = false;
        this.ensaioId = null;
        return;
      }

      const id = Number(idParam);
      if (Number.isNaN(id)) {
        return;
      }

      this.ensaioId = id;
      this.modoEdicao = true;
      this.carregarEnsaio(id);
    });
  }

  private carregarEnsaio(id: number) {
    this.isSaving = true;
    this.ensaiosService.buscarPorId(id).subscribe({
      next: (ensaio) => {
        this.formGroup.patchValue({
          data: ensaio.data,
          descricao: ensaio.descricao,
          musicos: ensaio.musicos || []
        });
        this.isSaving = false;
      },
      error: async () => {
        this.isSaving = false;
        const errorToast = await this.toastController.create({ message: 'Não foi possível carregar o ensaio', duration: 2000, color: 'danger' });
        await errorToast.present();
        this.router.navigate(['/ensaios']);
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
    const ensaio: Ensaio = {
      id: this.ensaioId ?? undefined,
      data: this.formatDateOnly(form.data),
      descricao: form.descricao,
      musicos: form.musicos || []
    };

    const requisicao = this.modoEdicao && this.ensaioId
      ? this.ensaiosService.editar(ensaio)
      : this.ensaiosService.salvar(ensaio);

    requisicao.subscribe({
      next: async () => {
        const success = await this.toastController.create({ message: this.modoEdicao ? 'Ensaio atualizado com sucesso' : 'Ensaio salvo com sucesso', duration: 1500, color: 'success' });
        await success.present();

        this.formGroup.reset({ data: '', descricao: '', musicos: [] });
        await this.router.navigate(['/ensaios']);
        this.isSaving = false;
      },
      error: async () => {
        const errorToast = await this.toastController.create({ message: this.modoEdicao ? 'Erro ao atualizar ensaio' : 'Erro ao salvar ensaio', duration: 2000, color: 'danger' });
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
    if (!this.modoEdicao || !this.ensaioId) {
      const ok = window.confirm('Deseja descartar este ensaio?');
      if (!ok) {
        return;
      }
      this.formGroup.reset({ data: '', descricao: '', musicos: [] });
      const t = await this.toastController.create({ message: 'Ensaio descartado', duration: 1500, color: 'warning' });
      await t.present();
      this.router.navigate(['/ensaios']);
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
            this.ensaiosService.excluir(this.ensaioId as number).subscribe({
              next: async () => {
                const t = await this.toastController.create({ message: 'Ensaio excluído com sucesso', duration: 1500, color: 'warning' });
                await t.present();
                this.router.navigate(['/ensaios']);
              },
              error: async () => {
                const t = await this.toastController.create({ message: 'Erro ao excluir o ensaio', duration: 2000, color: 'danger' });
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
