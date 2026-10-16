package br.cefetmg.ocva.controller;

import br.cefetmg.ocva.model.Partitura;
import br.cefetmg.ocva.repository.PartituraRepository;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/partituras")
@CrossOrigin(origins = "*")
public class PartituraController {
    private final Cloudinary cloudinary;
    private final PartituraRepository repository;

    public PartituraController(Cloudinary cloudinary, PartituraRepository repository) {
        this.cloudinary = cloudinary;
        this.repository = repository;
    }

    @GetMapping
    public List<Partitura> listar() {
        return repository.findAll();
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadPartitura(
        @RequestParam("partitura") MultipartFile file,
        @RequestParam("nome") String nome,
        @RequestParam(required = false, defaultValue = "") String compositor,
        @RequestParam(required = false, defaultValue = "") String instrumento,
        @RequestParam(required = false, defaultValue = "") String categoria,
        @RequestParam(required = false, defaultValue = "") String evento
    ) {
        if (file.isEmpty() || ! "application/pdf".equalsIgnoreCase(file.getContentType())) {
            return ResponseEntity.badRequest().body("Envie um arquivo PDF válido.");
        }
        if (nome == null || nome.isBlank()) {
            return ResponseEntity.badRequest().body("Informe o nome da partitura.");
        }

        try {
            Map<?, ?> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                ObjectUtils.asMap(
                    "folder", "orquestra/partituras",
                    "resource_type", "raw",
                    "use_filename", true,
                    "unique_filename", true
                )
            );

            Partitura partitura = new Partitura(
                null, nome.trim(), (String) uploadResult.get("secure_url"),
                (String) uploadResult.get("public_id"), compositor.trim(),
                instrumento.trim(), categoria.trim(), evento.trim(),
                file.getOriginalFilename(), java.time.LocalDate.now().toString()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(repository.save(partitura));
        } catch (IOException exception) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Erro ao enviar partitura para o Cloudinary.");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) throws Exception {
        Partitura partitura = repository.findById(id).orElse(null);
        if (partitura == null) {
            return ResponseEntity.notFound().build();
        }
        cloudinary.uploader().destroy(partitura.getPublicId(), ObjectUtils.asMap("resource_type", "raw"));
        repository.delete(partitura);
        return ResponseEntity.noContent().build();
    }
}
