package aleosh.online.apigateway.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

/**
 * Filtro global de autenticación. Corre antes del rate limiter para que el
 * {@code userId} quede disponible como clave. Responsabilidades:
 * <ul>
 *   <li>Saneo: elimina cualquier header de identidad ({@code X-User-*}) que
 *       venga del cliente, evitando suplantación al saltarse la validación.</li>
 *   <li>Rutas públicas: pasan sin token.</li>
 *   <li>Rutas protegidas: exigen {@code Authorization: Bearer}; token inválido
 *       o ausente → 401. Válido → inyecta {@code X-User-Id}/{@code X-User-Role}
 *       downstream y guarda la identidad para el KeyResolver.</li>
 *   <li>Rutas WebSocket: el token puede venir en {@code Authorization} o en
 *       {@code Sec-WebSocket-Protocol}; si no se puede validar el formato, se
 *       delega la validación al backend (vivia-chat ya valida JWT).</li>
 * </ul>
 */
@Component
public class JwtAuthenticationGlobalFilter implements GlobalFilter, Ordered {

    /** Atributo del exchange donde se guarda la identidad para el KeyResolver. */
    public static final String AUTHENTICATED_USER_ATTR = "gateway.authenticatedUser";

    private static final String HEADER_USER_ID = "X-User-Id";
    private static final String HEADER_USER_ROLE = "X-User-Role";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String SEC_WEBSOCKET_PROTOCOL = "Sec-WebSocket-Protocol";

    private static final Logger logger = LoggerFactory.getLogger(JwtAuthenticationGlobalFilter.class);

    private final JwtValidator jwtValidator;
    private final GatewayAuthProperties properties;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    public JwtAuthenticationGlobalFilter(JwtValidator jwtValidator, GatewayAuthProperties properties) {
        this.jwtValidator = jwtValidator;
        this.properties = properties;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        // Saneo: nunca dejar pasar identidad puesta por el cliente.
        ServerHttpRequest sanitized = request.mutate()
                .headers(headers -> {
                    headers.remove(HEADER_USER_ID);
                    headers.remove(HEADER_USER_ROLE);
                })
                .build();
        ServerWebExchange sanitizedExchange = exchange.mutate().request(sanitized).build();

        Optional<String> token = extractToken(sanitized);
        Optional<AuthenticatedUser> user = token.flatMap(jwtValidator::validate);

        if (user.isPresent()) {
            return chain.filter(withIdentity(sanitizedExchange, sanitized, user.get()));
        }

        // Ruta pública: pasa sin token. Si trajo uno válido ya se inyectó arriba;
        // si trajo uno inválido, no se bloquea (la ruta es abierta).
        if (isPublic(path)) {
            return chain.filter(sanitizedExchange);
        }

        // WebSocket: si no se pudo validar aquí, delegar al backend (que revalida).
        if (isWebsocket(path)) {
            return chain.filter(sanitizedExchange);
        }

        return unauthorized(sanitizedExchange);
    }

    private ServerWebExchange withIdentity(ServerWebExchange exchange, ServerHttpRequest sanitized,
                                           AuthenticatedUser user) {
        ServerHttpRequest downstream = sanitized.mutate()
                .headers(headers -> {
                    if (user.userId() != null) {
                        headers.set(HEADER_USER_ID, user.userId());
                    }
                    if (user.role() != null) {
                        headers.set(HEADER_USER_ROLE, user.role());
                    }
                })
                .build();
        exchange.getAttributes().put(AUTHENTICATED_USER_ATTR, user);
        return exchange.mutate().request(downstream).build();
    }

    /**
     * Extrae el token de {@code Authorization: Bearer} o, para el handshake
     * WebSocket, del primer valor de {@code Sec-WebSocket-Protocol}.
     */
    private Optional<String> extractToken(ServerHttpRequest request) {
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader != null && authHeader.startsWith(BEARER_PREFIX)) {
            return Optional.of(authHeader.substring(BEARER_PREFIX.length()).trim());
        }

        List<String> subprotocols = request.getHeaders().get(SEC_WEBSOCKET_PROTOCOL);
        if (subprotocols != null && !subprotocols.isEmpty()) {
            // Puede venir como "bearer, <token>" o directamente el token.
            String raw = subprotocols.get(subprotocols.size() - 1).trim();
            return raw.isEmpty() ? Optional.empty() : Optional.of(raw);
        }

        return Optional.empty();
    }

    private boolean isPublic(String path) {
        return properties.getPublicPaths().stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private boolean isWebsocket(String path) {
        return properties.getWebsocketPaths().stream().anyMatch(pattern -> pathMatcher.match(pattern, path));
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange) {
        logger.debug("401 en {} — token ausente o inválido", exchange.getRequest().getPath().value());
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        return exchange.getResponse().setComplete();
    }

    @Override
    public int getOrder() {
        // Alta precedencia: correr antes del RequestRateLimiter para poblar la
        // identidad que usa el KeyResolver.
        return Ordered.HIGHEST_PRECEDENCE + 100;
    }
}
