import { TipoUsuario } from 'src/app/constantes/tipo-usuario';

export class Usuario {
    id: number;
    nome: string;
    login: string;
    senha: string;
    tipo: TipoUsuario;
    instrumento: string;
    codigoAcesso?: string;
    codigoAcessoId?: number;

    constructor() {
        this.id = 0;
        this.nome = "";
        this.login = "";
        this.senha = "";
        this.tipo = TipoUsuario[4].value;
        this.instrumento = "";
        this.codigoAcesso = "";
        this.codigoAcessoId = 0;
    }
}

