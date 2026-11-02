
package com.mycompany.capilarwebapp.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AutorizacionInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
        ) throws IOException {

            // Permitir las solicitudes preliminares de CORS.
            // La petición real seguirá validando la sesión y el rol.
            if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
                return true;
            }

            HttpSession session = request.getSession(false);

        // Verificar si existe una sesión iniciada
        if (session == null || session.getAttribute("usuarioId") == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                "{\"mensaje\":\"Debes iniciar sesión para acceder.\"}"
            );
            return false;
        }

        // Obtener el rol del usuario
        Object rolObjeto = session.getAttribute("usuarioRol");

        String rol = rolObjeto == null
                ? ""
                : rolObjeto.toString().trim();

        // Solo los administradores pueden continuar
        if (!"ADMIN".equalsIgnoreCase(rol)
                && !"ADMINISTRADOR".equalsIgnoreCase(rol)) {

            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                "{\"mensaje\":\"No tienes permisos para realizar esta operación.\"}"
            );
            return false;
        }

        return true;
    }
}
