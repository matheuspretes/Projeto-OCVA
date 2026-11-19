import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonIcon, IonInput, IonLabel, IonSelect, IonSelectOption, IonSpinner, IonTextarea, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, arrowBackOutline, calendarOutline } from 'ionicons/icons';
import { finalize, timeout } from 'rxjs';
import { EncontroRequest, TipoEncontro } from 'src/app/models/encontro';
import { EncontrosService } from 'src/app/services/encontros-service';
import { UsuarioService } from 'src/app/services/usuario-service';
import { AppLayoutComponent } from 'src/app/components/app-layout/app-layout.component';

@Component({
  selector: 'app-marcar-encontro',
  templateUrl: './marcar-encontro.page.html',
  // Reaproveita o visual da página de criar evento
  styleUrls: ['../criar-evento/criar-evento.page.scss', './marcar-encontro.page.scss'],
  standalone: true,
  imports: [AppLayoutComponent, CommonModule, ReactiveFormsModule, RouterLink, IonContent, IonHeader, IonToolbar, IonIcon, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton, IonSpinner]
})
export class MarcarEncontroPage implements OnInit {
  formGroup: FormGroup;
  tipos: TipoEncontro[] = [];
  encontroId: number | null = null;
  modoEdicao = false;
  isSaving = false;
  hoje = this.dataLocal(new Date());

  constructor(
    private formBuilder: FormBuilder,
    private encontrosService: EncontrosService,
    private usuarioService: UsuarioService,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({ add, arrowBackOutline, calendarOutline });

    this.formGroup = this.formBuilder.group({
      titulo: ['', [Validators.required, Validators.maxLength(120)]],
      data: ['', Validators.required],
      hora: ['', Validators.required],
      tipoId: [null, Validators.required],
      descricao: ['', [Validators.required, Validators.maxLength(255)]]
    });
  }

  ngOnInit() {
    const usuario = this.usuarioService.buscarAutenticacao();
    if (usuario?.tipo !== 'maestro' && usuario?.tipo !== 'diretoria') {
      this.router.navigate(['/inicio']);
      return;
    }

    this.carregarTipos();

    const idParam = this.route.snapshot.queryParamMap.get('id');
    const id = Number(idParam);
    if (idParam && !Number.isNaN(id)) {
      this.encontroId = id;
      this.modoEdicao = true;
      this.carregarEncontro(id);
    }
  }

  private carregarTipos(selecionarId?: number) {
    this.encontrosService.listarTipos().subscribe({
      next: (tipos) => {
        this.tipos = tipos;
        if (selecionarId != null) {
          this.formGroup.patchValue({ tipoId: selecionarId });
        } else if (this.formGroup.value.tipoId == null && tipos.length) {
          this.formGroup.patchValue({ tipoId: tipos[0].id });
        }
      },
      error: () => this.mostrarToast('Não foi possível carregar os tipos de encontro.', 'danger')
    });
  }

  private carregarEncontro(id: number) {
    this.isSaving = true;
    this.encontrosService.buscarPorId(id).pipe(finalize(() => this.isSaving = false)).subscribe({
      next: (encontro) => {
        this.formGroup.patchValue({
          titulo: encontro.titulo,
          data: encontro.data,
          hora: (encontro.hora || '').slice(0, 5),
          tipoId: encontro.tipo?.id ?? null,
          descricao: encontro.descricao
        });
      },
      error: async () => {
        await this.mostrarToast('Não foi possível carregar o encontro.', 'danger');
        this.router.navigate(['/inicio']);
      }
    });
  }

  async adicionarTipo() {
    const alert = await this.alertController.create({
      header: 'Nova categoria',
      inputs: [{ name: 'nome', type: 'text', placeholder: 'Ex.: Ensaio de naipe', attributes: { maxlength: 40 } }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Adicionar',
          handler: (valores) => {
            const nome = (valores?.nome || '').trim();
            if (!nome) {
              return false;
            }
            this.encontrosService.criarTipo(nome).subscribe({
              next: (tipo) => {
                this.tipos = [...this.tipos, tipo];
                this.formGroup.patchValue({ tipoId: tipo.id });
              },
              error: (erro) => this.mostrarToast(this.mensagemDeErro(erro, 'Não foi possível criar a categoria.'), 'danger')
            });
            return true;
          }
        }
      ]
    });
    await alert.present();
  }

  salvar() {
    if (this.formGroup.invalid || this.isSaving) {
      this.formGroup.markAllAsTouched();
      this.mostrarToast('Preencha todos os campos.', 'warning');
      return;
    }

    const form = this.formGroup.value;
    const usuario = this.usuarioService.buscarAutenticacao();
    const encontro: EncontroRequest = {
      id: this.encontroId ?? undefined,
      titulo: form.titulo.trim(),
      data: String(form.data).slice(0, 10),
      hora: String(form.hora).slice(0, 5),
      tipoId: Number(form.tipoId),
      descricao: form.descricao.trim(),
      criadorId: usuario?.id
    };

    const requisicao = this.modoEdicao
      ? this.encontrosService.editar(encontro)
      : this.encontrosService.salvar(encontro);

    this.isSaving = true;
    requisicao.pipe(timeout(30000), finalize(() => this.isSaving = false)).subscribe({
      next: async () => {
        await this.mostrarToast(this.modoEdicao ? 'Encontro atualizado.' : 'Encontro marcado!', 'success');
        this.router.navigate(['/inicio']);
      },
      error: (erro) => this.mostrarToast(this.mensagemDeErro(erro, 'Não foi possível salvar o encontro.'), 'danger')
    });
  }

  async excluir() {
    if (!this.encontroId) {
      return;
    }
    const alert = await this.alertController.create({
      header: 'Desmarcar encontro',
      message: 'Tem certeza que deseja desmarcar este encontro?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Desmarcar',
          role: 'destructive',
          handler: () => {
            this.encontrosService.excluir(this.encontroId as number).subscribe({
              next: async () => {
                await this.mostrarToast('Encontro desmarcado.', 'warning');
                this.router.navigate(['/inicio']);
              },
              error: (erro) => this.mostrarToast(this.mensagemDeErro(erro, 'Não foi possível desmarcar o encontro.'), 'danger')
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

  isInvalid(campo: string): boolean {
    const control = this.formGroup.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  private mensagemDeErro(erro: any, padrao: string): string {
    return erro?.error?.message || padrao;
  }

  private async mostrarToast(message: string, color: string) {
    const toast = await this.toastController.create({ message, duration: 2500, color });
    await toast.present();
  }

  private dataLocal(data: Date): string {
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${data.getFullYear()}-${mes}-${dia}`;
  }
}
