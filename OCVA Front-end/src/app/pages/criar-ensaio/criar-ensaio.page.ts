import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonIcon, 
  IonSpinner, 
  ToastController 
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  bookOutline, 
  arrowBackOutline, 
  musicalNotesOutline, 
  peopleOutline 
} from 'ionicons/icons';

import { EnsaioRequest } from 'src/app/models/ensaio';
import { Usuario } from 'src/app/models/usuario';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { UsuarioService } from 'src/app/services/usuario-service';

@Component({
  selector: 'app-criar-ensaio',
  templateUrl: './criar-ensaio.page.html',
  styleUrls: ['./criar-ensaio.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule, 
    IonContent, 
    IonHeader, 
    IonToolbar, 
    IonIcon, 
    IonSpinner, 
    RouterLink
  ]
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
    addIcons({
      bookOutline,
      arrowBackOutline,
      musicalNotesOutline,
      peopleOutline
    });

    this.formGroup = this.formBuilder.group({
      titulo: ['', Validators.required],
      data: ['', Validators.required],
      horario: ['', Validators.required],
      descricao: ['', Validators.required],
      musicos: [[], Validators.required]
    });
  }

  ngOnInit() {
    const usuarioAutenticado = this.usuarioService.buscarAutenticacao();
    if (usuarioAutenticado?.tipo !== 'diretoria') {
      this.router.navigate(['/ensaios']);
      return;
    }

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
      if (Number.isNaN(id)) return;

      this.ensaioId = id;
      this.modoEdicao = true;
      this.carregarEnsaio(id);
    });
  }

  private carregarEnsaio(id: number) {
    this.isSaving = true;
    this.ensaiosService.buscarPorId(id).subscribe({
      next: (ensaio: any) => {
        let dataStr = '';
        let horaStr = '';

        if (ensaio.data) {
          const partes = ensaio.data.split('T');
          dataStr = partes[0] || '';
          horaStr = partes[1] ? partes[1].substring(0, 5) : '';
        }

        this.formGroup.patchValue({
          titulo: ensaio.titulo || '',
          data: dataStr,
          horario: horaStr,
          descricao: ensaio.descricao || '',
          musicos: ensaio.musicos || []
        });
        this.isSaving = false;
      },
      error: async () => {
        this.isSaving = false;
        const toast = await this.toastController.create({
          message: 'Não foi possível carregar o ensaio',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
        this.router.navigate(['/ensaios']);
      }
    });
  }

  isMusicoSelecionado(musico: Usuario): boolean {
    const selecionados: Usuario[] = this.formGroup.get('musicos')?.value || [];
    return selecionados.some((m) => m.id === musico.id);
  }

  toggleMusico(musico: Usuario) {
    const selecionados: Usuario[] = [...(this.formGroup.get('musicos')?.value || [])];
    const index = selecionados.findIndex((m) => m.id === musico.id);

    if (index >= 0) {
      selecionados.splice(index, 1);
    } else {
      selecionados.push(musico);
    }

    this.formGroup.patchValue({ musicos: selecionados });
    this.formGroup.get('musicos')?.markAsDirty();
  }

  isInvalid(controlName: string): boolean {
    const control = this.formGroup.get(controlName);
    if (!control) return false;
    return control.invalid && (control.touched || control.dirty || this.submitted);
  }

  async salvar() {
    const usuarioAutenticado = this.usuarioService.buscarAutenticacao();
    if (usuarioAutenticado?.tipo !== 'diretoria') {
      this.router.navigate(['/ensaios']);
      return;
    }

    this.submitted = true;
    if (this.formGroup.invalid) {
      const t = await this.toastController.create({ 
        message: 'Preencha todos os campos obrigatórios', 
        duration: 2000, 
        color: 'danger' 
      });
      await t.present();
      return;
    }

    this.isSaving = true;
    const form = this.formGroup.value;

    const dataFinal = `${form.data}T${form.horario}:00`;

    const ensaio: EnsaioRequest = {
      id: this.ensaioId ?? undefined,
      titulo: form.titulo,
      data: dataFinal,
      descricao: form.descricao,
      musicoIds: (form.musicos || [])
        .map((musico: Usuario | { id?: number }) => musico.id)
        .filter((id: number | undefined): id is number => id !== undefined),
      criadorId: usuarioAutenticado?.id
    };

    const requisicao = this.modoEdicao && this.ensaioId
      ? this.ensaiosService.editar(ensaio)
      : this.ensaiosService.salvar(ensaio);

    requisicao.subscribe({
      next: async () => {
        const toast = await this.toastController.create({
          message: this.modoEdicao ? 'Ensaio atualizado com sucesso' : 'Ensaio salvo com sucesso',
          duration: 1500,
          color: 'success'
        });
        await toast.present();
        this.router.navigate(['/ensaios']);
        this.isSaving = false;
      },
      error: async () => {
        const toast = await this.toastController.create({
          message: this.modoEdicao ? 'Erro ao atualizar ensaio' : 'Erro ao salvar ensaio',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
        this.isSaving = false;
      }
    });
  }

  async excluir() {
    if (!this.ensaioId) return;

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
                const toast = await this.toastController.create({ 
                  message: 'Ensaio excluído com sucesso', 
                  duration: 1500, 
                  color: 'warning' 
                });
                await toast.present();
                this.router.navigate(['/ensaios']);
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