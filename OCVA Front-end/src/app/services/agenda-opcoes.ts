import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { Usuario } from '../models/usuario';
import { EventoResumo } from '../models/evento-resumo';
import { UsuarioService } from './usuario-service';
import { EventosService } from './eventos-service';
import { EventosMarcadosService } from './eventos-marcados-service';

// Opção do campo "Evento" no cadastro de ensaio.
// A chave junta o tipo e o id: "m-3" = evento marcado 3, "e-5" = evento realizado 5.
export interface OpcaoEvento {
  chave: string;
  rotulo: string;
}

/**
 * Carrega as opções usadas nos formulários de encontro, ensaio e evento:
 * maestros ativos e eventos para ligar a um ensaio.
 */
@Injectable({ providedIn: 'root' })
export class AgendaOpcoesService {

  constructor(
    private usuarioService: UsuarioService,
    private eventosService: EventosService,
    private eventosMarcadosService: EventosMarcadosService
  ) {}

  // Só maestros ativos podem ser escolhidos como responsáveis
  maestros(): Observable<Usuario[]> {
    return this.usuarioService.listar().pipe(
      map((usuarios) => usuarios.filter((usuario) => usuario.tipo === 'maestro' && usuario.ativo !== false))
    );
  }

  // Próximos eventos primeiro, depois os já realizados (do mais recente ao mais antigo)
  eventos(): Observable<OpcaoEvento[]> {
    return forkJoin({
      marcados: this.eventosMarcadosService.listar(),
      realizados: this.eventosService.listar()
    }).pipe(map(({ marcados, realizados }) => {
      const opcoes: OpcaoEvento[] = [];
      for (const evento of marcados) {
        opcoes.push({ chave: `m-${evento.id}`, rotulo: `${evento.titulo} · ${formatarData(evento.data)}` });
      }
      const ordenados = [...realizados].sort((a, b) => (b.data || '').localeCompare(a.data || ''));
      for (const evento of ordenados) {
        opcoes.push({ chave: `e-${evento.id}`, rotulo: `${evento.titulo || 'Evento'} · ${formatarData(evento.data)} (realizado)` });
      }
      return opcoes;
    }));
  }
}

// Chave do evento ligado a um ensaio ("m-3" ou "e-5"), usada para preencher o campo na edição
export function chaveDoEvento(evento: EventoResumo | null | undefined): string | null {
  if (!evento) {
    return null;
  }
  return `${evento.marcado ? 'm' : 'e'}-${evento.id}`;
}

// Converte a chave escolhida nos campos que a API espera
export function idsDoEvento(chave: string | null): { eventoMarcadoId?: number; eventoId?: number } {
  if (!chave) {
    return {};
  }
  const id = Number(chave.slice(2));
  return chave.startsWith('m-') ? { eventoMarcadoId: id } : { eventoId: id };
}

// "2026-12-07" ou "2026-12-07T19:30:00" -> "07/12/2026"
export function formatarData(data: string | undefined): string {
  if (!data) {
    return '';
  }
  const [ano, mes, dia] = data.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}
