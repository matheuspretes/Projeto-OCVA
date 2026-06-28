import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonIcon, IonSpinner, IonText, IonToggle, IonToolbar } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { UsuarioService } from 'src/app/services/usuario-service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, IonButton, IonContent, IonHeader, IonIcon, IonSpinner, IonText, IonToggle, IonToolbar]
})
export class LoginPage implements OnInit {
  formGroup: FormGroup;
  carregando = false;
  mostrarSenha = false;
  lembrarDeMim = true;
  logoCabecalho = '/assets/icon/ocva-header.png';
  logoLateral = '/assets/icon/ocva-login.png';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private toastController: ToastController,
    private usuarioService: UsuarioService,
  ) {
    this.formGroup = this.formBuilder.group({
      login: ['', Validators.required],
      senha: ['', Validators.required],
    });
  }

  ngOnInit() {
    const usuarioAutenticado = this.usuarioService.buscarAutenticacao();
    if (usuarioAutenticado && usuarioAutenticado.id) {
      this.router.navigate(['/inicio']);
    }
  }

  async entrar() {
    if (this.formGroup.invalid || this.carregando) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.carregando = true;

    const login = this.formGroup.value.login;
    const senha = this.formGroup.value.senha;
    const usuario = this.usuarioService.autenticar(login, senha);

    debugger
    if (usuario) {
      this.usuarioService.registrarAutenticacao(usuario);
      await this.router.navigate(['/inicio']);
    } else {
      await this.exibirMensagem('Login ou senha inválidos');
    }

    this.carregando = false;
  }

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1800,
      position: 'bottom',
      color: 'danger'
    });

    await toast.present();
  }

  irCadastro() {
    this.router.navigate(['/cadastro']);
  }

  alternarSenha() {
    this.mostrarSenha = !this.mostrarSenha;
  }

}
