package br.cefetmg.ocva.controller;

import java.time.LocalDateTime;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.annotation.JsonTypeInfo.Id;

import br.cefetmg.ocva.model.CodigoAcesso;
import br.cefetmg.ocva.model.Musico;
import br.cefetmg.ocva.repository.CodigoAcessoRepository;
import br.cefetmg.ocva.repository.MusicoRepository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.transaction.annotation.Transactional;




@RestController
@RequestMapping("/api/v1/musicos")
@CrossOrigin(origins = "*")
public class MusicoController {

    
    private static List <Musico> MusicoList;
    private MusicoRepository repository;
    private final CodigoAcessoRepository codigoAcessoRepository;
    private static Long nextId = 1L;
    {
        MusicoList = new ArrayList<>();
    }

    public MusicoController (MusicoRepository repository, CodigoAcessoRepository codigoAcessoRepository){
        this.repository = repository;
        this.codigoAcessoRepository = codigoAcessoRepository;
    }

    @GetMapping("")
    public List<Musico> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Musico getById(@PathVariable Long id) {
       
        return repository.findById(id).orElse(null);
    }

    @PostMapping("")
    @Transactional
    public Musico inserir(@RequestBody Musico musico) {
        musico.setId(null);
        if (musico.getAtivo() == null) {
            musico.setAtivo(true);
        }

        Musico salvo = repository.save(musico);
        String codigo = musico.getCodigoAcesso();

        if (codigo != null && !codigo.isBlank()) {
            CodigoAcesso codigoAcesso = codigoAcessoRepository
                .findByCodigo(codigo.trim().toUpperCase(java.util.Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Código de acesso não encontrado."));

            if (codigoAcesso.FoiUtilizado()
                    || (codigoAcesso.getDataExpiracao() != null
                    && codigoAcesso.getDataExpiracao().isBefore(LocalDateTime.now()))) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Código de acesso já utilizado ou expirado.");
            }

            codigoAcesso.setStatus("utilizado");
            codigoAcesso.setDataUso(LocalDateTime.now());
            codigoAcesso.setUsuarioId(salvo.getId());
            codigoAcesso.setUsuarioNome(salvo.getNome());
            codigoAcessoRepository.save(codigoAcesso);
        }

        return salvo;
    }

    @DeleteMapping("/{id}")
    public Musico excluir (@PathVariable long id){
        /*for(int i = 0; i < MusicoList.size(); i++) {*/
            Musico musico = repository.findById(id).orElse(null);
              if(musico == null){
                 throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Musico com id:"+ id +"não encontrado");
            }
        repository.deleteById(id);;
        return musico;
    } 
    
    @PutMapping("")
    public Musico Alterar (@RequestBody Musico musico) {
        /*for(int i = 0; i < MusicoList.size(); i++){
            Musico musaux = MusicoList.get(i);*/

               if(musico.getId() == null) {
                  throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"id é obrigatório");
               }

        if (musico.getAtivo() == null) {
            musico.setAtivo(true);
        }
    
        repository.save(musico);
        return musico;
    }
    
    @PostMapping("/login")
    public Musico login(@RequestParam String login, @RequestParam String senha) {
        Musico musico = repository.findByLoginAndSenha(login, senha)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Login ou senha inválidos"));
        if (Boolean.FALSE.equals(musico.getAtivo())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Usuário suspenso");
        }
        return musico;
    }
    
    @GetMapping("/verificar/{login}")
    public boolean verificarLogin(@PathVariable String login) {
        return repository.findByLogin(login).isPresent();
    }
    
    

    
   


   
    
}
