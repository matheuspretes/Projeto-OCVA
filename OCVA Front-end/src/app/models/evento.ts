import { from } from "rxjs";
import { Usuario } from "./usuario";

export interface Evento {
    data: string;
    descricao: string;
    musicos: Usuario[];
    titulo?: string; 
}

