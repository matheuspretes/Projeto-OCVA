package br.cefetmg.ocva.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "partitura")
public class Partitura {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String nome;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(nullable = false, length = 255)
    private String publicId;

    @Column(length = 120)
    private String compositor;

    @Column(length = 80)
    private String instrumento;

    @Column(length = 80)
    private String categoria;

    @Column(length = 160)
    private String evento;

    @Column(length = 255)
    private String nomeArquivo;

    @Column(length = 20)
    private String dataPublicacao;
}
