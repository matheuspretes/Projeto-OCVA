package br.cefetmg.ocva.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import br.cefetmg.ocva.model.CodigoAcesso;
import br.cefetmg.ocva.repository.CodigoAcessoRepository;

@RestController
@RequestMapping("/api/v1/codigos-acesso")
@CrossOrigin(origins = "*")
public class CodigoAcessoController {

    private static final String STATUS_DISPONIVEL = "disponivel";
    private static final String STATUS_USADO = "usado";
    private static final String STATUS_EXPIRADO = "expirado";

    private final CodigoAcessoRepository repository;
    private final Random random = new Random();

    public CodigoAcessoController(CodigoAcessoRepository repository) {
        this.repository = repository;
    }

    @GetMapping("")
    public List<CodigoAcesso> listarCodigos() {
        return repository.findAll(Sort.by(Sort.Direction.DESC, "dataCriacao"));
    }

    @PostMapping("/gerar")
    public CodigoAcesso gerarCodigo() {
        CodigoAcesso novo = new CodigoAcesso();
        novo.setCodigo(gerarCodigoUnico(8));
        novo.setStatus(STATUS_DISPONIVEL);
        novo.setDataCriacao(LocalDateTime.now());
        novo.setDataExpiracao(LocalDateTime.now().plusDays(30));
        return repository.save(novo);
    }

    @PostMapping("/validar")
    public CodigoAcesso validarEUsarCodigo(@RequestBody ValidarCodigoRequest request) {
        if (request == null || request.codigo == null || request.codigo.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código é obrigatório");
        }

        String codigoInformado = request.codigo.trim().toUpperCase(Locale.ROOT);
        CodigoAcesso codigo = repository.findByCodigo(codigoInformado)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Código não encontrado"));

        if (STATUS_USADO.equals(codigo.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código já foi utilizado");
        }

        if (codigo.getDataExpiracao() != null && codigo.getDataExpiracao().isBefore(LocalDateTime.now())) {
            codigo.setStatus(STATUS_EXPIRADO);
            repository.save(codigo);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código expirado");
        }

        if (!STATUS_DISPONIVEL.equals(codigo.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Código indisponível");
        }

        codigo.setStatus(STATUS_USADO);
        codigo.setDataUso(LocalDateTime.now());
        if (request.usuarioId != null) {
            codigo.setUsuarioId(request.usuarioId);
        }
        if (request.usuarioNome != null && !request.usuarioNome.isBlank()) {
            codigo.setUsuarioNome(request.usuarioNome.trim());
        }

        return repository.save(codigo);
    }

    @GetMapping("/verificar/{codigo}")
    public Map<String, Object> verificarDisponibilidade(@PathVariable String codigo) {
        String codigoNormalizado = codigo.trim().toUpperCase(Locale.ROOT);
        CodigoAcesso encontrado = repository.findByCodigo(codigoNormalizado).orElse(null);

        if (encontrado == null) {
            return Map.of("disponivel", false, "mensagem", "Código não encontrado");
        }

        if (encontrado.getDataExpiracao() != null && encontrado.getDataExpiracao().isBefore(LocalDateTime.now())) {
            encontrado.setStatus(STATUS_EXPIRADO);
            repository.save(encontrado);
            return Map.of("disponivel", false, "mensagem", "Código expirado");
        }

        boolean disponivel = STATUS_DISPONIVEL.equals(encontrado.getStatus());
        String mensagem = disponivel ? "Código disponível" : "Código indisponível";
        return Map.of("disponivel", disponivel, "mensagem", mensagem);
    }

    @GetMapping("/{codigo}")
    public CodigoAcesso buscarPorCodigo(@PathVariable String codigo) {
        String codigoNormalizado = codigo.trim().toUpperCase(Locale.ROOT);
        return repository.findByCodigo(codigoNormalizado)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Código não encontrado"));
    }

    @GetMapping("/status/{status}")
    public List<CodigoAcesso> listarPorStatus(@PathVariable String status) {
        String statusNormalizado = status.trim().toLowerCase(Locale.ROOT);
        return repository.findByStatusOrderByDataCriacaoDesc(statusNormalizado);
    }

    @DeleteMapping("/{codigo}")
    public void deletarCodigo(@PathVariable String codigo) {
        String codigoNormalizado = codigo.trim().toUpperCase(Locale.ROOT);
        CodigoAcesso existente = repository.findByCodigo(codigoNormalizado)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Código não encontrado"));

        if (!STATUS_DISPONIVEL.equals(existente.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Só é permitido deletar código disponível");
        }

        repository.delete(existente);
    }

    private String gerarCodigoUnico(int tamanho) {
        final String chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        String codigo;

        do {
            StringBuilder builder = new StringBuilder();
            for (int i = 0; i < tamanho; i++) {
                int indice = random.nextInt(chars.length());
                builder.append(chars.charAt(indice));
            }
            codigo = builder.toString();
        } while (repository.existsByCodigo(codigo));

        return codigo;
    }

    private static class ValidarCodigoRequest {
        public String codigo;
        public Long usuarioId;
        public String usuarioNome;
    }
}
