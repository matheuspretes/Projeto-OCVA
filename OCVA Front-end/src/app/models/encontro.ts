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
}
