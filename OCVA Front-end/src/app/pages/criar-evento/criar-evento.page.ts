import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonButton, IonButtons, IonBackButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonDatetime, IonHeader, IonItem, IonLabel, IonSelect, IonSelectOption, IonInput, IonSpinner, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Ensaio } from 'src/app/models/ensaio';
import { Usuario } from 'src/app/models/usuario';
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

  constructor(
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService,
    private eventosService: EventosService,
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
    this.isSaving = true;
    if (this.formGroup.invalid) {
      const t = await this.toastController.create({ message: 'Preencha todos os campos', duration: 2000, color: 'red' });
      await t.present();
      this.isSaving = false;
      return;
    }

    const form = this.formGroup.value;
    const evento: Evento = {
      data: this.formatDateOnly(form.data),
      descricao: form.descricao,
      musicos: form.musicos || []
    };

    this.eventosService.salvar(evento);

    const success = await this.toastController.create({ message: 'Evento salvo com sucesso', duration: 1500, color: 'success' });
    await success.present();

    this.formGroup.reset({ data: '', descricao: '', musicos: [] });
    this.router.navigate(['/eventos']);
    this.isSaving = false;
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
    const ok = window.confirm('Deseja descartar este evento?');
    if (!ok) {
      return;
    }
    this.formGroup.reset({ data: '', descricao: '', musicos: [] });
    const t = await this.toastController.create({ message: 'Evento descartado', duration: 1500, color: 'warning' });
    await t.present();
    this.router.navigate(['/eventos']);
  }

  sairDaConta() {
    this.usuarioService.encerrarAutenticacao();
    this.router.navigate(['/login']);
  }
}
