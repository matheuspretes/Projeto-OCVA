import { EventoResumo } from './evento-resumo';

export interface TipoEncontro {
  id: number;
  nome: string;
}

export interface Encontro {
  id?: number;
  data: string;   // aaaa-mm-dd
  hora: string;   // hh:mm
  titulo: string;
  descricao: string;
  tipo: TipoEncontro;
  criador?: any;
  maestro?: any;               // maestro responsável
  evento?: EventoResumo | null; // só para encontros do tipo Ensaio
  interessados?: any[];
  recusados?: any[];
}

export interface EncontroRequest {
  id?: number;
  data: string;
  hora: string;
  titulo: string;
  descricao: string;
  tipoId: number;
  criadorId?: number;
  maestroId?: number;
  eventoMarcadoId?: number;
  eventoId?: number;
}
