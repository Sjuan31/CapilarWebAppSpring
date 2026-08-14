package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Producto;
import com.mycompany.capilarwebapp.service.ProductoService;
import jakarta.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

/**
 * Controlador para finalizar la compra.
 */
@Controller
public class CheckoutController {

    private final ProductoService productoService;

    public CheckoutController(ProductoService productoService) {
        this.productoService = productoService;
    }

    // Mostrar resumen de compra
    @GetMapping("/checkout")
    public String checkout(Model model, HttpSession session) {

        Map<Integer, Integer> cantidades =
                obtenerCarrito(session);

        List<Producto> productos = new ArrayList<>();

        double total = 0;

        for (Map.Entry<Integer, Integer> entrada :
                cantidades.entrySet()) {

            Producto producto = productoService
                    .buscarPorId(entrada.getKey())
                    .orElse(null);

            if (producto != null) {

                productos.add(producto);

                total += producto.getPrecio()
                        * entrada.getValue();
            }
        }

        model.addAttribute("productos", productos);
        model.addAttribute("cantidades", cantidades);
        model.addAttribute("total", total);

        return "checkout";
    }

    // Confirmar compra
    @PostMapping("/checkout/confirmar")
    public String confirmarCompra(HttpSession session) {

        // En esta versión se confirma la compra
        // y se limpia el carrito actual.
        session.removeAttribute("carrito");

        return "confirmacion";
    }

    private Map<Integer, Integer> obtenerCarrito(
            HttpSession session) {

        Object carrito =
                session.getAttribute("carrito");

        Map<Integer, Integer> cantidades =
                new LinkedHashMap<>();

        if (carrito instanceof Map) {

            cantidades.putAll(
                    (Map<Integer, Integer>) carrito
            );
        }

        return cantidades;
    }
}