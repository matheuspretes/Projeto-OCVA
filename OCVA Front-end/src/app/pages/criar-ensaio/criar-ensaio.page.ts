import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonButton, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonDatetime, IonHeader, IonItem, IonLabel, IonSelect, IonSelectOption, IonTitle, IonToolbar, ToastController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { Ensaio } from 'src/app/models/ensaio';
import { Usuario } from 'src/app/models/usuario';
import { UsuarioService } from 'src/app/services/usuario-service';

@Component({
  selector: 'app-criar-ensaio',
  templateUrl: './criar-ensaio.page.html',
  styleUrls: ['./criar-ensaio.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IonContent, IonHeader, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItem, IonLabel, IonDatetime, IonSelect, IonSelectOption, IonButton]
})
export class CriarEnsaioPage implements OnInit {
  formGroup: FormGroup;
  musicos: Usuario[] = [];

  constructor(private formBuilder: FormBuilder, private usuarioService: UsuarioService, private toastController: ToastController, private router: Router) {
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
    if (this.formGroup.invalid) {
      const t = await this.toastController.create({ message: 'Preencha todos os campos', duration: 2000, color: 'danger' });
      await t.present();
      return;
    }

    const form = this.formGroup.value;
    const ensaio: Ensaio = {
      data: form.data,
      descricao: form.descricao,
      musicos: form.musicos || []
    };

    const raw = localStorage.getItem('ensaios');
    const lista: Ensaio[] = raw ? JSON.parse(raw) : [];
    lista.push(ensaio);
    localStorage.setItem('ensaios', JSON.stringify(lista));

    const success = await this.toastController.create({ message: 'Ensaio salvo com sucesso', duration: 1500, color: 'success' });
    await success.present();

    this.formGroup.reset({ data: '', descricao: '', musicos: [] });
    this.router.navigate(['/ensaios']);
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
