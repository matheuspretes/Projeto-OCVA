export interface Ensaio {
  id?: number;
  data: string;
  descricao: string;
  musicos: any[];
  presencas?: any[];
  faltas?: any[];
  criador?: any;
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
  instrumentos?: { instrumento: string; quantidade: number }[];
  partituraIds?: number[];
}