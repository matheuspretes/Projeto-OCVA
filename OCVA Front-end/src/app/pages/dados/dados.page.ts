import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  IonContent, IonHeader, IonToolbar, IonButtons,
  IonBackButton, IonItem, IonInput, IonLabel, IonButton, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonSelect, IonSelectOption
} from '@ionic/angular/standalone';
import { UsuarioService } from 'src/app/services/usuario-service';
import { Usuario } from 'src/app/models/usuario';
import { ToastController, NavController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';


@Component({
  selector: 'app-dados',
  templateUrl: './dados.page.html',
  styleUrls: ['./dados.page.scss'],
  standalone: true,
  imports: [IonSelect, IonSelectOption, IonLabel, IonInput, IonItem, IonBackButton, IonButtons, IonButton, IonContent, IonHeader, IonToolbar, IonCard, IonCardContent, IonCardHeader, IonCardTitle, CommonModule, FormsModule, ReactiveFormsModule, RouterLink]
})
export class DadosPage implements OnInit {
  private tipoSub: Subscription | null = null;
  usuario: Usuario | null = null;
  dadosOriginais: Usuario | null = null;
  formGroup: FormGroup;
  editando = false;


  constructor(
    private usuarioService: UsuarioService,
    private toastController: ToastController,
    private navController: NavController,
    private formBuilder: FormBuilder,
    private alertController: AlertController
  ) {

    this.formGroup = this.formBuilder.group({
      'nome': ['', Validators.compose([Validators.required])],
      'login': ['', Validators.compose([Validators.required])],
      'senha': ['', Validators.compose([Validators.required])],
      'tipo': [''],
      'instrumento': ['']
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
        instrumento: this.usuario?.instrumento
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
        instrumento: this.usuario?.instrumento
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

    this.usuarioService.salvar(this.usuario);
    localStorage.setItem('usuarioAutenticado', JSON.stringify(this.usuario));

    this.exibirMensagem('Dados atualizados com sucesso!!!');

    this.dadosOriginais = { ...this.usuario };
    this.formGroup.patchValue(this.dadosOriginais);
    this.formGroup.disable({ emitEvent: false });

    this.navController.navigateBack('/inicio');
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
              this.usuarioService.excluir(this.usuario.id);
              localStorage.removeItem('usuarioAutenticado');
              this.exibirMensagem('Conta excluída com sucesso!');
              this.navController.navigateRoot('/login');
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

