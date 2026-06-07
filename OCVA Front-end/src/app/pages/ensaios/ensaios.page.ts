import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { Ensaio } from 'src/app/models/ensaio';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { UsuarioService } from 'src/app/services/usuario-service';
import { IonList, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-ensaios',
  templateUrl: './ensaios.page.html',
  styleUrls: ['./ensaios.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonCard, IonCardHeader, IonCardTitle, IonCardContent]
})
export class EnsaiosPage implements OnInit {

  ensaios: Ensaio[] = [];
  usuarioAutenticado: any = null;

  constructor(
    private ensaiosService: EnsaiosService,
    private usuarioService: UsuarioService
  ) { }

  ngOnInit() {
    this.usuarioAutenticado = this.usuarioService.buscarAutenticacao();
    const todos = this.ensaiosService.listar() || [];

    if (this.usuarioAutenticado && (this.usuarioAutenticado.tipo === 'maestro' || this.usuarioAutenticado.tipo === 'diretoria')) {
      this.ensaios = todos;
    } else if (this.usuarioAutenticado) {
      const userId = this.usuarioAutenticado.id;
      this.ensaios = todos.filter((e: any) => (e.musicos || []).some((m: any) => m.id === userId));
    } else {
      this.ensaios = [];
    }
  }

  getMusicosNomes(ensaio: Ensaio): string {
    const nomes = (ensaio.musicos || []).map((m: any) => m.nome || '');
    return nomes.filter(n => !!n).join(', ');
  }

}
