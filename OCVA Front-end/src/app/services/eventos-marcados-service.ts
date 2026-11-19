import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EventoMarcado, EventoMarcadoRequest } from '../models/evento-marcado';

@Injectable({
  providedIn: 'root',
})
export class EventosMarcadosService {
  private readonly API_URL = `${environment.apiBaseUrl}/api/v1/eventos-marcados`;

  constructor(private http: HttpClient) {}

  listar(): Observable<EventoMarcado[]> {
    return this.http.get<EventoMarcado[]>(this.API_URL);
  }

  // Devolve null quando não há nenhum evento marcado
  proximo(): Observable<EventoMarcado | null> {
    return this.http.get<EventoMarcado | null>(`${this.API_URL}/proximo`);
  }

  buscarPorId(id: number): Observable<EventoMarcado> {
    return this.http.get<EventoMarcado>(`${this.API_URL}/${id}`);
  }

  salvar(evento: EventoMarcadoRequest): Observable<EventoMarcado> {
    return this.http.post<EventoMarcado>(this.API_URL, evento);
  }

  editar(evento: EventoMarcadoRequest): Observable<EventoMarcado> {
    return this.http.put<EventoMarcado>(this.API_URL, evento);
  }

  excluir(id: number): Observable<EventoMarcado> {
    return this.http.delete<EventoMarcado>(`${this.API_URL}/${id}`);
  }

  responder(eventoId: number, musicoId: number, interessado: boolean): Observable<EventoMarcado> {
    return this.http.put<EventoMarcado>(
      `${this.API_URL}/${eventoId}/interesse/${musicoId}?interessado=${interessado}`,
      {}
    );
  }

  removerResposta(eventoId: number, musicoId: number): Observable<EventoMarcado> {
    return this.http.delete<EventoMarcado>(`${this.API_URL}/${eventoId}/interesse/${musicoId}`);
  }
}
