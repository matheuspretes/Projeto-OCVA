import { Injectable } from '@angular/core';
import { Evento } from '../models/evento';

@Injectable({
  providedIn: 'root',
})
export class EventosService {

  salvar(evento: Evento): Evento {
    const eventos: Evento[] = JSON.parse(localStorage.getItem('eventos') || '[]');
    eventos.push(evento);
    localStorage.setItem('eventos', JSON.stringify(eventos));
    return evento;
  }

  listar(): Evento[] {
    return JSON.parse(localStorage.getItem('eventos') || '[]');
  }

  editar(index: number, evento: Evento): Evento | null {
    const eventos: Evento[] = JSON.parse(localStorage.getItem('eventos') || '[]');
    if (index < 0 || index >= eventos.length) {
      return null;
    }
    eventos[index] = evento;
    localStorage.setItem('eventos', JSON.stringify(eventos));
    return evento;
  }

  excluir(index: number): boolean {
    const eventos: Evento[] = JSON.parse(localStorage.getItem('eventos') || '[]');
    if (index < 0 || index >= eventos.length) {
      return false;
    }
    eventos.splice(index, 1);
    localStorage.setItem('eventos', JSON.stringify(eventos));
    return true;
  }
}
