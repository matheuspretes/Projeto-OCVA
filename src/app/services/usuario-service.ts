import { Injectable } from '@angular/core';
import {Usuario} from '../models/usuario';
@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  private readonly API_URL = 'http://localhost:8080/api/v1/musicos';



  salvar(usuario: Usuario): Usuario {

    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    if (usuario.id === 0) {
       usuario.id = (new Date().getTime() / 1000) * Math.random(); //Gera um ID aleatório.
      usuarios.push(usuario);
    } else {
      let posicao = usuarios.findIndex((temp: Usuario) => temp.id === usuario.id);
      usuarios[posicao] = usuario;
    }
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    return usuario;
  }

  listar(): Usuario[] {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    return usuarios;
  }

  buscarPorId(id: number): Usuario {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    let usuario = new Usuario();
    usuario = usuarios.find((temp: Usuario) => temp.id === id);
    return usuario;
  }

  excluir(id: number): boolean {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    usuarios = usuarios.filter((temp: Usuario) => temp.id !== id);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));
    return true;
  }

  autenticar(login: String, senha: String): Usuario {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    let usuario = new Usuario();
    usuario = usuarios.find((temp: Usuario) => temp.login === login && temp.senha === senha);
    return usuario;
  }  

  verificarLogin(login: String): boolean {
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    return !!usuarios.find((temp: Usuario) => temp.login === login);
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

  AlterarDadosUsuario(usuario: Usuario): Usuario{
    let usuarios = JSON.parse(localStorage.getItem('usuarios') || '[]');
    let posicao = usuarios.findIndex((temp: Usuario) => temp.id === usuario.id);

    if (posicao < 0) {
      posicao = usuarios.findIndex((temp: Usuario) => temp.login === usuario.login);
    }

    if (posicao >= 0) {
      usuarios[posicao] = usuario;
      localStorage.setItem('usuarios', JSON.stringify(usuarios));
    }

    return usuario;
  }

}
