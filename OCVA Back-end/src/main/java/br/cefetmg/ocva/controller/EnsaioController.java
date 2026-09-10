package br.cefetmg.ocva.controller;

import java.util.List;
import java.util.ArrayList;

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
import br.cefetmg.ocva.model.Musico;
import br.cefetmg.ocva.repository.EnsaioRepository;
import br.cefetmg.ocva.repository.MusicoRepository;

@RestController
@RequestMapping("/api/v1/ensaios")
@CrossOrigin(origins = "*")
public class EnsaioController {

    private final EnsaioRepository repository;
    private final MusicoRepository musicoRepository;

    public EnsaioController(EnsaioRepository repository, MusicoRepository musicoRepository) {
        this.repository = repository;
        this.musicoRepository = musicoRepository;
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

    @PutMapping("/{ensaioId}/presenca/{musicoId}")
    public Ensaio marcarPresenca(
            @PathVariable Long ensaioId,
            @PathVariable Long musicoId,
            @org.springframework.web.bind.annotation.RequestParam boolean presente) {
        Ensaio ensaio = repository.findById(ensaioId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ensaio não encontrado"));
        Musico musico = musicoRepository.findById(musicoId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Músico não encontrado"));

        boolean jaPresente = ensaio.getPresencas() != null && ensaio.getPresencas().stream()
                .anyMatch(item -> item.getId().equals(musicoId));
        boolean jaAusente = ensaio.getFaltas() != null && ensaio.getFaltas().stream()
                .anyMatch(item -> item.getId().equals(musicoId));
        if (jaPresente || jaAusente) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A presença deste músico já foi marcada");
        }

        if (ensaio.getPresencas() == null) {
            ensaio.setPresencas(new ArrayList<>());
        }
        if (ensaio.getFaltas() == null) {
            ensaio.setFaltas(new ArrayList<>());
        }
        (presente ? ensaio.getPresencas() : ensaio.getFaltas()).add(musico);
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