import { InstrumentoNecessario } from './instrumento-necessario';
import { Partitura } from './partitura';
import { Usuario } from './usuario';

export interface Evento {
    id?: number;
    data: string;
    descricao: string;
    musicos: Usuario[];
    titulo?: string;
    local?: string;
    banner?: string;
    instrumentos?: InstrumentoNecessario[];
    partituras?: Partitura[];

    // Campos enviados para a API ao salvar
    musicoIds?: number[];
    partituraIds?: number[];
}
