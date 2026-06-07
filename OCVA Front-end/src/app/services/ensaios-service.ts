import { Injectable } from '@angular/core';
import { Ensaio } from '../models/ensaio';

@Injectable({
  providedIn: 'root',
})
export class EnsaiosService {

  salvar(ensaio: Ensaio): Ensaio {
    const ensaios: Ensaio[] = JSON.parse(localStorage.getItem('ensaios') || '[]');
    ensaios.push(ensaio);
    localStorage.setItem('ensaios', JSON.stringify(ensaios));
    return ensaio;
  }

  listar(): Ensaio[] {
    return JSON.parse(localStorage.getItem('ensaios') || '[]');
  }

  editar(index: number, ensaio: Ensaio): Ensaio | null {
    const ensaios: Ensaio[] = JSON.parse(localStorage.getItem('ensaios') || '[]');
    if (index < 0 || index >= ensaios.length) {
      return null;
    }
    ensaios[index] = ensaio;
    localStorage.setItem('ensaios', JSON.stringify(ensaios));
    return ensaio;
  }

  excluir(index: number): boolean {
    const ensaios: Ensaio[] = JSON.parse(localStorage.getItem('ensaios') || '[]');
    if (index < 0 || index >= ensaios.length) {
      return false;
    }
    ensaios.splice(index, 1);
    localStorage.setItem('ensaios', JSON.stringify(ensaios));
    return true;
  }
}
