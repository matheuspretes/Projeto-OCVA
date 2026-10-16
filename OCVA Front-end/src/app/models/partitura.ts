export interface Partitura {
  id?: number;
  nome: string;
  url: string;
  publicId: string;
  compositor?: string;
  instrumento?: string;
  categoria?: string;
  evento?: string;
  nomeArquivo?: string;
  dataPublicacao?: string;
}
