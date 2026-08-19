export class CodigoAcesso {
    id?: number;
    codigo: string;
    status: 'disponivel' | 'usado' | 'expirado';
    usuarioId?: number;
    usuarioNome?: string;
    dataCriacao: Date;
    dataUso?: Date;
    dataExpiracao?: Date;

    constructor(codigo: string = '') {
        this.codigo = codigo;
        this.status = 'disponivel';
        this.dataCriacao = new Date();
    }
}
