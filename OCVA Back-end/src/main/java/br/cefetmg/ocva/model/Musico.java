package br.cefetmg.ocva.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Entity
@Table(name = "musico")
public class Musico {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length=60, nullable = false, unique=false)
    private String nome;
    private int Idade;

    @Column(length=60, nullable = false, unique=true)
    private String login;

    @Column(length=60, nullable = false)
    private String senha;

    @Column(length=20)
    private String tipo;

    @Column(length=60, nullable = false)
    private String instrumento;
}


