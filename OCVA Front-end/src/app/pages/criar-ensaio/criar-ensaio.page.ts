import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonToolbar, 
  IonIcon, 
  IonSpinner, 
  ToastController 
} from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { 
  bookOutline, 
  arrowBackOutline, 
  musicalNotesOutline, 
  peopleOutline,
  documentTextOutline,
  closeOutline
} from 'ionicons/icons';

import { EnsaioRequest } from 'src/app/models/ensaio';
import { InstrumentoNecessario } from 'src/app/models/instrumento-necessario';
import { Partitura } from 'src/app/models/partitura';
import { Usuario } from 'src/app/models/usuario';
import { EnsaiosService } from 'src/app/services/ensaios-service';
import { UsuarioService } from 'src/app/services/usuario-service';
import { PartiturasService } from 'src/app/services/partituras-service';
import { dataMaxima, dataMinima, mensagemDeErro } from 'src/app/services/agenda-datas';

@Component({
  selector: 'app-criar-ensaio',
  templateUrl: './criar-ensaio.page.html',
  styleUrls: ['./criar-ensaio.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    ReactiveFormsModule, 
    IonContent, 
    IonHeader, 
    IonToolbar, 
    IonIcon, 
    IonSpinner, 
    RouterLink
  ]
})
export class CriarEnsaioPage implements OnInit {
  formGroup: FormGroup;
  musicos: Usuario[] = [];
  submitted = false;
  isSaving = false;
  ensaioId: number | null = null;
  modoEdicao = false;

  // Limites do calendário (a API faz a mesma validação)
  dataMinima = dataMinima();
  dataMaxima = dataMaxima();

  // Instrumentos necessários para o ensaio
  instrumentos: InstrumentoNecessario[] = [];
  novoInstrumento = '';
  novaQuantidade = 1;

  // Partituras do ensaio
  partituras: Partitura[] = [];
  partiturasSelecionadas: number[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService,
    private ensaiosService: EnsaiosService,
    private partiturasService: PartiturasService,
    private toastController: ToastController,
    private alertController: AlertController,
    private router: Router,
    private route: ActivatedRoute
  ) {
    addIcons({
      bookOutline,
      arrowBackOutline,
      musicalNotesOutline,
      peopleOutline,
      documentTextOutline,
      closeOutline
    });

    this.formGroup = this.formBuilder.group({
      titulo: ['', Validators.required],
      data: ['', Validators.required],
      horario: ['', Validators.required],
      descricao: ['', Validators.required],
      musicos: [[], Validators.required]
    });
  }

  ngOnInit() {
    const usuarioAutenticado = this.usuarioService.buscarAutenticacao();
    if (usuarioAutenticado?.tipo !== 'diretoria') {
      this.router.navigate(['/ensaios']);
      return;
    }

    this.usuarioService.listar().subscribe((usuarios) => {
      this.musicos = usuarios.filter((usuario) => usuario.tipo === 'musico');
    });

    this.partiturasService.listar().subscribe((partituras) => {
      this.partituras = partituras;
    });

    this.route.queryParamMap.subscribe((params) => {
      const idParam = params.get('id');
      if (!idParam) {
        this.modoEdicao = false;
        this.ensaioId = null;
        return;
      }

      const id = Number(idParam);
      if (Number.isNaN(id)) return;

      this.ensaioId = id;
      this.modoEdicao = true;
      this.carregarEnsaio(id);
    });
  }

  private carregarEnsaio(id: number) {
    this.isSaving = true;
    this.ensaiosService.buscarPorId(id).subscribe({
      next: (ensaio: any) => {
        let dataStr = '';
        let horaStr = '';

        if (ensaio.data) {
          const partes = ensaio.data.split('T');
          dataStr = partes[0] || '';
          horaStr = partes[1] ? partes[1].substring(0, 5) : '';
        }

        this.formGroup.patchValue({
          titulo: ensaio.titulo || '',
          data: dataStr,
          horario: horaStr,
          descricao: ensaio.descricao || '',
          musicos: ensaio.musicos || []
        });
        this.instrumentos = ensaio.instrumentos || [];
        this.partiturasSelecionadas = (ensaio.partituras || []).map((partitura: Partitura) => partitura.id);
        this.isSaving = false;
      },
      error: async () => {
        this.isSaving = false;
        const toast = await this.toastController.create({
          message: 'Não foi possível carregar o ensaio',
          duration: 2000,
          color: 'danger'
        });
        await toast.present();
        this.router.navigate(['/ensaios']);
      }
    });
  }

  isMusicoSelecionado(musico: Usuario): boolean {
    const selecionados: Usuario[] = this.formGroup.get('musicos')?.value || [];
    return selecionados.some((m) => m.id === musico.id);
  }

  toggleMusico(musico: Usuario) {
    const selecionados: Usuario[] = [...(this.formGroup.get('musicos')?.value || [])];
    const index = selecionados.findIndex((m) => m.id === musico.id);

    if (index >= 0) {
      selecionados.splice(index, 1);
    } else {
      selecionados.push(musico);
    }

    this.formGroup.patchValue({ musicos: selecionados });
    this.formGroup.get('musicos')?.markAsDirty();
  }

  // Lista de instrumentos dos músicos, usada como sugestão no campo
  get instrumentosDisponiveis(): string[] {
    const nomes: string[] = [];
    for (const musico of this.musicos) {
      if (musico.instrumento && !nomes.includes(musico.instrumento)) {
        nomes.push(musico.instrumento);
      }
    }
    return nomes;
  }

  async adicionarInstrumento() {
    const nome = this.novoInstrumento.trim();
    if (!nome || this.novaQuantidade < 1) {
      await this.mostrarErro('Informe o instrumento e uma quantidade maior que zero.');
      return;
    }

    const jaExiste = this.instrumentos.some((item) => item.instrumento.toLowerCase() === nome.toLowerCase());
    if (jaExiste) {
      await this.mostrarErro('Esse instrumento já foi adicionado.');
      return;
    }

    this.instrumentos.push({ instrumento: nome, quantidade: this.novaQuantidade });
    this.novoInstrumento = '';
    this.novaQuantidade = 1;
  }

  removerInstrumento(index: number) {
    this.instrumentos.splice(index, 1);
  }

  // Quantos músicos selecionados tocam o instrumento
  contarEscalados(instrumento: string): number {
    const selecionados: Usuario[] = this.formGroup.get('musicos')?.value || [];
    return selecionados.filter((musico) =>
      (musico.instrumento || '').toLowerCase() === instrumento.toLowerCase()
    ).length;
  }

  isPartituraSelecionada(partitura: Partitura): boolean {
    return this.partiturasSelecionadas.includes(partitura.id as number);
  }

  togglePartitura(partitura: Partitura) {
    const id = partitura.id as number;
    if (this.isPartituraSelecionada(partitura)) {
      this.partiturasSelecionadas = this.partiturasSelecionadas.filter((item) => item !== id);
    } else {
      this.partiturasSelecionadas.push(id);
    }
  }

  private async mostrarErro(mensagem: string) {
    const toast = await this.toastController.create({ message: mensagem, duration: 2500, color: 'danger' });
    await toast.present();
  }

  isInvalid(controlName: string): boolean {
    const control = this.formGroup.get(controlName);
    if (!control) return false;
    return control.invalid && (control.touched || control.dirty || this.submitted);
  }

  async salvar() {
    const usuarioAutenticado = this.usuarioService.buscarAutenticacao();
    if (usuarioAutenticado?.tipo !== 'diretoria') {
      this.router.navigate(['/ensaios']);
      return;
    }

    this.submitted = true;
    if (this.formGroup.invalid) {
      const t = await this.toastController.create({ 
        message: 'Preencha todos os campos obrigatórios', 
        duration: 2000, 
        color: 'danger' 
      });
      await t.present();
      return;
    }

    this.isSaving = true;
    const form = this.formGroup.value;

    const dataFinal = `${form.data}T${form.horario}:00`;

    const ensaio: EnsaioRequest = {
      id: this.ensaioId ?? undefined,
      titulo: form.titulo,
      data: dataFinal,
      descricao: form.descricao,
      musicoIds: (form.musicos || [])
        .map((musico: Usuario | { id?: number }) => musico.id)
        .filter((id: number | undefined): id is number => id !== undefined),
      criadorId: usuarioAutenticado?.id,
      instrumentos: this.instrumentos,
      partituraIds: this.partiturasSelecionadas
    };

    const requisicao = this.modoEdicao && this.ensaioId
      ? this.ensaiosService.editar(ensaio)
      : this.ensaiosService.salvar(ensaio);

    requisicao.subscribe({
      next: async () => {
        const toast = await this.toastController.create({
          message: this.modoEdicao ? 'Ensaio atualizado com sucesso' : 'Ensaio salvo com sucesso',
          duration: 1500,
          color: 'success'
        });
        await toast.present();
        this.router.navigate(['/ensaios']);
        this.isSaving = false;
      },
      error: async (error) => {
        const padrao = this.modoEdicao ? 'Erro ao atualizar ensaio' : 'Erro ao salvar ensaio';
        await this.mostrarErro(mensagemDeErro(error, padrao));
        this.isSaving = false;
      }
    });
  }

  async excluir() {
    if (!this.ensaioId) return;

    const alert = await this.alertController.create({
      header: 'Confirmar exclusão',
      message: 'Tem certeza que deseja excluir este ensaio?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Excluir',
          role: 'destructive',
          handler: () => {
            this.ensaiosService.excluir(this.ensaioId as number).subscribe({
              next: async () => {
                const toast = await this.toastController.create({ 
                  message: 'Ensaio excluído com sucesso', 
                  duration: 1500, 
                  color: 'warning' 
                });
                await toast.present();
                this.router.navigate(['/ensaios']);
              },
              error: async () => {
                const toast = await this.toastController.create({ 
                  message: 'Erro ao excluir ensaio', 
                  duration: 2000, 
                  color: 'danger' 
                });
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