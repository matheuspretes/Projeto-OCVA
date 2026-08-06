import { Usuario } from "./usuario";

export interface Evento {
    id?: number;
    data: string;
    descricao: string;
    musicos: Usuario[];
    titulo?: string; 
}

