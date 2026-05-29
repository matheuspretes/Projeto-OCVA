export class Usuario {
    id: number;
    nome: string;
    login: string;
    senha: string;
    tipo: string;
    instrumento: string;

    constructor() {
        this.id = 0;
        this.nome = "";
        this.login = "";
        this.senha = "";
        this.tipo = "";
        this.instrumento = "";
    }
}

