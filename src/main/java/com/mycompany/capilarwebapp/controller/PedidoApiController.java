
package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.DetallePedido;
import com.mycompany.capilarwebapp.modelo.Pedido;
import com.mycompany.capilarwebapp.service.PedidoService;

import jakarta.servlet.http.HttpSession;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/pedidos")
@CrossOrigin(
    origins = "http://localhost:5173",
    allowCredentials = "true"
)
public class PedidoApiController {

    private final PedidoService pedidoService;

    public PedidoApiController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> registrarCompra(
            @RequestBody Map<String, Object> solicitud,
            HttpSession session) {

        Map<String, Object> respuesta = new LinkedHashMap<>();

        try {
            String nombre = obtenerTexto(solicitud, "nombre");
            String email = obtenerTexto(solicitud, "email");
            String telefono = obtenerTexto(solicitud, "telefono");
            String direccion = obtenerTexto(solicitud, "direccion");
            String metodoPago = obtenerTexto(solicitud, "metodoPago");

            Object totalObjeto = solicitud.get("total");

            if (!(totalObjeto instanceof Number)) {
                throw new IllegalArgumentException(
                    "El total de la compra no es válido."
                );
            }

            float total = ((Number) totalObjeto).floatValue();

            if (!Float.isFinite(total) || total <= 0) {
                throw new IllegalArgumentException(
                    "El total de la compra debe ser mayor que cero."
                );
            }

            Object productosObjeto = solicitud.get("productos");

            if (!(productosObjeto instanceof List<?> productos)
                    || productos.isEmpty()) {
                throw new IllegalArgumentException(
                    "El carrito no contiene productos."
                );
            }

            List<DetallePedido> detalles = new ArrayList<>();

            for (Object elemento : productos) {

                if (!(elemento instanceof Map<?, ?> producto)) {
                    throw new IllegalArgumentException(
                        "Los datos de un producto no son válidos."
                    );
                }

                Object idObjeto = producto.get("idProducto");
                Object cantidadObjeto = producto.get("cantidad");

                if (!(idObjeto instanceof Number)
                        || !(cantidadObjeto instanceof Number)) {
                    throw new IllegalArgumentException(
                        "Falta el identificador o la cantidad de un producto."
                    );
                }

                int idProducto = ((Number) idObjeto).intValue();
                int cantidad = ((Number) cantidadObjeto).intValue();

                if (idProducto <= 0 || cantidad <= 0
                        || ((Number) idObjeto).doubleValue() != idProducto
                        || ((Number) cantidadObjeto).doubleValue() != cantidad) {
                    throw new IllegalArgumentException(
                        "Hay identificadores o cantidades inválidas."
                    );
                }

                DetallePedido detalle = new DetallePedido();
                detalle.setIdProducto(idProducto);
                detalle.setCantidadProducto(cantidad);

                detalles.add(detalle);
            }

            Pedido pedido = pedidoService.registrarCompra(
                nombre,
                email,
                telefono,
                direccion,
                metodoPago,
                detalles,
                total
            );

            // Vaciar el carrito solo después de registrar correctamente.
            session.removeAttribute("carrito");

            respuesta.put("mensaje", "Compra registrada correctamente.");
            respuesta.put("idPedido", pedido.getIdPedido());
            respuesta.put("total", total);

            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(respuesta);

        } catch (IllegalArgumentException e) {

            respuesta.put("error", e.getMessage());

            return ResponseEntity.badRequest().body(respuesta);

        } catch (Exception e) {

            respuesta.put(
                "error",
                "No fue posible registrar la compra. Verifica los datos e inténtalo nuevamente."
            );

            return ResponseEntity.status(
                HttpStatus.INTERNAL_SERVER_ERROR
            ).body(respuesta);
        }
    }

    private String obtenerTexto(
            Map<String, Object> datos,
            String campo) {

        Object valor = datos.get(campo);

        if (!(valor instanceof String texto) || texto.isBlank()) {
            throw new IllegalArgumentException(
                "El campo " + campo + " es obligatorio."
            );
        }

        return texto.trim();
    }
}
