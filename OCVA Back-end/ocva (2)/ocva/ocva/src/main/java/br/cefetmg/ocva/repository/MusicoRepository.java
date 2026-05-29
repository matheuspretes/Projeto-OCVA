package br.cefetmg.ocva.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import br.cefetmg.ocva.model.Musico;
import java.util.Optional;

public interface MusicoRepository extends JpaRepository <Musico, Long> {
    Optional<Musico> findByLogin(String login);
    Optional<Musico> findByLoginAndSenha(String login, String senha);
}
