import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonButtons,
  IonBackButton, IonItem, IonInput, IonLabel, IonButton, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonSelect, IonSelectOption, IonIcon, IonSpinner
} from '@ionic/angular/standalone';
import { UsuarioService } from 'src/app/services/usuario-service';
import { CodigoAcessoService } from 'src/app/services/codigo-acesso-service';
import { Usuario } from 'src/app/models/usuario';
import { ToastController, NavController, AlertController, LoadingController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, closeCircleOutline } from 'ionicons/icons';


@Component({
  selector: 'app-dados',
  templateUrl: './dados.page.html',
  styleUrls: ['./dados.page.scss'],
  standalone: true,
  imports: [IonSpinner, IonIcon, IonSelect, IonSelectOption, IonLabel, IonInput, IonItem, IonBackButton, IonButtons, IonButton, IonContent, IonHeader, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, CommonModule, FormsModule, ReactiveFormsModule, RouterLink]
})
export class DadosPage implements OnInit {
  private tipoSub: Subscription | null = null;
  usuario: Usuario | null = null;
  dadosOriginais: Usuario | null = null;
  formGroup: FormGroup;
  editando = false;
  validandoCodigo = false;
  codigoValidado = false;
  mensagemCodigo = '';
  codigoValido = false;


  constructor(
    private usuarioService: UsuarioService,
    private codigoAcessoService: CodigoAcessoService,
    private toastController: ToastController,
    private navController: NavController,
    private formBuilder: FormBuilder,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) {
    addIcons({ checkmarkCircleOutline, closeCircleOutline });

    this.formGroup = this.formBuilder.group({
      'nome': ['', Validators.compose([Validators.required])],
      'login': ['', Validators.compose([Validators.required])],
      'senha': ['', Validators.compose([Validators.required])],
      'tipo': [''],
      'instrumento': [''],
      'codigoAcesso': ['']
    });
  }

  ngOnInit() {
    const usuarioLogado = localStorage.getItem('usuarioAutenticado');
    if (usuarioLogado) {
      this.usuario = JSON.parse(usuarioLogado);
      this.formGroup.patchValue({
        nome: this.usuario?.nome,
        login: this.usuario?.login,
        senha: this.usuario?.senha,
        tipo: this.usuario?.tipo,
        instrumento: this.usuario?.instrumento,
        codigoAcesso: this.usuario?.codigoAcesso || ''
      });
    }

    // Clear instrumento when tipo is not 'musico'
    this.tipoSub = this.formGroup.get('tipo')?.valueChanges.subscribe((val) => {
      if (val !== 'musico') {
        this.formGroup.get('instrumento')?.setValue('');
      }
    }) || null;
  }

  ionViewWillEnter() {
    const usuarioLogado = localStorage.getItem('usuarioAutenticado');
    if (usuarioLogado) {
      this.usuario = JSON.parse(usuarioLogado);
      this.formGroup.patchValue({
        nome: this.usuario?.nome,
        login: this.usuario?.login,
        senha: this.usuario?.senha,
        tipo: this.usuario?.tipo,
        instrumento: this.usuario?.instrumento,
        codigoAcesso: this.usuario?.codigoAcesso || ''
      });
    }
  }

  ngOnDestroy(): void {
    this.tipoSub?.unsubscribe();
  }

  salvar() {
    if (!this.usuario) {
      this.exibirMensagem('Erro: Usuário não carregado!');
      return;
    }

    if (!this.formGroup.valid) {
      this.exibirMensagem('Por favor, preencha todos os campos obrigatórios!');
      return;
    }

    const dados = this.formGroup.value;
    this.usuario.nome = dados.nome;
    this.usuario.login = dados.login;
    this.usuario.senha = dados.senha;
    this.usuario.tipo = dados.tipo;
    this.usuario.instrumento = dados.instrumento;
    this.usuario.codigoAcesso = dados.codigoAcesso;

    this.usuarioService.salvar(this.usuario).subscribe({
      next: (usuarioAtualizado) => {
        localStorage.setItem('usuarioAutenticado', JSON.stringify(usuarioAtualizado));
        this.exibirMensagem('Dados atualizados com sucesso!!!');

        this.dadosOriginais = { ...usuarioAtualizado };
        this.formGroup.patchValue(this.dadosOriginais);
        this.formGroup.disable({ emitEvent: false });

        this.navController.navigateBack('/inicio');
      },
      error: () => {
        this.exibirMensagem('Erro ao atualizar os dados do usuário!');
      }
    });
  }

  validarCodigo() {
    const codigo = this.formGroup.get('codigoAcesso')?.value?.trim();

    if (!codigo) {
      this.mensagemCodigo = 'Por favor, insira um código de acesso';
      this.codigoValido = false;
      this.codigoValidado = true;
      return;
    }

    if (codigo.length !== 8) {
      this.mensagemCodigo = 'O código deve conter 8 caracteres';
      this.codigoValido = false;
      this.codigoValidado = true;
      return;
    }

    this.validandoCodigo = true;

    this.codigoAcessoService.verificarDisponibilidade(codigo).subscribe({
      next: (resultado) => {
        this.validandoCodigo = false;
        if (resultado.disponivel) {
          this.codigoValido = true;
          this.mensagemCodigo = 'Código válido e disponível!';
          this.codigoValidado = true;
        } else {
          this.codigoValido = false;
          this.mensagemCodigo = resultado.mensagem || 'Código não disponível';
          this.codigoValidado = true;
        }
      },
      error: (erro) => {
        console.error('Erro ao validar código:', erro);
        this.validandoCodigo = false;
        this.codigoValido = false;
        this.mensagemCodigo = 'Erro ao validar código. Tente novamente.';
        this.codigoValidado = true;
      }
    });
  }

  usarCodigo() {
    const codigo = this.formGroup.get('codigoAcesso')?.value?.trim();

    if (!codigo || !this.codigoValido) {
      this.exibirMensagem('Por favor, valide o código primeiro');
      return;
    }

    this.alertController.create({
      header: 'Usar Código de Acesso',
      message: `Você deseja vincular o código ${codigo} a sua conta?`,
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

  private async executarUsoDoCodigoAsync(codigo: string) {
    const loading = await this.loadingController.create({
      message: 'Vinculando código...'
    });

    await loading.present();

    this.codigoAcessoService.validarEUsarCodigo(codigo, this.usuario?.id, this.usuario?.nome).subscribe({
      next: (codigoUsado) => {
        loading.dismiss();
        if (this.usuario) {
          this.usuario.codigoAcesso = codigoUsado.codigo;
          this.usuario.codigoAcessoId = codigoUsado.id;
          this.formGroup.patchValue({
            codigoAcesso: codigoUsado.codigo
          });
          this.codigoValidado = false;
          this.codigoValido = false;
          this.mensagemCodigo = '';
          this.exibirMensagem(`Código ${codigoUsado.codigo} vinculado com sucesso!`);
        }
      },
      error: (erro) => {
        console.error('Erro ao usar código:', erro);
        loading.dismiss();
        this.exibirMensagem('Erro ao vincular código. Ele pode estar expirado ou já em uso.');
      }
    });
  }

  async excluir() {
    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Exclusão cancelada');
          }
        },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            if (this.usuario) {
              this.usuarioService.excluir(this.usuario.id).subscribe({
                next: () => {
                  localStorage.removeItem('usuarioAutenticado');
                  this.exibirMensagem('Conta excluída com sucesso!');
                  this.navController.navigateRoot('/login');
                },
                error: () => {
                  this.exibirMensagem('Erro ao excluir a conta!');
                }
              });
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async sairDaConta() {
    this.usuarioService.encerrarAutenticacao();
    await this.exibirMensagem('Sessão encerrada com sucesso!');
    this.navController.navigateRoot('/login');
  }

  async cancelar() {
    this.navController.navigateBack('/inicio');
  }

  async exibirMensagem(texto: string) {
    const toast = await this.toastController.create({
      message: texto,
      duration: 1500
    });
    toast.present();
  }
  editar() {
    this.editando = true;
    this.formGroup.enable({ emitEvent: false });
  }

  cancelarEditar() {
    if (this.dadosOriginais) {
      this.formGroup.reset(this.dadosOriginais);
    }

    this.formGroup.disable({ emitEvent: false });
    this.editando = false;
  }
}

