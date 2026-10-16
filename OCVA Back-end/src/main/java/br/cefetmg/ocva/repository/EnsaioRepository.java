package br.cefetmg.ocva.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import br.cefetmg.ocva.model.Ensaio;

public interface EnsaioRepository extends JpaRepository<Ensaio, Long> {
	@Query("select count(e) from Ensaio e join e.presencas m where m.id = :musicoId")
	long contarPresencasDoMusico(@Param("musicoId") Long musicoId);

	@Query("select count(e) from Ensaio e join e.faltas m where m.id = :musicoId")
	long contarFaltasDoMusico(@Param("musicoId") Long musicoId);
}