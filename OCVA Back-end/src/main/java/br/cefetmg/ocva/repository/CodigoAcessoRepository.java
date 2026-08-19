package br.cefetmg.ocva.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import br.cefetmg.ocva.model.CodigoAcesso;

public interface CodigoAcessoRepository extends JpaRepository<CodigoAcesso, Long> {
    Optional<CodigoAcesso> findByCodigo(String codigo);
    boolean existsByCodigo(String codigo);
    List<CodigoAcesso> findByStatusOrderByDataCriacaoDesc(String status);
}
