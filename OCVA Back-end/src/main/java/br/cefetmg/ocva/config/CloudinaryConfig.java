package br.cefetmg.ocva.config;

import com.cloudinary.Cloudinary;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        String cloudinaryUrl = System.getenv("CLOUDINARY_URL");
        if (cloudinaryUrl != null && !cloudinaryUrl.isBlank()) {
            return new Cloudinary(cloudinaryUrl);
        }

        return new Cloudinary(Map.of(
            "cloud_name", requiredEnvironment("CLOUDINARY_CLOUD_NAME"),
            "api_key", requiredEnvironment("CLOUDINARY_API_KEY"),
            "api_secret", requiredEnvironment("CLOUDINARY_API_SECRET"),
            "secure", true
        ));
    }

    private String requiredEnvironment(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException("Variável de ambiente obrigatória não configurada: " + name);
        }
        return value;
    }
}
