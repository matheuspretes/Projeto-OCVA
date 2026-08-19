import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CodigoAcesso } from '../models/codigo-acesso';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CodigoAcessoService {
  private readonly api = 'https://ocva-api.onrender.com/api/v1/codigos-acesso';

  constructor(private http: HttpClient) {}

  listarCodigos(): Observable<CodigoAcesso[]> {
    return this.http.get<CodigoAcesso[]>(this.api);
  }

  cadastrarCodigo(codigo: string): Observable<CodigoAcesso> {
    return this.http.post<CodigoAcesso>(`${this.api}/cadastrar`, { codigo });
  }

  deletarCodigo(codigo: string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${encodeURIComponent(codigo)}`);
  }

  verificarDisponibilidade(codigo: string): Observable<{ disponivel: boolean; mensagem: string }> {
    return this.http.get<{ disponivel: boolean; mensagem: string }>(
      `${this.api}/verificar/${encodeURIComponent(codigo)}`
    );
  }

  validarEUsarCodigo(codigo: string, usuarioId?: number, usuarioNome?: string): Observable<CodigoAcesso> {
    return this.http.post<CodigoAcesso>(`${this.api}/validar`, {
      codigo,
      usuarioId,
      usuarioNome
    });
  }
  // pode deletar isso daqui é só um teste
}