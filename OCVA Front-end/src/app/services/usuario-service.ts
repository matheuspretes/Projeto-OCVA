import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Usuario } from '../models/usuario';
@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  private readonly API_URL = 'https://ocva-api.onrender.com/api/v1/musicos';

  constructor(private http: HttpClient) {
    
  }

  autenticar(login: string, senha: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.API_URL}/login`, null, {
      params: {login,senha,},
    });
  }

  cadastrar(usuario: Usuario): Observable<Usuario> {
    return this.http.post<Usuario>(this.API_URL, usuario);
  }

  salvar(usuario: Usuario): Observable<Usuario> {
    return this.http.put<Usuario>(this.API_URL, usuario);
  }

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.API_URL);
  }

  verificarLogin(login: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.API_URL}/verificar/${encodeURIComponent(login)}`);
  }

  /*salvar(usuario: Usuario): Usuario {

    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    if (usuario.id === 0) {
       usuario.id = (new Date().getTime() / 1000) * Math.random(); 
      usuarios.push(usuario);
    } else {
      let posicao = usuarios.findIndex((temp: Usuario) => temp.id === usuario.id);
      usuarios[posicao] = usuario;
    }
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    return usuario;
  }

  */
  buscarPorId(id: number): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.API_URL}/${id}`);
  }

  excluir(id: number): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.API_URL}/${id}`);
  }

  buscarAutenticacao(): Usuario {
    return JSON.parse(localStorage.getItem('usuarioAutenticado') || '{}');
  }

  registrarAutenticacao(usuario: Usuario) {
    localStorage.setItem('usuarioAutenticado', JSON.stringify(usuario));
  }

  encerrarAutenticacao() {
    localStorage.removeItem('usuarioAutenticado');
  }

  AlterarDadosUsuario(usuario: Usuario): Observable<Usuario> {
    return this.salvar(usuario);
  }
}
