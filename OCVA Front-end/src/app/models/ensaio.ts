import { from } from "rxjs";
import { Usuario } from "./usuario";

export class Ensaio {
    data: string;
    descricao: string;
    musicos: Usuario[];
    constructor() {
        this.data = "";
        this.descricao = "";
        this.musicos = [];
    }
}

