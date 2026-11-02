
package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.DetallePedido;
import com.mycompany.capilarwebapp.modelo.Pedido;
import com.mycompany.capilarwebapp.modelo.Producto;
import com.mycompany.capilarwebapp.service.PedidoService;
import com.mycompany.capilarwebapp.service.ProductoService;

import jakarta.servlet.http.HttpSession;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/checkout")
@CrossOrigin(
    origins = "http://localhost:5173",
    allowCredentials = "true"
)
public class CheckoutApiController {

    private final ProductoService productoService;
    private final PedidoService pedidoService;

    public CheckoutApiController(
            ProductoService productoService,
            PedidoService pedidoService) {
        this.productoService = productoService;
        this.pedidoService = pedidoService;
    }

    @PostMapping("/confirmar")
    public Map<String, Object> confirmarCompra(
            @RequestBody SolicitudCompra solicitud,
            HttpSession session) {

        if (solicitud == null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "No se recibieron los datos de la compra."
            );
        }

        validarTexto(solicitud.nombre(), "El nombre es obligatorio.");
        validarTexto(solicitud.email(), "El correo electrónico es obligatorio.");
        validarTexto(solicitud.telefono(), "El teléfono es obligatorio.");
        validarTexto(solicitud.direccion(), "La dirección es obligatoria.");
        validarTexto(solicitud.metodoPago(), "Selecciona un método de pago.");

        if (!solicitud.telefono().trim().matches("\\d{10}")) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "El teléfono debe contener exactamente 10 dígitos."
            );
        }

        Object objetoCarrito = session.getAttribute("carrito");
        Map<Integer, Integer> cantidades =
                normalizarCarrito(objetoCarrito);

        if (cantidades.isEmpty()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "Tu carrito está vacío."
            );
        }

        List<DetallePedido> detalles = new ArrayList<>();
        float totalCalculado = 0;

        for (Map.Entry<Integer, Integer> entrada
                : cantidades.entrySet()) {

            Integer idProducto = entrada.getKey();
            Integer cantidad = entrada.getValue();

            if (idProducto == null || cantidad == null || cantidad <= 0) {
                throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "El carrito contiene cantidades inválidas."
                );
            }

            Producto producto = productoService.buscarPorId(idProducto)
                .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Uno de los productos ya no está disponible."
                ));

            DetallePedido detalle = new DetallePedido();
            detalle.setIdProducto(idProducto);
            detalle.setCantidadProducto(cantidad);
            detalle.setPrecioProducto(producto.getPrecio());

            detalles.add(detalle);

            totalCalculado += producto.getPrecio() * cantidad;
        }

        try {
            Pedido pedido = pedidoService.registrarCompra(
                solicitud.nombre().trim(),
                solicitud.email().trim(),
                solicitud.telefono().trim(),
                solicitud.direccion().trim(),
                solicitud.metodoPago(),
                detalles,
                totalCalculado
            );

            session.removeAttribute("carrito");

            Map<String, Object> respuesta = new LinkedHashMap<>();
            respuesta.put("idPedido", pedido.getIdPedido());
            respuesta.put("total", totalCalculado);
            respuesta.put(
                "mensaje",
                "La compra se registró correctamente."
            );

            return respuesta;

        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                e.getMessage(),
                e
            );

        } catch (Exception e) {
            throw new ResponseStatusException(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "No fue posible registrar la compra.",
                e
            );
        }
    }

    private static void validarTexto(String valor, String mensaje) {
        if (valor == null || valor.isBlank()) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                mensaje
            );
        }
    }

    private static Map<Integer, Integer> normalizarCarrito(Object carrito) {
        Map<Integer, Integer> cantidades = new LinkedHashMap<>();

        if (carrito instanceof Map<?, ?> mapa) {
            for (Map.Entry<?, ?> entrada : mapa.entrySet()) {
                if (entrada.getKey() instanceof Integer id
                        && entrada.getValue() instanceof Integer cantidad
                        && cantidad > 0) {
                    cantidades.put(id, cantidad);
                }
            }

        } else if (carrito instanceof List<?> lista) {
            for (Object elemento : lista) {
                if (elemento instanceof Integer id) {
                    cantidades.put(
                        id,
                        cantidades.getOrDefault(id, 0) + 1
                    );
                }
            }
        }

        return cantidades;
    }

    public record SolicitudCompra(
        String nombre,
        String email,
        String telefono,
        String direccion,
        String metodoPago
    ) {}
}
