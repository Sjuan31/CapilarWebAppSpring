
package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Cliente;
import com.mycompany.capilarwebapp.service.ClienteService;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/clientes")
public class AdminClienteController {

    private final ClienteService clienteService;

    public AdminClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    // LISTAR CLIENTES SIN EXPONER CONTRASEÑAS
    @GetMapping
    public ResponseEntity<List<ClienteDTO>> listarClientes() {

        List<ClienteDTO> clientes = clienteService.listarClientes()
                .stream()
                .map(this::convertirDTO)
                .toList();

        return ResponseEntity.ok(clientes);
    }

    // BUSCAR CLIENTE POR ID
    @GetMapping("/{id}")
    public ResponseEntity<ClienteDTO> buscarCliente(@PathVariable int id) {

        return clienteService.buscarPorId(id)
                .map(cliente -> ResponseEntity.ok(convertirDTO(cliente)))
                .orElse(ResponseEntity.notFound().build());
    }

    // ACTUALIZAR CLIENTE
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarCliente(
            @PathVariable int id,
            @RequestBody ClienteActualizarDTO datos) {

        if (datos.nombre() == null || datos.nombre().isBlank()
                || datos.email() == null || datos.email().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("El nombre y el correo electrónico son obligatorios.");
        }

        return clienteService.buscarPorId(id)
                .map(cliente -> {

                    String email = datos.email().trim().toLowerCase();

                    var otroCliente = clienteService.buscarPorEmail(email);

                    if (otroCliente.isPresent()
                            && otroCliente.get().getIdCliente() != id) {

                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body("Ya existe otro cliente con ese correo.");
                    }

                    cliente.setNombre(datos.nombre().trim());
                    cliente.setEmail(email);
                    cliente.setTelefono(datos.telefono());
                    cliente.setDireccion(datos.direccion());
                    cliente.setEstado(datos.estado());

                    clienteService.guardarCliente(cliente);

                    return ResponseEntity.ok(convertirDTO(cliente));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // ELIMINAR CLIENTE
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarCliente(@PathVariable int id) {

        if (clienteService.buscarPorId(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        clienteService.eliminarCliente(id);

        return ResponseEntity.noContent().build();
    }

    // CONVERTIR CLIENTE A RESPUESTA SEGURA
    private ClienteDTO convertirDTO(Cliente cliente) {

        return new ClienteDTO(
                cliente.getIdCliente(),
                cliente.getNombre(),
                cliente.getEmail(),
                cliente.getTelefono(),
                cliente.getDireccion(),
                cliente.getRol(),
                cliente.getEstado(),
                cliente.getFechaRegistro()
        );
    }

    // DATOS QUE SE ENVÍAN AL FRONTEND
    public record ClienteDTO(
            int idCliente,
            String nombre,
            String email,
            String telefono,
            String direccion,
            String rol,
            String estado,
            java.sql.Timestamp fechaRegistro
    ) {}

    // DATOS PERMITIDOS PARA ACTUALIZAR
    public record ClienteActualizarDTO(
            String nombre,
            String email,
            String telefono,
            String direccion,
            String estado
    ) {}
}
