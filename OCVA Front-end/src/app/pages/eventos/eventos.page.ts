import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, IonButton } from '@ionic/angular/standalone';
import { UsuarioService } from 'src/app/services/usuario-service';
import { IonList, IonItem, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { Evento } from 'src/app/models/evento';
import { EventosService } from 'src/app/services/eventos-service';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-eventos',
  templateUrl: './eventos.page.html',
  styleUrls: ['./eventos.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonToolbar, IonButtons, IonBackButton, CommonModule, FormsModule, IonList, IonItem, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, RouterLink]
})
export class EventosPage implements OnInit {

  eventos: Evento[] = [];
  usuarioAutenticado: any = null;

  constructor(
    private eventosService: EventosService,
    private usuarioService: UsuarioService,
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.usuarioAutenticado = this.usuarioService.buscarAutenticacao();
    this.eventosService.listar().subscribe({
      next: (todosOsEventos) => {
        let eventosFiltrados: Evento[] = [];

        if (this.usuarioAutenticado && (this.usuarioAutenticado.tipo === 'maestro' || this.usuarioAutenticado.tipo === 'diretoria')) {
          eventosFiltrados = todosOsEventos;
        } else if (this.usuarioAutenticado) {
          const userLogin = this.usuarioAutenticado.login;
          const userId = this.usuarioAutenticado.id;

          eventosFiltrados = todosOsEventos.filter((evento: Evento) =>
            (evento.musicos || []).some((m: any) => m.login === userLogin || m.id === userId)
          );
        }

        this.eventos = eventosFiltrados.map((evento: Evento) => ({
          ...evento,
          nomesMusicos: (evento.musicos || []).map((m: any) => m.nome)
        })) as any;
      },
      error: () => {
        this.eventos = [];
      }
    });
  }   

  podeEditarOuExcluir(): boolean {
    return this.usuarioAutenticado?.tipo === 'maestro';
  }

  editarEvento(evento: Evento) {
    if (!evento.id) {
      return;
    }

    this.router.navigate(['/criar-evento'], { queryParams: { id: evento.id } });
  }

  async excluirEvento(evento: Evento) {
    if (!evento.id) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este evento?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.eventosService.excluir(evento.id as number).subscribe({
              next: async () => {
                const toast = await this.toastController.create({ message: 'Evento excluído com sucesso', duration: 1500, color: 'warning' });
                await toast.present();
                this.ngOnInit();
              },
              error: async () => {
                const toast = await this.toastController.create({ message: 'Erro ao excluir evento', duration: 2000, color: 'danger' });
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
