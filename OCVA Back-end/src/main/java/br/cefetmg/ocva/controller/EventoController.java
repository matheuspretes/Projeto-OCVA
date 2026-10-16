package br.cefetmg.ocva.controller;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
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
import br.cefetmg.ocva.repository.MusicoRepository;

@RestController
@RequestMapping("/api/v1/eventos")
@CrossOrigin(origins = "*")
public class EventoController {

    private final EventoRepository repository;
    private final MusicoRepository musicoRepository;

    public EventoController(EventoRepository repository, MusicoRepository musicoRepository) {
        this.repository = repository;
        this.musicoRepository = musicoRepository;
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
        return repository.save(evento);
    }

    @PutMapping("")
    @Transactional
    public Evento alterar(@RequestBody Evento evento) {
        if (evento.getId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "id é obrigatório");
        }

        Evento eventoExistente = repository.findById(evento.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Evento com id: " + evento.getId() + " não encontrado"));

        eventoExistente.setData(evento.getData());
        eventoExistente.setDescricao(evento.getDescricao());
        eventoExistente.setTitulo(evento.getTitulo());
        eventoExistente.setLocal(evento.getLocal());
        eventoExistente.setBanner(evento.getBanner());

        List<Musico> musicos = evento.getMusicos() == null
                ? new ArrayList<>()
                : evento.getMusicos().stream()
                        .map(musico -> {
                            if (musico == null || musico.getId() == null) {
                                throw new ResponseStatusException(
                                        HttpStatus.BAD_REQUEST, "Todo músico deve possuir id");
                            }
                            return musicoRepository.findById(musico.getId())
                                    .orElseThrow(() -> new ResponseStatusException(
                                            HttpStatus.NOT_FOUND,
                                            "Músico com id: " + musico.getId() + " não encontrado"));
                        })
                        .collect(Collectors.toList());
        eventoExistente.setMusicos(musicos);

        return eventoExistente;
    }

    @DeleteMapping("/{id}")
    @Transactional
    public Evento excluir(@PathVariable long id) {
        Evento evento = repository.findById(id).orElse(null);
        if (evento == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Evento com id: " + id + " não encontrado");
        }

        evento.setMusicos(new ArrayList<>());
        repository.saveAndFlush(evento);
        repository.delete(evento);
        return evento;
    }
}