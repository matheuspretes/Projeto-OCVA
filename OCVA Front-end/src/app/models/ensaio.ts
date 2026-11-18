import { InstrumentoNecessario } from './instrumento-necessario';
import { Partitura } from './partitura';

export interface Ensaio {
  id?: number;
  data: string;
  descricao: string;
  musicos: any[];
  presencas?: any[];
  faltas?: any[];
  criador?: any;
  titulo?: string;
  instrumentos?: InstrumentoNecessario[];
  partituras?: Partitura[];
}

export interface EnsaioRequest {
  id?: number;
  data: string;
  descricao: string;
  titulo?: string;
  musicoIds: number[];
  criadorId?: number;
  instrumentos: InstrumentoNecessario[];
  partituraIds: number[];
}
