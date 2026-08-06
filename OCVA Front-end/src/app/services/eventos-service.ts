import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Evento } from '../models/evento';

@Injectable({
  providedIn: 'root',
})
export class EventosService {
  private readonly API_URL = 'https://ocva-api.onrender.com/api/v1/eventos';

  constructor(private http: HttpClient) {
    
  }

  salvar(evento: Evento): Observable<Evento> {
    return this.http.post<Evento>(this.API_URL, evento);
  }

  listar(): Observable<Evento[]> {
    return this.http.get<Evento[]>(this.API_URL);
  }

  buscarPorId(id: number): Observable<Evento> {
    return this.http.get<Evento>(`${this.API_URL}/${id}`);
  }

  editar(evento: Evento): Observable<Evento> {
    return this.http.put<Evento>(this.API_URL, evento);
  }

  excluir(id: number): Observable<Evento> {
    return this.http.delete<Evento>(`${this.API_URL}/${id}`);
  }
}
