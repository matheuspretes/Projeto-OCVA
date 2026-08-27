package br.cefetmg.ocva.config;

<<<<<<< HEAD

=======
>>>>>>> 91d7a4320b0256589d249e0f703531221b8e4709
import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        // Permite requisições de qualquer origem
        configuration.setAllowedOriginPatterns(List.of("*"));

        // Métodos HTTP permitidos
        configuration.setAllowedMethods(
            List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
        );

        // Permite qualquer cabeçalho
        configuration.setAllowedHeaders(List.of("*"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();

        // Aplica a configuração para todos os endpoints
        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
<<<<<<< HEAD
}



>>>>>>> 91d7a4320b0256589d249e0f703531221b8e4709
