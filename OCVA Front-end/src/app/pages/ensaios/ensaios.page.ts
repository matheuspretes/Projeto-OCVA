import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonButtons, 
  IonBackButton, 
  IonCard, 
  IonCardHeader, 
  IonCardTitle, 
  IonCardSubtitle, 
  IonCardContent, 
  IonChip,         
  IonLabel         
} from '@ionic/angular/standalone';
import { EnsaiosService } from '../../services/ensaios-service'; // Ajuste o caminho se necessário
import { UsuarioService } from '../../services/usuario-service'; // Ajuste o caminho se necessário

@Component({
  selector: 'app-ensaios',
  templateUrl: './ensaios.page.html',
  styleUrls: ['./ensaios.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    RouterLink,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonButtons, 
    IonBackButton, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardSubtitle, 
    IonCardContent,
    IonChip,         
    IonLabel         
  ]
})
export class EnsaiosPage implements OnInit {
  
  // Alterado para any[] para evitar erros de compilação com propriedades dinâmicas no HTML
  ensaios: any[] = []; 
  usuarioAutenticado: any = null;

  constructor(
    private ensaiosService: EnsaiosService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    // 1. Recupera o usuário que está logado no sistema
    this.usuarioAutenticado = this.usuarioService.buscarAutenticacao();

    // 2. Busca a lista de todos os ensaios cadastrados no localStorage
    const ensaiosTexto = localStorage.getItem('ensaios') || '[]';
    const todosOsEnsaios = JSON.parse(ensaiosTexto);

    let ensaiosFiltrados = [];

    // 3. Filtro de segurança por perfil de usuário
    if (this.usuarioAutenticado && (this.usuarioAutenticado.tipo === 'maestro' || this.usuarioAutenticado.tipo === 'diretoria')) {
      // Maestro e Diretoria têm acesso total a todos os ensaios
      ensaiosFiltrados = todosOsEnsaios;
    } else if (this.usuarioAutenticado) {
      // Músicos só vêm os ensaios onde o e-mail/login deles foi escalado
      const userLogin = this.usuarioAutenticado.login;
      const userId = this.usuarioAutenticado.id;
      
      ensaiosFiltrados = todosOsEnsaios.filter((e: any) => 
        (e.musicos || []).some((m: any) => m.login === userLogin || m.id === userId)
      );
    } else {
      // Se não houver ninguém autenticado, por segurança a lista fica vazia
      ensaiosFiltrados = [];
    }

    // 4. Mapeamento para extrair os nomes dos músicos que já estão dentro do ensaio
    this.ensaios = ensaiosFiltrados.map((ensaio: any) => {
      return {
        ...ensaio,
        // Cria o array de strings 'nomesMusicos' pegando direto a propriedade '.nome' de cada músico
        nomesMusicos: (ensaio.musicos || []).map((m: any) => m.nome)
      };
    });

    // Log para controle no console do navegador (F12)
    console.log('Ensaios carregados e filtrados com sucesso:', this.ensaios);
  }
}