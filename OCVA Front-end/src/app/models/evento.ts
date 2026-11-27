import { Usuario } from "./usuario";

export interface Evento {
    id?: number;
    data: string;
    descricao: string;
    musicos: Usuario[];
    presencas?: Usuario[];
    faltas?: Usuario[];
    instrumentos?: { instrumento: string; quantidade: number; escalados?: number }[];
    partituras?: any[];
    musicoIds?: number[];
    partituraIds?: number[];
    titulo?: string; 
    local?: string;
    banner?: string;
    maestro?: Usuario;   // maestro responsável
    maestroId?: number;
}
