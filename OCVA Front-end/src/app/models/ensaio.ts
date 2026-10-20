export interface Ensaio {
  id?: number;
  data: string;
  descricao: string;
  musicos: any[];
  presencas?: any[];
  faltas?: any[];
  criador?: any;
  titulo?: string; 
}

export interface EnsaioRequest {
  id?: number;
  data: string;
  descricao: string;
  titulo?: string;
  musicoIds: number[];
  criadorId?: number;
}