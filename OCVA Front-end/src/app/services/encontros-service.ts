import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Encontro, EncontroRequest, TipoEncontro } from '../models/encontro';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EncontrosService {
  private readonly API_URL = `${environment.apiBaseUrl}/api/v1/encontros`;

  constructor(private http: HttpClient) {}

  listar(): Observable<Encontro[]> {
    return this.http.get<Encontro[]>(this.API_URL);
  }

  // Encontros que já aconteceram e não viraram ensaio (ex.: reuniões)
  listarPassados(): Observable<Encontro[]> {
    return this.http.get<Encontro[]>(`${this.API_URL}/passados`);
  }

  // Devolve null quando não há nenhum encontro marcado
  proximo(): Observable<Encontro | null> {
    return this.http.get<Encontro | null>(`${this.API_URL}/proximo`);
  }

  buscarPorId(id: number): Observable<Encontro> {
    return this.http.get<Encontro>(`${this.API_URL}/${id}`);
  }

  salvar(encontro: EncontroRequest): Observable<Encontro> {
    return this.http.post<Encontro>(this.API_URL, encontro);
  }

  editar(encontro: EncontroRequest): Observable<Encontro> {
    return this.http.put<Encontro>(this.API_URL, encontro);
  }

  excluir(id: number): Observable<Encontro> {
    return this.http.delete<Encontro>(`${this.API_URL}/${id}`);
  }

  responder(encontroId: number, musicoId: number, interessado: boolean): Observable<Encontro> {
    return this.http.put<Encontro>(
      `${this.API_URL}/${encontroId}/interesse/${musicoId}?interessado=${interessado}`,
      {}
    );
  }

  removerResposta(encontroId: number, musicoId: number): Observable<Encontro> {
    return this.http.delete<Encontro>(`${this.API_URL}/${encontroId}/interesse/${musicoId}`);
  }

  listarTipos(): Observable<TipoEncontro[]> {
    return this.http.get<TipoEncontro[]>(`${this.API_URL}/tipos`);
  }

  criarTipo(nome: string): Observable<TipoEncontro> {
    return this.http.post<TipoEncontro>(`${this.API_URL}/tipos`, { nome });
  }
}
