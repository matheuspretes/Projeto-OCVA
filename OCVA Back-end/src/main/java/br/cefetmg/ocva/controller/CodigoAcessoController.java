package br.cefetmg.ocva.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

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
    private final Random random = new Random();

    public CodigoAcessoController(CodigoAcessoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
public List<CodigoAcesso> listar() {
    return repository.findAll();
}

    @PostMapping("/gerar")
    public CodigoAcesso gerar() {
        CodigoAcesso novo = new CodigoAcesso();
        novo.setCodigo(gerarCodigoAleatorio(8));
        novo.setStatus("disponivel");
        novo.setDataCriacao(LocalDateTime.now());
        novo.setDataExpiracao(LocalDateTime.now().plusDays(30));
        return repository.save(novo);
    }

    @DeleteMapping("/{codigo}")
    public void deletar(@PathVariable String codigo) {
        CodigoAcesso item = repository.findByCodigo(codigo.trim().toUpperCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Código não encontrado"));
        repository.delete(item);
    }

    private String gerarCodigoAleatorio(int tamanho) {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < tamanho; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }
}