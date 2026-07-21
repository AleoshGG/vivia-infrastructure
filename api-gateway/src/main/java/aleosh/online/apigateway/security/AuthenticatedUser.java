package aleosh.online.apigateway.security;

/**
 * Datos de identidad extraídos de un JWT válido. El gateway los reenvía como
 * headers downstream ({@code X-User-Id}, {@code X-User-Role}) a los backends.
 */
public record AuthenticatedUser(String subject, String userId, String role) {
}
