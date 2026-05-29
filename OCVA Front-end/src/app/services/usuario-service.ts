import { Injectable } from '@angular/core';
import {Usuario} from '../models/usuario';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class UsuarioService {
  private readonly API_URL = 'http://localhost:8080/api/v1/musicos';

  constructor(private http: HttpClient) { }

  salvar(usuario: Usuario): Observable<Usuario> {

    /*
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    if (usuario.id === 0) {
       usuario.id = (new Date().getTime() / 1000) * Math.random(); //Gera um ID aleatório.
      usuarios.push(usuario);
    } else {
      let posicao = usuarios.findIndex((temp: Usuario) => temp.id === usuario.id);
      usuarios[posicao] = usuario;
    }
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    */


    
    return this.http.post<Usuario>(`${this.API_URL}`, usuario);
  }

  listar(): Observable<Usuario[]> {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    return of(usuarios);
  }

  buscarPorId(id: number): Observable<Usuario> {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    let usuario = new Usuario();
    usuario = usuarios.find((temp: Usuario) => temp.id === id);
    return of(usuario);
  }

  excluir(id: number): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.API_URL}/${id}`);
  }

  autenticar(login: string, senha: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.API_URL}/login?login=${login}&senha=${senha}`, {});
  }  

  verificarLogin(login: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.API_URL}/verificar/${login}`);
  }  

  buscarAutenticacao(): Usuario {
    let usuario = JSON.parse(localStorage.getItem('usuarioAutenticado')|| '{}');
    return usuario;
  } 

  registrarAutenticacao(usuario: Usuario){
    localStorage.setItem('usuarioAutenticado', JSON.stringify(usuario));
  }  

  encerrarAutenticacao(){
    localStorage.removeItem('usuarioAutenticado');
  }   

  AlterarDadosUsuario(usuario: Usuario): Observable<Usuario>{
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    let posicao = usuarios.findIndex((temp: Usuario) => temp.id === usuario.id);

    if (posicao < 0) {
      posicao = usuarios.findIndex((temp: Usuario) => temp.login === usuario.login);
    }

    if (posicao >= 0) {
      usuarios[posicao] = usuario;
      localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }

    return of(usuario);
  }

}
