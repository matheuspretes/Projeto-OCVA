import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { IonIcon, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline, locationOutline, checkmarkCircle, checkmarkCircleOutline, closeCircle, closeCircleOutline, createOutline,
  musicalNote, peopleOutline, personOutline, timeOutline
} from 'ionicons/icons';
import { Observable } from 'rxjs';
import { AppLayoutComponent } from 'src/app/components/app-layout/app-layout.component';
import { Evento } from 'src/app/models/evento';
import { EventosService } from '../../services/eventos-service';

type Situacao = 'presente' | 'falta' | null;

@Component({
  selector: 'app-evento-detalhe',
  templateUrl: './evento-detalhe.page.html',
  // Mesmo visual do detalhe de ensaio
  styleUrls: ['../ensaio-detalhe/ensaio-detalhe.page.scss', './evento-detalhe.page.scss'],
  standalone: true,
  imports: [AppLayoutComponent, CommonModule, ReactiveFormsModule, RouterLink, IonIcon, IonSpinner]
})
export class EventoDetalhePage implements OnInit {
  evento: Evento | null = null;
  carregando = true;
  usuarioAutenticado: any = null;
  marcacoesEmAndamento = new Set<number>();

  editando = false;
  salvando = false;
  formGroup: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private eventosService: EventosService,
    private toastController: ToastController,
    private formBuilder: FormBuilder
  ) {
    addIcons({
      calendarOutline, locationOutline, checkmarkCircle, checkmarkCircleOutline, closeCircle, closeCircleOutline, createOutline,
      musicalNote, peopleOutline, personOutline, timeOutline
    });

    this.formGroup = this.formBuilder.group({
      titulo: ['', [Validators.required, Validators.maxLength(120)]],
      data: ['', Validators.required],
      horario: ['', Validators.required],
      local: ['', [Validators.required, Validators.maxLength(160)]],
      descricao: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.usuarioAutenticado = JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}');
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.carregando = false;
      return;
    }

    this.eventosService.buscarPorId(id).subscribe({
      next: (evento) => {
        this.evento = evento;
        this.carregando = false;
      },
      error: () => {
        this.carregando = false;
      }
    });
  }

  podeGerenciar(): boolean {
    return this.usuarioAutenticado?.tipo === 'maestro' || this.usuarioAutenticado?.tipo === 'diretoria';
  }

  // ---------- Edição das informações ----------

  iniciarEdicao() {
    if (!this.evento) {
      return;
    }
    const [data, hora] = (this.evento.data || '').split('T');
    this.formGroup.reset({
      titulo: this.evento.titulo || '',
      data: data || '',
      horario: (hora || '').slice(0, 5),
      local: this.evento.local || '',
      descricao: this.evento.descricao || ''
    });
    this.editando = true;
  }

  cancelarEdicao() {
    this.editando = false;
  }

  salvarEdicao() {
    if (!this.evento?.id || this.salvando) {
      return;
    }
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      this.mostrarToast('Preencha todos os campos.', 'warning');
      return;
    }

    const form = this.formGroup.value;
    // Envia também músicos, banner, instrumentos e partituras atuais para não apagá-los
    const requisicao: any = {
      id: this.evento.id,
      titulo: form.titulo.trim(),
      data: `${form.data}T${form.horario}:00`,
      local: form.local.trim(),
      descricao: form.descricao.trim(),
      banner: this.evento.banner,
      maestroId: this.evento.maestro?.id,
      musicoIds: (this.evento.musicos || []).map((musico: any) => musico.id),
      instrumentos: (this.evento.instrumentos || []).map((item) => ({ instrumento: item.instrumento, quantidade: item.quantidade })),
      partituraIds: (this.evento.partituras || []).map((partitura: any) => partitura.id)
    };

    // Mantém exatamente a data original se dia e horário não mudaram (evita a validação de data passada)
    const [dataOriginal, horaOriginal] = (this.evento.data || '').split('T');
    if (form.data === dataOriginal && form.horario === (horaOriginal || '').slice(0, 5)) {
      requisicao.data = this.evento.data;
    }

    this.salvando = true;
    this.eventosService.editar(requisicao).subscribe({
      next: (eventoAtualizado) => {
        this.evento = eventoAtualizado;
        this.editando = false;
        this.salvando = false;
        this.mostrarToast('Evento atualizado.', 'success');
      },
      error: (erro) => {
        this.salvando = false;
        this.mostrarToast(erro?.error?.message || 'Não foi possível salvar as alterações.', 'danger');
      }
    });
  }

  campoInvalido(campo: string): boolean {
    const control = this.formGroup.get(campo);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  // ---------- Presença ----------

  situacao(musico: any): Situacao {
    if ((this.evento?.presencas || []).some((item: any) => item.id === musico.id)) {
      return 'presente';
    }
    if ((this.evento?.faltas || []).some((item: any) => item.id === musico.id)) {
      return 'falta';
    }
    return null;
  }

  emAndamento(musico: any): boolean {
    return this.marcacoesEmAndamento.has(musico.id);
  }

  contar(situacao: Situacao): number {
    return (this.evento?.musicos || []).filter((musico: any) => this.situacao(musico) === situacao).length;
  }

  /**
   * Pode ser clicado quantas vezes for preciso:
   * - na mesma opção já marcada: desfaz a marcação;
   * - na outra opção: troca presença por falta (ou o contrário).
   */
  alternarPresenca(musico: any, presente: boolean) {
    if (!this.podeGerenciar() || !this.evento?.id || !musico.id || this.emAndamento(musico)) {
      return;
    }

    const eventoId = this.evento.id;
    const atual = this.situacao(musico);
    const alvo: Situacao = presente ? 'presente' : 'falta';

    let requisicao: Observable<Evento>;
    let mensagem: string;
    if (atual === alvo) {
      requisicao = this.eventosService.removerPresenca(eventoId, musico.id);
      mensagem = `Marcação de ${musico.nome} removida`;
    } else {
      requisicao = this.eventosService.marcarPresenca(eventoId, musico.id, presente);
      mensagem = presente ? `${musico.nome} marcado como presente` : `${musico.nome} marcado com falta`;
    }

    this.marcacoesEmAndamento.add(musico.id);
    requisicao.subscribe({
      next: (eventoAtualizado) => {
        this.evento = eventoAtualizado;
        this.marcacoesEmAndamento.delete(musico.id);
        this.mostrarToast(mensagem, 'medium', 1200);
      },
      error: () => {
        this.marcacoesEmAndamento.delete(musico.id);
        this.mostrarToast('Não foi possível salvar a presença.', 'danger');
      }
    });
  }

  // ---------- Formatação ----------

  dataFormatada(): string {
    const [data, hora] = (this.evento?.data || '').split('T');
    const partes = (data || '').split('-').map(Number);
    if (partes.length !== 3 || partes.some(Number.isNaN)) {
      return this.evento?.data || '';
    }
    const d = new Date(partes[0], partes[1] - 1, partes[2]);
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const texto = `${dias[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} de ${meses[d.getMonth()]} de ${d.getFullYear()}`;
    return hora ? `${texto} · ${hora.slice(0, 5).replace(':', 'h')}` : texto;
  }

  iniciais(nome: string | undefined): string {
    const partes = (nome || '?').trim().split(/\s+/);
    return ((partes[0]?.[0] || '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase() || '?';
  }

  private async mostrarToast(message: string, color: string, duration = 2500) {
    const toast = await this.toastController.create({ message, duration, color });
    await toast.present();
  }
}
