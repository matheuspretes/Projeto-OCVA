package br.cefetmg.ocva.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import br.cefetmg.ocva.model.CodigoAcesso;
import br.cefetmg.ocva.repository.CodigoAcessoRepository;

@RestController
@RequestMapping("/api/v1/codigos-acesso")
@CrossOrigin(origins = "*")
public class CodigoAcessoController {

    private final CodigoAcessoRepository repository;

    public CodigoAcessoController(CodigoAcessoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<CodigoAcesso> listar() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "dataCriacao"));
    }

    // Endpoint para CADASTRAR um código digitado manualmente
    @PostMapping("/cadastrar")
    public CodigoAcesso cadastrarCodigo(@RequestBody CadastrarCodigoRequest request) {
        if (request == null || request.codigo == null || request.codigo.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "O código não pode ser vazio.");
        }

        String codigoFormatado = request.codigo.trim().toUpperCase(Locale.ROOT);

        if (repository.existsByCodigo(codigoFormatado)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Este código já existe cadastrado.");
        }

        CodigoAcesso novo = new CodigoAcesso();
        novo.setCodigo(codigoFormatado);
        novo.setStatus("disponivel");
        novo.setDataCriacao(LocalDateTime.now());
        novo.setDataExpiracao(LocalDateTime.now().plusDays(30));

        return repository.save(novo);
    }

    @DeleteMapping("/{codigo}")
    public void deletar(@PathVariable String codigo) {
        CodigoAcesso existente = repository.findByCodigo(codigo.trim().toUpperCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Código não encontrado."));
        repository.delete(existente);
    }

    public static class CadastrarCodigoRequest {
        public String codigo;
    }
}