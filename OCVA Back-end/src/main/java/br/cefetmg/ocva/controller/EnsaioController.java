package br.cefetmg.ocva.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import br.cefetmg.ocva.model.Ensaio;
import br.cefetmg.ocva.repository.EnsaioRepository;

@RestController
@RequestMapping("/api/v1/ensaios")
@CrossOrigin(origins = "http://localhost:8100")
public class EnsaioController {

    private final EnsaioRepository repository;

    public EnsaioController(EnsaioRepository repository) {
        this.repository = repository;
    }

    @GetMapping("")
    public List<Ensaio> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Ensaio getById(@PathVariable Long id) {
        return repository.findById(id).orElse(null);
    }

    @PostMapping("")
    public Ensaio inserir(@RequestBody Ensaio ensaio) {
        ensaio.setId(null);
        return repository.save(ensaio);
    }

    @PutMapping("")
    public Ensaio alterar(@RequestBody Ensaio ensaio) {
        if (ensaio.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id é obrigatório");
        }

        return repository.save(ensaio);
    }

    @DeleteMapping("/{id}")
    public Ensaio excluir(@PathVariable long id) {
        Ensaio ensaio = repository.findById(id).orElse(null);
        if (ensaio == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Ensaio com id: " + id + " não encontrado");
        }

        repository.deleteById(id);
        return ensaio;
    }
}