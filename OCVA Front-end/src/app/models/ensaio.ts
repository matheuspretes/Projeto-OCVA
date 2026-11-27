import { EventoResumo } from './evento-resumo';

export interface Ensaio {
  id?: number;
  data: string;
  descricao: string;
  musicos: any[];
  presencas?: any[];
  faltas?: any[];
  criador?: any;
  maestro?: any;               // maestro responsável
  evento?: EventoResumo | null; // evento para o qual o ensaio prepara
  titulo?: string;
  tipo?: string; // tipo do encontro de origem (ex.: "Reunião")
  instrumentos?: { instrumento: string; quantidade: number; escalados?: number }[];
  partituras?: any[];
}

export interface EnsaioRequest {
  id?: number;
  data: string;
  descricao: string;
  titulo?: string;
  musicoIds: number[];
  criadorId?: number;
  maestroId?: number;
  eventoMarcadoId?: number;
  eventoId?: number;
  instrumentos?: { instrumento: string; quantidade: number }[];
  partituraIds?: number[];
}