
package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Cliente;
import com.mycompany.capilarwebapp.service.ClienteService;

import jakarta.servlet.http.HttpSession;
import jakarta.servlet.http.HttpServletRequest;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(
    origins = "http://localhost:5173",
    allowCredentials = "true"
)
public class AuthApiController {

    private final ClienteService clienteService;

    public AuthApiController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    // REGISTRO DE USUARIOS
    @PostMapping("/registro")
    public Map<String, Object> registrar(
            @RequestBody SolicitudRegistro solicitud) {

        if (solicitud == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "No se recibieron los datos del registro."
            );
        }

        try {
            Cliente cliente = new Cliente();

            cliente.setNombre(solicitud.nombre());
            cliente.setEmail(solicitud.email());
            cliente.setPassword(solicitud.password());
            cliente.setTelefono(solicitud.telefono());
            cliente.setDireccion(solicitud.direccion());

            // El rol se asigna en ClienteService.
            // Nunca se acepta el rol enviado por el frontend.
            Cliente registrado =
                    clienteService.registrarCliente(cliente);

            Map<String, Object> respuesta =
                    new LinkedHashMap<>();

            respuesta.put("mensaje", "Cuenta creada correctamente.");
            respuesta.put("idCliente", registrado.getIdCliente());
            respuesta.put("nombre", registrado.getNombre());
            respuesta.put("email", registrado.getEmail());

            return respuesta;

        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                e.getMessage()
            );
        }
    }

    // INICIO DE SESIÓN
    @PostMapping("/login")
    public Map<String, Object> iniciarSesion(
        @RequestBody SolicitudLogin solicitud,
        HttpServletRequest request,
        HttpSession session) {

        if (solicitud == null
                || solicitud.email() == null
                || solicitud.password() == null) {

            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Debes ingresar correo y contraseña."
            );
        }

        Optional<Cliente> resultado =
                clienteService.iniciarSesion(
                    solicitud.email(),
                    solicitud.password()
                );

        if (resultado.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Correo o contraseña incorrectos, o cuenta inactiva."
            );
        }

        Cliente cliente = resultado.get();

        // Renovar el identificador de sesión por seguridad.
        request.changeSessionId();

        session = request.getSession();

        session.setAttribute("usuarioId", cliente.getIdCliente());
        session.setAttribute("usuarioNombre", cliente.getNombre());
        session.setAttribute("usuarioEmail", cliente.getEmail());
        session.setAttribute("usuarioRol", cliente.getRol());

        return construirRespuestaUsuario(cliente);
    }

    // CONSULTAR SESIÓN ACTUAL
    @GetMapping("/sesion")
    public Map<String, Object> consultarSesion(
            HttpSession session) {

        Object id = session.getAttribute("usuarioId");

        if (id == null) {
            throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "No hay una sesión iniciada."
            );
        }

        Map<String, Object> respuesta =
                new LinkedHashMap<>();

        respuesta.put("autenticado", true);
        respuesta.put("idCliente", id);
        respuesta.put(
            "nombre",
            session.getAttribute("usuarioNombre")
        );
        respuesta.put(
            "email",
            session.getAttribute("usuarioEmail")
        );
        respuesta.put(
            "rol",
            session.getAttribute("usuarioRol")
        );

        return respuesta;
    }

    // CERRAR SESIÓN
    @PostMapping("/logout")
    public Map<String, Object> cerrarSesion(
            HttpSession session) {

        session.invalidate();

        Map<String, Object> respuesta =
                new LinkedHashMap<>();

        respuesta.put("mensaje", "Sesión cerrada correctamente.");

        return respuesta;
    }

    // RESPUESTA SEGURA PARA EL FRONTEND
    private Map<String, Object> construirRespuestaUsuario(
            Cliente cliente) {

        Map<String, Object> respuesta =
                new LinkedHashMap<>();

        respuesta.put("autenticado", true);
        respuesta.put("idCliente", cliente.getIdCliente());
        respuesta.put("nombre", cliente.getNombre());
        respuesta.put("email", cliente.getEmail());
        respuesta.put("rol", cliente.getRol());

        return respuesta;
    }


    public record SolicitudRegistro(
        String nombre,
        String email,
        String password,
        String telefono,
        String direccion
    ) {}

    public record SolicitudLogin(
        String email,
        String password
    ) {}
}
