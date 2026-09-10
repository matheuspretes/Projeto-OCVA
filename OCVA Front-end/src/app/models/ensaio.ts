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