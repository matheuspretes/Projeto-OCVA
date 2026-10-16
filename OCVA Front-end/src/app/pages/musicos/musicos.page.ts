import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { RouterLink } from '@angular/router';
import { IonBadge, IonButton, IonContent, IonIcon, IonInput, IonItem, IonLabel, IonList, IonMenu, IonSelect, IonSelectOption, IonSplitPane } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, documentTextOutline, homeOutline, keyOutline, lockClosedOutline, musicalNoteOutline, musicalNotesOutline, peopleOutline, personOutline } from 'ionicons/icons';
import { Usuario } from 'src/app/models/usuario';
import { UsuarioService } from 'src/app/services/usuario-service';

@Component({
  selector: 'app-musicos',
  templateUrl: './musicos.page.html',
  styleUrls: ['./musicos.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonBadge, IonButton, IonContent, IonIcon, IonInput, IonItem, IonLabel, IonList, IonMenu, IonSelect, IonSelectOption, IonSplitPane]
})
export class MusicosPage implements OnInit {
  musicos: Usuario[] = [];
  usuarioAutenticado: Usuario | null = null;
  editandoId: number | null = null;
  usuarioEditado: Usuario | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    addIcons({
      calendarOutline,
      documentTextOutline,
      homeOutline,
      keyOutline,
      lockClosedOutline,
      musicalNoteOutline,
      musicalNotesOutline,
      peopleOutline,
      personOutline
    });
    this.usuarioAutenticado = this.usuarioService.buscarAutenticacao();

    this.usuarioService.listar().subscribe({
      next: (usuarios) => {
        if (!this.podeConsultarMusicos()) {
          this.musicos = [];
          return;
        }

        this.musicos = usuarios.filter((usuario) => usuario.tipo === 'musico' || usuario.tipo === 'maestro');
      },
      error: () => {
        this.musicos = [];
      }
    });
  }

  ehDiretoria(): boolean {
    return this.usuarioAutenticado?.tipo === 'diretoria';
  }

  podeConsultarMusicos(): boolean {
    return this.usuarioAutenticado?.tipo === 'maestro' || this.ehDiretoria();
  }

  iniciarEdicao(usuario: Usuario) {
    this.editandoId = usuario.id;
    this.usuarioEditado = { ...usuario };
  }

  cancelarEdicao() {
    this.editandoId = null;
    this.usuarioEditado = null;
  }

  alternarStatus(usuario: Usuario) {
    if (!this.ehDiretoria()) {
      return;
    }

    const usuarioAtualizado = {
      ...usuario,
      ativo: usuario.ativo === false
    };

    this.usuarioService.salvar(usuarioAtualizado).subscribe({
      next: (resultado) => {
        const indice = this.musicos.findIndex((item) => item.id === resultado.id);
        if (indice >= 0) {
          this.musicos[indice] = resultado;
        }
        this.exibirToast(
          resultado.ativo === false ? 'Usuário suspenso' : 'Usuário ativado',
          resultado.ativo === false ? 'warning' : 'success'
        );
      },
      error: () => this.exibirToast('Não foi possível alterar o status do usuário', 'danger')
    });
  }

  salvarEdicao() {
    if (!this.usuarioEditado) {
      return;
    }

    this.usuarioService.salvar(this.usuarioEditado).subscribe({
      next: (usuarioAtualizado) => {
        const indice = this.musicos.findIndex((item) => item.id === usuarioAtualizado.id);
        if (indice >= 0) {
          this.musicos[indice] = usuarioAtualizado;
        }
        this.cancelarEdicao();
        this.exibirToast('Dados atualizados com sucesso', 'success');
      },
      error: () => this.exibirToast('Não foi possível atualizar os dados', 'danger')
    });
  }

  private async exibirToast(message: string, color: string) {
    const toast = await this.toastController.create({ message, duration: 1800, color });
    await toast.present();
  }

}
