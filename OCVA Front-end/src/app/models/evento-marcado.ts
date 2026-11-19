// Evento que ainda vai acontecer. Depois da data ele vira um Evento (arquivo).
export interface EventoMarcado {
  id?: number;
  data: string;   // aaaa-mm-dd
  hora: string;   // hh:mm
  titulo: string;
  local: string;
  descricao: string;
  banner?: string;
  criador?: any;
  interessados?: any[];
  recusados?: any[];
}

export interface EventoMarcadoRequest {
  id?: number;
  data: string;
  hora: string;
  titulo: string;
  local: string;
  descricao: string;
  banner?: string;
  criadorId?: number;
}
