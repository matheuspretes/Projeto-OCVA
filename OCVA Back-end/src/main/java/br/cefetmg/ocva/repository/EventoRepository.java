package br.cefetmg.ocva.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import br.cefetmg.ocva.model.Evento;

@Repository
public interface EventoRepository extends JpaRepository<Evento, Long> {
}