package aleosh.online.apigateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Optional;

/**
 * Valida firma HS256 y expiración de los JWT emitidos por vivia y extrae los
 * claims de identidad. Solo lectura: el gateway no emite tokens. Usa el mismo
 * {@code jwt.secret} y el mismo algoritmo (HMAC-SHA) que
 * {@code JwtProvider} de vivia para que la validación sea consistente.
 */
@Component
public class JwtValidator {

    private static final Logger logger = LoggerFactory.getLogger(JwtValidator.class);

    private final Key secretKey;

    public JwtValidator(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Valida el token y devuelve la identidad si es válido; {@link Optional#empty()}
     * si la firma es inválida, está expirado o malformado.
     */
    public Optional<AuthenticatedUser> validate(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            return Optional.of(new AuthenticatedUser(
                    claims.getSubject(),
                    claims.get("userId", String.class),
                    claims.get("role", String.class)
            ));
        } catch (MalformedJwtException | UnsupportedJwtException | ExpiredJwtException
                 | IllegalArgumentException | SignatureException e) {
            logger.debug("JWT inválido: {}", e.getMessage());
            return Optional.empty();
        }
    }
}
