import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonDatetime, IonHeader, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Ensaio } from 'src/app/models/ensaio';
import { Usuario } from 'src/app/models/usuario';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { UsuarioService } from 'src/app/services/usuario-service';

@Component({
  selector: 'app-criar-ensaio',
  templateUrl: './criar-ensaio.page.html',
  styleUrls: ['./criar-ensaio.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonDatetime, IonSelect, IonSelectOption, IonInput, IonButton]
})
export class CriarEnsaioPage implements OnInit {
  formGroup: FormGroup;
  musicos: Usuario[] = [];
  submitted = false;

  constructor(
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService,
    private ensaiosService: EnsaiosService,
    private toastController: ToastController,
    private router: Router
  ) {
    this.formGroup = this.formBuilder.group({
      data: ['', Validators.compose([Validators.required])],
      descricao: ['', Validators.compose([Validators.required])]
      ,musicos: [[], Validators.compose([Validators.required])]
    });
  }

  ngOnInit() {
    this.musicos = this.usuarioService.listar().filter((usuario) => usuario.tipo === 'musico');
  }

  async salvar() {
    this.submitted = true;
    if (this.formGroup.invalid) {
      const t = await this.toastController.create({ message: 'Preencha todos os campos', duration: 2000, color: 'danger' });
      await t.present();
      return;
    }

    const form = this.formGroup.value;
    const ensaio: Ensaio = {
      data: this.formatDateOnly(form.data),
      descricao: form.descricao,
      musicos: form.musicos || []
    };

    this.ensaiosService.salvar(ensaio);

    const success = await this.toastController.create({ message: 'Ensaio salvo com sucesso', duration: 1500, color: 'success' });
    await success.present();

    this.formGroup.reset({ data: '', descricao: '', musicos: [] });
    this.router.navigate(['/ensaios']);
  }

  isInvalid(controlName: string): boolean {
    const control = this.formGroup.get(controlName);
    if (!control) return false;
    return control.invalid && (control.touched || control.dirty || this.submitted);
  }

  formatDateOnly(value: any): string {
    if (!value) return '';
    // If already contains a time (ISO with T), strip time portion
    if (typeof value === 'string') {
      const tIndex = value.indexOf('T');
      if (tIndex > 0) return value.slice(0, tIndex);
      // value might be already a date string (YYYY-MM-DD) — return as-is
      // or in some cases ion-datetime returns the full ISO; handle fallback
      try {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
      } catch {
        return value;
      }
    }
    // If value is a Date object
    if (value instanceof Date) {
      return value.toISOString().slice(0, 10);
    }
    // Fallback: try to construct Date
    try {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    } catch {
      // ignore
    }
    return '';
  }

  cancelar() {
    this.formGroup.reset({ data: '', descricao: '', musicos: [] });
    this.router.navigate(['/ensaios']);
  }

  async excluir() {
    const ok = window.confirm('Deseja descartar este ensaio?');
    if (!ok) {
      return;
    }
    this.formGroup.reset({ data: '', descricao: '', musicos: [] });
    const t = await this.toastController.create({ message: 'Ensaio descartado', duration: 1500, color: 'warning' });
    await t.present();
    this.router.navigate(['/ensaios']);
  }

  sairDaConta() {
    this.usuarioService.encerrarAutenticacao();
    this.router.navigate(['/login']);
  }
}
