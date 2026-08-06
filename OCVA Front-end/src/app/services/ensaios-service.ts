import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Ensaio } from '../models/ensaio';

@Injectable({
  providedIn: 'root',
})
export class EnsaiosService {
  private readonly API_URL = 'http://localhost:8080/api/v1/ensaios';

  constructor(private http: HttpClient) {}

  salvar(ensaio: Ensaio): Observable<Ensaio> {
    return this.http.post<Ensaio>(this.API_URL, ensaio);
  }

  listar(): Observable<Ensaio[]> {
    return this.http.get<Ensaio[]>(this.API_URL);
  }

  buscarPorId(id: number): Observable<Ensaio> {
    return this.http.get<Ensaio>(`${this.API_URL}/${id}`);
  }

  editar(ensaio: Ensaio): Observable<Ensaio> {
    return this.http.put<Ensaio>(this.API_URL, ensaio);
  }

  excluir(id: number): Observable<Ensaio> {
    return this.http.delete<Ensaio>(`${this.API_URL}/${id}`);
  }
}
