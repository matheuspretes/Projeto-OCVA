package br.cefetmg.ocva.controller;

import java.util.ArrayList;
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

import br.cefetmg.ocva.model.Evento;
import br.cefetmg.ocva.model.Musico;
import br.cefetmg.ocva.repository.EventoRepository;
import br.cefetmg.ocva.repository.EnsaioRepository;

@RestController
@RequestMapping("/api/v1/eventos")
@CrossOrigin(origins = "http://localhost:8100")
public class EventoController {

    private final EventoRepository repository;
    private final EnsaioRepository ensaioRepository;

    public EventoController(EventoRepository repository, EnsaioRepository ensaioRepository) {
        this.repository = repository;
        this.ensaioRepository = ensaioRepository;
    }

    @GetMapping("")
    public List<Evento> getAll() {
        return repository.findAll();
    }

    @GetMapping("/{id}")
    public Evento getById(@PathVariable Long id) {
        return repository.findById(id).orElse(null);
    }

    @PostMapping("")
    public Evento inserir(@RequestBody Evento evento) {
        evento.setId(null);
        validarMusicosPorPresenca(evento);
        return repository.save(evento);
    }

    @PutMapping("")
    public Evento alterar(@RequestBody Evento evento) {
        if (evento.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id é obrigatório");
        }

        validarMusicosPorPresenca(evento);
        return repository.save(evento);
    }

    private void validarMusicosPorPresenca(Evento evento) {
        if (evento.getMusicos() == null || evento.getMusicos().isEmpty()) {
            return;
        }

        List<String> musicosInvalidos = new ArrayList<>();

        for (Musico musico : evento.getMusicos()) {
            if (musico == null || musico.getId() == null) {
                musicosInvalidos.add("músico inválido");
                continue;
            }

            long presencas = ensaioRepository.contarPresencasDoMusico(musico.getId());
            if (presencas < 2) {
                String nome = musico.getNome() != null ? musico.getNome() : ("ID " + musico.getId());
                musicosInvalidos.add(nome);
            }
        }

        if (!musicosInvalidos.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Só é possível adicionar músicos com pelo menos 2 presenças em ensaios: " + String.join(", ", musicosInvalidos)
            );
        }
    }

    @DeleteMapping("/{id}")
    public Evento excluir(@PathVariable long id) {
        Evento evento = repository.findById(id).orElse(null);
        if (evento == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento com id: " + id + " não encontrado");
        }

        repository.deleteById(id);
        return evento;
    }
}