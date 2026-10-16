import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline, documentTextOutline, downloadOutline, homeOutline, keyOutline, musicalNoteOutline, musicalNotesOutline, peopleOutline, personOutline, trashOutline } from 'ionicons/icons';
import { IonButton, IonContent, IonIcon, IonInput, IonItem, IonLabel, IonList, IonMenu, IonSelect, IonSelectOption, IonSplitPane } from '@ionic/angular/standalone';
import { Partitura } from '../../models/partitura';
import { PartiturasService } from '../../services/partituras-service';
import { Usuario } from '../../models/usuario';
import { UsuarioService } from '../../services/usuario-service';

@Component({
  selector: 'app-partituras',
  templateUrl: './partituras.page.html',
  styleUrls: ['./partituras.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonButton, IonContent, IonIcon, IonInput, IonItem, IonLabel, IonList, IonMenu, IonSelect, IonSelectOption, IonSplitPane]
})
export class PartiturasPage implements OnInit {
  partituras: Partitura[] = [];
  partiturasFiltradas: Partitura[] = [];
  usuario: Usuario | null = null;
  nome = '';
  compositor = '';
  instrumento = '';
  categoria = '';
  evento = '';
  busca = '';
  filtroInstrumento = '';
  filtroCategoria = '';
  filtroEvento = '';
  arquivo: File | null = null;
  mostrarPublicacao = false;

  constructor(
    private service: PartiturasService,
    private usuarioService: UsuarioService,
    private toastController: ToastController
  ) {
    addIcons({ calendarOutline, documentTextOutline, downloadOutline, homeOutline, keyOutline, musicalNoteOutline, musicalNotesOutline, peopleOutline, personOutline, trashOutline });
  }

  ngOnInit() {
    this.usuario = this.usuarioService.buscarAutenticacao();
    this.carregar();
  }

  podePublicar(): boolean {
    return this.usuario?.tipo === 'diretoria' || this.usuario?.tipo === 'maestro';
  }

  ehDiretoria(): boolean {
    return this.usuario?.tipo === 'diretoria';
  }

  carregar() {
    this.service.listar().subscribe({
      next: (partituras) => {
        this.partituras = partituras;
        this.aplicarFiltros();
      },
      error: () => this.mostrarMensagem('Não foi possível carregar as partituras.', 'danger')
    });
  }

  selecionarArquivo(event: Event) {
    const arquivo = (event.target as HTMLInputElement).files?.[0] || null;
    this.arquivo = arquivo?.type === 'application/pdf' ? arquivo : null;
    if (arquivo && !this.arquivo) {
      this.mostrarMensagem('Selecione somente arquivos PDF.', 'warning');
    }
  }

  publicar() {
    if (!this.nome.trim() || !this.arquivo) {
      this.mostrarMensagem('Informe o nome e selecione um arquivo PDF.', 'warning');
      return;
    }
    this.service.enviar(this.nome, this.arquivo, {
      compositor: this.compositor,
      instrumento: this.instrumento,
      categoria: this.categoria,
      evento: this.evento
    }).subscribe({
      next: (partitura) => {
        this.partituras = [partitura, ...this.partituras];
        this.nome = '';
        this.compositor = '';
        this.instrumento = '';
        this.categoria = '';
        this.evento = '';
        this.arquivo = null;
        this.mostrarPublicacao = false;
        this.aplicarFiltros();
        this.mostrarMensagem('Partitura publicada com sucesso.', 'success');
      },
      error: () => this.mostrarMensagem('Não foi possível publicar a partitura.', 'danger')
    });
  }

  aplicarFiltros() {
    const termo = this.busca.trim().toLocaleLowerCase();
    this.partiturasFiltradas = this.partituras.filter((partitura) => {
      const texto = [partitura.nome, partitura.compositor, partitura.nomeArquivo]
        .filter(Boolean).join(' ').toLocaleLowerCase();
      return (!termo || texto.includes(termo))
        && (!this.filtroInstrumento || partitura.instrumento === this.filtroInstrumento)
        && (!this.filtroCategoria || partitura.categoria === this.filtroCategoria)
        && (!this.filtroEvento || partitura.evento === this.filtroEvento);
    });
  }

  valoresDoCampo(campo: 'instrumento' | 'categoria' | 'evento'): string[] {
    return Array.from(new Set(this.partituras.map((partitura) => partitura[campo]).filter(Boolean) as string[]));
  }

  baixar(partitura: Partitura) {
    const link = document.createElement('a');
    link.href = partitura.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.download = `${partitura.nome}.pdf`;
    link.click();
  }

  excluir(partitura: Partitura) {
    if (!this.ehDiretoria() || !partitura.id) return;
    this.service.excluir(partitura.id).subscribe({
      next: () => {
        this.partituras = this.partituras.filter((item) => item.id !== partitura.id);
        this.mostrarMensagem('Partitura excluída.', 'success');
      },
      error: () => this.mostrarMensagem('Não foi possível excluir a partitura.', 'danger')
    });
  }

  private async mostrarMensagem(message: string, color: string) {
    const toast = await this.toastController.create({ message, duration: 2200, color });
    await toast.present();
  }
}
