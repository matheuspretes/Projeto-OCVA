package br.cefetmg.ocva.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/verificar/{codigo}")
    public Map<String, Object> verificar(@PathVariable String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return Map.of("disponivel", false, "mensagem", "Código não informado.");
        }

        String codigoFormatado = codigo.trim().toUpperCase(Locale.ROOT);
        Optional<CodigoAcesso> optCodigo = repository.findByCodigo(codigoFormatado);

        if (optCodigo.isEmpty()) {
            return Map.of("disponivel", false, "mensagem", "Código não encontrado.");
        }

        CodigoAcesso entity = optCodigo.get();

        // 1. Checa se já foi utilizado
        if (entity.FoiUtilizado()) {
            return Map.of("disponivel", false, "mensagem", "Este código já foi utilizado.");
        }

        // 2. Checa se expirou (caso a entidade tenha dataExpiracao)
        if (entity.getDataExpiracao() != null && entity.getDataExpiracao().isBefore(LocalDateTime.now())) {
            return Map.of("disponivel", false, "mensagem", "Este código está expirado.");
        }

        return Map.of("disponivel", true, "mensagem", "Código válido e disponível!");
    }

    @PostMapping("/validar")
public ResponseEntity<?> validarEUsarCodigo(@RequestBody Map<String, Object> payload) {
    String codigo = (String) payload.get("codigo");

    if (codigo == null || codigo.isBlank()) {
        return ResponseEntity.badRequest().body("O código de acesso é obrigatório.");
    }

    String codigoFormatado = codigo.trim().toUpperCase(Locale.ROOT);
    Optional<CodigoAcesso> optCodigo = repository.findByCodigo(codigoFormatado);

    if (optCodigo.isEmpty()) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Código não encontrado.");
    }

    CodigoAcesso item = optCodigo.get();

    // 1. Validações de regra de negócio
    if (item.FoiUtilizado()) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Este código já foi utilizado.");
    }

    if (item.getDataExpiracao() != null && item.getDataExpiracao().isBefore(LocalDateTime.now())) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Este código expirou.");
    }

    // 2. Extrai os dados do usuário do payload (se enviados)
    if (payload.get("usuarioId") != null) {
        Long usuarioId = Long.valueOf(payload.get("usuarioId").toString());
        item.setUsuarioId(usuarioId);
    }

    if (payload.get("usuarioNome") != null) {
        item.setUsuarioNome((String) payload.get("usuarioNome"));
    }

    // 3. Atualiza os dados de uso e salva
    item.setStatus("utilizado");
    item.setDataUso(LocalDateTime.now());

    CodigoAcesso salvo = repository.save(item);

    // 4. Retorna o objeto salvo correspondente à tipagem Observable<CodigoAcesso> do Angular
    return ResponseEntity.ok(salvo);
}

    public static class CadastrarCodigoRequest {
        public String codigo;
    }
}