import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Ensaio, EnsaioRequest } from '../models/ensaio';

@Injectable({
  providedIn: 'root',
})
export class EnsaiosService {
  private readonly API_URL = 'https://ocva-api.onrender.com/api/v1/ensaios';

  constructor(private http: HttpClient) {}

  salvar(ensaio: EnsaioRequest): Observable<Ensaio> {
    return this.http.post<Ensaio>(this.API_URL, ensaio);
  }

  listar(): Observable<Ensaio[]> {
    return this.http.get<Ensaio[]>(this.API_URL);
  }

  buscarPorId(id: number): Observable<Ensaio> {
    return this.http.get<Ensaio>(`${this.API_URL}/${id}`);
  }

  editar(ensaio: EnsaioRequest): Observable<Ensaio> {
    return this.http.put<Ensaio>(this.API_URL, ensaio);
  }

  marcarPresenca(ensaioId: number, musicoId: number, presente: boolean): Observable<Ensaio> {
    return this.http.put<Ensaio>(
      `${this.API_URL}/${ensaioId}/presenca/${musicoId}?presente=${presente}`,
      {}
    );
  }

  removerPresenca(ensaioId: number, musicoId: number): Observable<Ensaio> {
    return this.http.delete<Ensaio>(`${this.API_URL}/${ensaioId}/presenca/${musicoId}`);
  }

  excluir(id: number): Observable<Ensaio> {
    return this.http.delete<Ensaio>(`${this.API_URL}/${id}`);
  }
}