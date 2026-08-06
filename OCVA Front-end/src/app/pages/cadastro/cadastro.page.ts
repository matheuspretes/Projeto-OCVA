import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Usuario } from '../../models/usuario';
import { IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonText, IonToolbar } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { UsuarioService } from 'src/app/services/usuario-service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IonBackButton, IonButton, IonButtons, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonContent, IonHeader, IonInput, IonItem, IonLabel, IonSelect, IonSelectOption, IonText, IonToolbar]
})
export class CadastroPage implements OnInit {

  usuario: Usuario;
  formGroup: FormGroup;
  loginExistente: boolean = false;

  constructor(private formBuilder: FormBuilder,
    private toastcontroller: ToastController,
    private usuarioService: UsuarioService,
    private router: Router,) {
    this.usuario = new Usuario();
    this.formGroup = this.formBuilder.group({
      nome: ['', Validators.required],
      login: ['', Validators.required],
      senha: ['', Validators.required],
      tipo: ['', Validators.required],
      instrumento: ['']
    });
  }

  ngOnInit() {
    this.formGroup.get('tipo')?.valueChanges.subscribe((tipo) => {
      const instrumento = this.formGroup.get('instrumento');

      if (tipo === 'musico') {
        instrumento?.setValidators([Validators.required]);
      } else {
        instrumento?.clearValidators();
        instrumento?.setValue('');
      }

      instrumento?.updateValueAndValidity();
    });
  }

  salvar() {
    if (this.formGroup.valid) {
      const login = this.formGroup.value.login?.trim();

      if (this.usuarioService.verificarLogin(login)) {
        this.loginExistente = true;
        this.exibirMensagem('Esse login já existe.');
        return;
      }

      this.usuario.nome = this.formGroup.value.nome;
      this.usuario.login = login;
      this.usuario.senha = this.formGroup.value.senha;
      this.usuario.tipo = this.formGroup.value.tipo;
      this.usuario.instrumento = this.formGroup.value.instrumento;

      this.usuarioService.cadastrar(this.usuario).subscribe({
        next: () => {
          this.exibirMensagem('Usuário cadastrado com sucesso');
          this.router.navigate(['/login']);
        },
        error: () => {
          this.exibirMensagem('Erro ao cadastrar usuário');
        }
      });
    }
  }

  irLogin() {
    this.router.navigate(['/login']);
  }

  verificarLoginExistente() {
    let login = this.formGroup.get('login')?.value;
    this.usuarioService.verificarLogin(login).subscribe({
      next: (existe) => {
        this.loginExistente = existe;
        if (existe) {
          this.exibirMensagem('Login existente');
        }
      },
      error: () => {
        this.loginExistente = false;
      }
    });
  }

  async exibirMensagem(texto: string) {
    const toast = await this.toastcontroller.create({
      message: texto,
      duration: 1500
    });
    toast.present()
  }
}
