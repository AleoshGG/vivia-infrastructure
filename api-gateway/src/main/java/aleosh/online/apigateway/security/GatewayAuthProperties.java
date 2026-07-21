package aleosh.online.apigateway.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.ArrayList;
import java.util.List;

/**
 * Configuración de autenticación del gateway. Las rutas públicas se saltan la
 * exigencia de token (login, registro, refresh, health).
 */
@ConfigurationProperties(prefix = "gateway.auth")
public class GatewayAuthProperties {

    /** Patrones Ant de rutas que no requieren JWT (ej. /api/auth/login). */
    private List<String> publicPaths = new ArrayList<>();

    /** Patrones Ant de rutas WebSocket cuyo token viaja en el handshake. */
    private List<String> websocketPaths = new ArrayList<>();

    public List<String> getPublicPaths() {
        return publicPaths;
    }

    public void setPublicPaths(List<String> publicPaths) {
        this.publicPaths = publicPaths;
    }

    public List<String> getWebsocketPaths() {
        return websocketPaths;
    }

    public void setWebsocketPaths(List<String> websocketPaths) {
        this.websocketPaths = websocketPaths;
    }
}
