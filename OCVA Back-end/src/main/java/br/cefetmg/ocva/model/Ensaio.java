package br.cefetmg.ocva.model;

import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "ensaio")
public class Ensaio {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 20, nullable = false)
    private String data;

    @Column(length = 255, nullable = false)
    private String descricao;

    @Column(length = 120)
    private String titulo;

    @ManyToMany
    @JoinTable(
        name = "ensaio_musico",
        joinColumns = @JoinColumn(name = "ensaio_id"),
        inverseJoinColumns = @JoinColumn(name = "musico_id")
    )
    private List<Musico> musicos;
}