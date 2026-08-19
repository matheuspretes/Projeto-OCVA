package br.cefetmg.ocva.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "codigo_acesso")
public class CodigoAcesso {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 8, nullable = false, unique = true)
    private String codigo;

    @Column(length = 20, nullable = false)
    private String status;

    private Long usuarioId;

    @Column(length = 60)
    private String usuarioNome;

    @Column(nullable = false)
    private LocalDateTime dataCriacao;

    private LocalDateTime dataUso;

    private LocalDateTime dataExpiracao;

    @PrePersist
    public void prePersist() {
        if (this.dataCriacao == null) {
            this.dataCriacao = LocalDateTime.now();
        }
        if (this.status == null || this.status.isBlank()) {
            this.status = "disponivel";
        }
        if (this.dataExpiracao == null) {
            this.dataExpiracao = this.dataCriacao.plusDays(30);
        }
    }
}
