
package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.DetallePedido;
import com.mycompany.capilarwebapp.modelo.Producto;
import com.mycompany.capilarwebapp.modelo.Pedido;
import com.mycompany.capilarwebapp.service.ProductoService;
import com.mycompany.capilarwebapp.service.PedidoService;

import jakarta.servlet.http.HttpSession;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class CheckoutController {

    private final ProductoService productoService;
    private final PedidoService pedidoService;

    public CheckoutController(
            ProductoService productoService,
            PedidoService pedidoService) {
        this.productoService = productoService;
        this.pedidoService = pedidoService;
    }

    @GetMapping("/checkout")
    public String checkout(Model model, HttpSession session) {

        Map<Integer, Integer> cantidades = obtenerCarrito(session);

        if (cantidades.isEmpty()) {
            return "redirect:/carrito";
        }

        List<Producto> productos = new ArrayList<>();
        double total = 0;

        for (Map.Entry<Integer, Integer> entrada : cantidades.entrySet()) {

            Producto producto = productoService
                    .buscarPorId(entrada.getKey())
                    .orElse(null);

            if (producto != null) {
                productos.add(producto);
                total += producto.getPrecio() * entrada.getValue();
            }
        }

        if (productos.isEmpty()) {
            return "redirect:/carrito";
        }

        model.addAttribute("productos", productos);
        model.addAttribute("cantidades", cantidades);
        model.addAttribute("total", total);

        return "checkout";
    }

    @PostMapping("/checkout/confirmar")
    public String confirmarCompra(
            @RequestParam String nombre,
            @RequestParam String email,
            @RequestParam String telefono,
            @RequestParam String direccion,
            @RequestParam String metodoPago,
            HttpSession session,
            RedirectAttributes redirectAttributes) {

        Map<Integer, Integer> cantidades = obtenerCarrito(session);

        if (cantidades.isEmpty()) {
            redirectAttributes.addFlashAttribute(
                    "error", "Tu carrito está vacío.");
            return "redirect:/carrito";
        }

        try {
            List<DetallePedido> detalles = new ArrayList<>();
            float total = 0;

            for (Map.Entry<Integer, Integer> entrada
                    : cantidades.entrySet()) {

                Integer idProducto = entrada.getKey();
                Integer cantidad = entrada.getValue();

                if (idProducto == null || cantidad == null
                        || cantidad <= 0) {
                    throw new IllegalArgumentException(
                            "Hay cantidades inválidas en el carrito.");
                }

                Producto producto = productoService
                        .buscarPorId(idProducto)
                        .orElseThrow(() -> new IllegalArgumentException(
                                "Uno de los productos ya no está disponible."));

                if (!Float.isFinite(producto.getPrecio())
                        || producto.getPrecio() <= 0) {
                    throw new IllegalArgumentException(
                            "El precio de un producto no es válido.");
                }

                DetallePedido detalle = new DetallePedido();
                detalle.setIdProducto(idProducto);
                detalle.setCantidadProducto(cantidad);
                detalle.setPrecioProducto(producto.getPrecio());

                detalles.add(detalle);
                total += producto.getPrecio() * cantidad;
            }

            if (!Float.isFinite(total) || total <= 0) {
                throw new IllegalArgumentException(
                        "No se pudo calcular el total de la compra.");
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

            session.removeAttribute("carrito");
            session.setAttribute(
                    "pedidoConfirmado", pedido.getIdPedido());

            return "redirect:/checkout/confirmacion";

        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute(
                    "error", e.getMessage());
            return "redirect:/checkout";

        } catch (Exception e) {
            redirectAttributes.addFlashAttribute(
                    "error",
                    "No fue posible registrar la compra. "
                    + "Tus productos siguen en el carrito.");
            return "redirect:/checkout";
        }
    }

    @GetMapping("/checkout/confirmacion")
    public String confirmacion(HttpSession session, Model model) {

        Object idPedido = session.getAttribute("pedidoConfirmado");

        if (idPedido == null) {
            return "redirect:/carrito";
        }

        model.addAttribute("idPedido", idPedido);
        session.removeAttribute("pedidoConfirmado");

        return "confirmacion";
    }

    private Map<Integer, Integer> obtenerCarrito(HttpSession session) {

        Object carrito = session.getAttribute("carrito");
        Map<Integer, Integer> cantidades = new LinkedHashMap<>();

        if (carrito instanceof Map<?, ?> mapa) {
            for (Map.Entry<?, ?> entrada : mapa.entrySet()) {
                if (entrada.getKey() instanceof Integer id
                        && entrada.getValue() instanceof Integer cantidad) {
                    cantidades.put(id, cantidad);
                }
            }
        } else if (carrito instanceof List<?> lista) {
            for (Object elemento : lista) {
                if (elemento instanceof Integer id) {
                    cantidades.put(
                            id, cantidades.getOrDefault(id, 0) + 1);
                }
            }
        }

        session.setAttribute("carrito", cantidades);
        return cantidades;
    }
}
