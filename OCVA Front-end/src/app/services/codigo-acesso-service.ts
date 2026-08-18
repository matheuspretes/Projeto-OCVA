import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CodigoAcesso } from '../models/codigo-acesso';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CodigoAcessoService {
  private readonly API_URL = `${environment.apiBaseUrl}/api/v1/codigos-acesso`;

  constructor(private http: HttpClient) {}

  /**
   * Gera um novo código de acesso (apenas para diretoria)
   */
  gerarCodigo(): Observable<CodigoAcesso> {
    return this.http.post<CodigoAcesso>(`${this.API_URL}/gerar`, {});
  }

  /**
   * Lista todos os códigos de acesso (apenas para diretoria)
   */
  listarCodigos(): Observable<CodigoAcesso[]> {
    return this.http.get<CodigoAcesso[]>(this.API_URL);
  }

  /**
   * Valida e usa um código de acesso (durante cadastro do usuário)
   * @param codigo - Código de 8 caracteres
   * @returns CodigoAcesso com status atualizado
   */
  validarEUsarCodigo(codigo: string): Observable<CodigoAcesso> {
    return this.http.post<CodigoAcesso>(`${this.API_URL}/validar`, { codigo });
  }

  /**
   * Verifica se um código é válido e está disponível
   * @param codigo - Código a verificar
   */
  verificarDisponibilidade(codigo: string): Observable<{ disponivel: boolean; mensagem: string }> {
    return this.http.get<{ disponivel: boolean; mensagem: string }>(
      `${this.API_URL}/verificar/${encodeURIComponent(codigo)}`
    );
  }

  /**
   * Busca um código específico
   */
  buscarPorCodigo(codigo: string): Observable<CodigoAcesso> {
    return this.http.get<CodigoAcesso>(`${this.API_URL}/${encodeURIComponent(codigo)}`);
  }

  /**
   * Lista códigos por status
   */
  listarPorStatus(status: 'disponivel' | 'usado' | 'expirado'): Observable<CodigoAcesso[]> {
    return this.http.get<CodigoAcesso[]>(`${this.API_URL}/status/${status}`);
  }

  /**
   * Deleta um código (apenas para códigos não utilizados)
   */
  deletarCodigo(codigo: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${encodeURIComponent(codigo)}`);
  }
}
