import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Partitura } from '../models/partitura';

@Injectable({ providedIn: 'root' })
export class PartiturasService {
  private readonly api = 'https://ocva-api.onrender.com/api/partituras';

  constructor(private http: HttpClient) {}

  listar(): Observable<Partitura[]> {
    return this.http.get<Partitura[]>(this.api);
  }

  enviar(nome: string, arquivo: File, dados: Partial<Partitura> = {}): Observable<Partitura> {
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('partitura', arquivo);
    Object.entries(dados).forEach(([chave, valor]) => {
      if (valor) formData.append(chave, String(valor));
    });
    return this.http.post<Partitura>(`${this.api}/upload`, formData);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
