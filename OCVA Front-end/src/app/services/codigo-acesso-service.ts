import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CodigoAcesso } from '../models/codigo-acesso';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CodigoAcessoService {
  private readonly API_URL = 'https://ocva-api.onrender.com/api/v1/codigos-acesso';

  constructor(private http: HttpClient) {}

  listarCodigos(): Observable<CodigoAcesso[]> {
    return this.http.get<CodigoAcesso[]>(this.API_URL);
  }

  gerarCodigo(): Observable<CodigoAcesso> {
    return this.http.post<CodigoAcesso>(`${this.API_URL}/gerar`, {});
  }

  deletarCodigo(codigo: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${encodeURIComponent(codigo)}`);
  }

  verificarDisponibilidade(codigo: string): Observable<{ disponivel: boolean; mensagem: string }> {
    return this.http.get<{ disponivel: boolean; mensagem: string }>(
      `${this.API_URL}/verificar/${encodeURIComponent(codigo)}`
    );
  }

  validarEUsarCodigo(codigo: string, usuarioId?: number, usuarioNome?: string): Observable<CodigoAcesso> {
    return this.http.post<CodigoAcesso>(`${this.API_URL}/validar`, {
      codigo,
      usuarioId,
      usuarioNome
    });
  }
}