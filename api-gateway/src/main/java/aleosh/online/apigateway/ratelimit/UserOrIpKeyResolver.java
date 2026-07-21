package aleosh.online.apigateway.ratelimit;

import aleosh.online.apigateway.security.AuthenticatedUser;
import aleosh.online.apigateway.security.JwtAuthenticationGlobalFilter;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.net.InetSocketAddress;

/**
 * Clave del rate limiter: si el request está autenticado usa el {@code userId}
 * (poblado por {@link JwtAuthenticationGlobalFilter}); si es anónimo usa la IP
 * del cliente. Prioriza {@code X-Forwarded-For}/{@code X-Real-IP} que inyecta
 * nginx, con fallback a la dirección remota del socket.
 */
@Component("userOrIpKeyResolver")
public class UserOrIpKeyResolver implements KeyResolver {

    @Override
    public Mono<String> resolve(ServerWebExchange exchange) {
        Object attr = exchange.getAttribute(JwtAuthenticationGlobalFilter.AUTHENTICATED_USER_ATTR);
        if (attr instanceof AuthenticatedUser user && user.userId() != null) {
            return Mono.just("user:" + user.userId());
        }
        return Mono.just("ip:" + clientIp(exchange));
    }

    private String clientIp(ServerWebExchange exchange) {
        HttpHeaders headers = exchange.getRequest().getHeaders();

        String forwardedFor = headers.getFirst("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            // El primer valor es el cliente original; el resto son proxies.
            return forwardedFor.split(",")[0].trim();
        }

        String realIp = headers.getFirst("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }

        InetSocketAddress remote = exchange.getRequest().getRemoteAddress();
        return remote != null ? remote.getAddress().getHostAddress() : "unknown";
    }
}
