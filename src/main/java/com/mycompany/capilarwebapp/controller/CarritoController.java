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
import org.springframework.web.bind.annotation.PathVariable;

/**
 * Controlador para gestionar el carrito de compra.
 */
@Controller
public class CarritoController {

    private final ProductoService productoService;

    public CarritoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    // Mostrar carrito
    @GetMapping("/carrito")
    public String carrito(Model model, HttpSession session) {

        Map<Integer, Integer> cantidades = obtenerCarrito(session);

        List<Producto> productos = new ArrayList<>();
        double total = 0;

        for (Map.Entry<Integer, Integer> entrada : cantidades.entrySet()) {

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

        return "carrito";
    }

    // Agregar producto al carrito
    @GetMapping("/carrito/agregar/{id}")
    public String agregar(
            @PathVariable int id,
            HttpSession session) {

        Map<Integer, Integer> cantidades =
                obtenerCarrito(session);

        cantidades.put(
                id,
                cantidades.getOrDefault(id, 0) + 1
        );

        session.setAttribute("carrito", cantidades);

        return "redirect:/carrito";
    }

    // Eliminar una unidad
    @GetMapping("/carrito/eliminar/{id}")
    public String eliminar(
            @PathVariable int id,
            HttpSession session) {

        Map<Integer, Integer> cantidades =
                obtenerCarrito(session);

        if (cantidades.containsKey(id)) {

            int cantidad = cantidades.get(id);

            if (cantidad > 1) {
                cantidades.put(id, cantidad - 1);
            } else {
                cantidades.remove(id);
            }
        }

        session.setAttribute("carrito", cantidades);

        return "redirect:/carrito";
    }

    /**
     * Obtiene el carrito actual.
     * También convierte el formato antiguo List a Map.
     */
    private Map<Integer, Integer> obtenerCarrito(
            HttpSession session) {

        Object carrito = session.getAttribute("carrito");

        Map<Integer, Integer> cantidades =
                new LinkedHashMap<>();

        // Carrito nuevo
        if (carrito instanceof Map) {

            cantidades.putAll(
                    (Map<Integer, Integer>) carrito
            );

        // Carrito antiguo
        } else if (carrito instanceof List) {

            List<Integer> ids =
                    (List<Integer>) carrito;

            for (Integer id : ids) {

                cantidades.put(
                        id,
                        cantidades.getOrDefault(id, 0) + 1
                );
            }
        }

        session.setAttribute("carrito", cantidades);

        return cantidades;
    }
}