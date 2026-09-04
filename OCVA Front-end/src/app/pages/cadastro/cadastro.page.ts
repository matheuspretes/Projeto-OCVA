import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { 
  AlertController, 
  LoadingController, 
  ToastController 
} from '@ionic/angular';
import { 
  IonBackButton, 
  IonButton, 
  IonButtons, 
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle, 
  IonContent, 
  IonHeader, 
  IonIcon,
  IonInput, 
  IonItem, 
  IonLabel, 
  IonSelect, 
  IonSelectOption, 
  IonSpinner,
  IonText, 
  IonToolbar 
} from '@ionic/angular/standalone';

import { Usuario } from '../../models/usuario';
import { UsuarioService } from 'src/app/services/usuario-service';
import {CodigoAcessoService} from 'src/app/services/codigo-acesso-service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-cadastro',
  templateUrl: './cadastro.page.html',
  styleUrls: ['./cadastro.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    IonBackButton, 
    IonButton, 
    IonButtons, 
    IonCard, 
    IonCardContent, 
    IonCardHeader, 
    IonCardTitle, 
    IonContent, 
    IonHeader, 
    IonIcon,
    IonInput, 
    IonItem, 
    IonLabel, 
    IonSelect, 
    IonSelectOption, 
    IonSpinner,
    IonText, 
    IonToolbar
  ]
})
export class CadastroPage implements OnInit {

  usuario: Usuario;
  formGroup: FormGroup;
  loginExistente: boolean = false;

  // Estados para controle do Código de Acesso
  validandoCodigo: boolean = false;
  codigoValidado: boolean = false;
  codigoValido: boolean = false;
  mensagemCodigo: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private toastcontroller: ToastController,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private usuarioService: UsuarioService,
    private codigoAcessoService: CodigoAcessoService,
    private router: Router
  ) {
    this.usuario = new Usuario();
    this.formGroup = this.formBuilder.group({
      codigoAcesso: [''],
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

  // 1. Validação prévia da disponibilidade do código
  validarCodigo() {
    const codigo = this.formGroup.get('codigoAcesso')?.value?.trim();

    if (!codigo) {
      this.mensagemCodigo = 'Por favor, insira um código de acesso.';
      this.codigoValido = false;
      this.codigoValidado = true;
      return;
    }

    if (codigo.length !== 8) {
      this.mensagemCodigo = 'O código deve conter exatamente 8 caracteres.';
      this.codigoValido = false;
      this.codigoValidado = true;
      return;
    }

    this.validandoCodigo = true;

    this.codigoAcessoService.verificarDisponibilidade(codigo).subscribe({
      next: (resultado: any) => {
        this.validandoCodigo = false;
        this.codigoValidado = true;
        if (resultado.disponivel) {
          this.codigoValido = true;
          this.mensagemCodigo = 'Código válido e disponível!';
        } else {
          this.codigoValido = false;
          this.mensagemCodigo = resultado.mensagem || 'Código não disponível.';
        }
      },
      error: (erro: HttpErrorResponse) => {
        console.error('Erro ao validar código:', erro);
        this.validandoCodigo = false;
        this.codigoValido = false;
        this.codigoValidado = true;
        this.mensagemCodigo = 'Erro ao validar código. Tente novamente.';
      }
    });
  }

  // 2. Confirmação do uso do código
  usarCodigo() {
    const codigo = this.formGroup.get('codigoAcesso')?.value?.trim();

    if (!codigo || !this.codigoValido) {
      this.exibirMensagem('Por favor, valide o código primeiro.');
      return;
    }

    this.alertController.create({
      header: 'Usar Código de Acesso',
      message: `Deseja vincular o código ${codigo} ao seu cadastro?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Vincular',
          handler: () => {
            this.executarUsoDoCodigoAsync(codigo);
          }
        }
      ]
    }).then(alert => alert.present());
  }

  // 3. Execução da vinculação no backend
  private async executarUsoDoCodigoAsync(codigo: string) {
    const loading = await this.loadingController.create({
      message: 'Vinculando código...'
    });

    await loading.present();

    const nomeUsuario = this.formGroup.get('nome')?.value || this.usuario?.nome;

    this.codigoAcessoService.validarEUsarCodigo(codigo, this.usuario?.id, nomeUsuario).subscribe({
      next: (codigoUsado: any) => {
        loading.dismiss();
        if (this.usuario) {
          this.usuario.codigoAcesso = codigoUsado.codigo;
          (this.usuario as any).codigoAcessoId = codigoUsado.id;
          
          this.formGroup.patchValue({
            codigoAcesso: codigoUsado.codigo
          });

          this.codigoValidado = false;
          this.codigoValido = false;
          this.mensagemCodigo = '';
          this.exibirMensagem(`Código ${codigoUsado.codigo} vinculado com sucesso!`);
        }
      },
      error: (erro: HttpErrorResponse) => {
        console.error('Erro ao usar código:', erro);
        loading.dismiss();
        this.exibirMensagem('Erro ao vincular código. Ele pode estar expirado ou já em uso.');
      }
    });
  }

  // 4. Fluxo principal de salvar o cadastro
  salvar() {
    if (this.formGroup.valid) {
      const login = this.formGroup.value.login?.trim();

      if (!login) {
        this.loginExistente = false;
        this.exibirMensagem('Informe um login válido.');
        return;
      }

      this.usuarioService.verificarLogin(login).subscribe({
        next: (existe) => {
          if (existe) {
            this.loginExistente = true;
            this.exibirMensagem('Esse login já existe.');
            return;
          }

          this.loginExistente = false;
          this.usuario.nome = this.formGroup.value.nome;
          this.usuario.login = login;
          this.usuario.senha = this.formGroup.value.senha;
          this.usuario.tipo = this.formGroup.value.tipo;
          this.usuario.instrumento = this.formGroup.value.instrumento;
          this.usuario.codigoAcesso = this.formGroup.value.codigoAcesso?.trim() || '';

          this.usuarioService.cadastrar(this.usuario).subscribe({
            next: () => {
              this.exibirMensagem('Usuário cadastrado com sucesso!');
              this.router.navigate(['/login']);
            },
            error: () => {
              this.exibirMensagem('Erro ao cadastrar usuário.');
            }
          });
        },
        error: () => {
          this.exibirMensagem('Não foi possível verificar o login.');
        }
      });
    }
  }

  irLogin() {
    this.router.navigate(['/login']);
  }

  verificarLoginExistente() {
    const login = this.formGroup.get('login')?.value?.trim();

    if (!login) {
      this.loginExistente = false;
      return;
    }

    this.usuarioService.verificarLogin(login).subscribe({
      next: (existe) => {
        this.loginExistente = existe;
        if (existe) {
          this.exibirMensagem('Login existente.');
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
    toast.present();
  }
}