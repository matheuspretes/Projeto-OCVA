package br.cefetmg.ocva.repository;

import br.cefetmg.ocva.model.Partitura;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PartituraRepository extends JpaRepository<Partitura, Long> {
}
