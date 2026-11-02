
package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Producto;
import com.mycompany.capilarwebapp.service.ProductoService;
import jakarta.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/carrito")
@CrossOrigin(
    origins = "http://localhost:5173",
    allowCredentials = "true"
)
public class CarritoApiController {

    private final ProductoService productoService;

    public CarritoApiController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping
    public Map<String, Object> consultarCarrito(HttpSession session) {
        Map<Integer, Integer> cantidades = obtenerCarrito(session);
        List<Map<String, Object>> items = new ArrayList<>();
        double total = 0;

        for (Map.Entry<Integer, Integer> entrada : cantidades.entrySet()) {
            Producto producto = productoService
                .buscarPorId(entrada.getKey())
                .orElse(null);

            if (producto == null) {
                continue;
            }

            int cantidad = entrada.getValue();
            double subtotal = producto.getPrecio() * cantidad;
            total += subtotal;

            Map<String, Object> item = new LinkedHashMap<>();
            item.put("idProducto", producto.getIdProducto());
            item.put("nombre", producto.getNombre());
            item.put("precio", producto.getPrecio());
            item.put("stock", producto.getStock());
            item.put("imagen", producto.getImagen());
            item.put("cantidad", cantidad);
            item.put("subtotal", subtotal);

            items.add(item);
        }

        Map<String, Object> respuesta = new LinkedHashMap<>();
        respuesta.put("items", items);
        respuesta.put("cantidadTotal", cantidades.values()
            .stream().mapToInt(Integer::intValue).sum());
        respuesta.put("total", total);

        return respuesta;
    }

    @PostMapping("/agregar/{id}")
    public Map<String, Object> agregarProducto(
            @PathVariable int id,
            HttpSession session) {

        Producto producto = productoService.buscarPorId(id)
            .orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Producto no encontrado."));

        Map<Integer, Integer> cantidades = obtenerCarrito(session);
        int cantidadActual = cantidades.getOrDefault(id, 0);

        if (producto.getStock() <= cantidadActual) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "No hay suficientes unidades disponibles.");
        }

        cantidades.put(id, cantidadActual + 1);
        session.setAttribute("carrito", cantidades);

        return consultarCarrito(session);
    }

    @DeleteMapping("/eliminar/{id}")
    public Map<String, Object> eliminarUnidad(
            @PathVariable int id,
            HttpSession session) {

        Map<Integer, Integer> cantidades = obtenerCarrito(session);

        if (cantidades.containsKey(id)) {
            int cantidad = cantidades.get(id);

            if (cantidad > 1) {
                cantidades.put(id, cantidad - 1);
            } else {
                cantidades.remove(id);
            }
        }

        session.setAttribute("carrito", cantidades);
        return consultarCarrito(session);
    }

    @DeleteMapping("/vaciar")
    public Map<String, Object> vaciarCarrito(HttpSession session) {
        session.removeAttribute("carrito");
        return consultarCarrito(session);
    }

    private Map<Integer, Integer> obtenerCarrito(HttpSession session) {
        Object carrito = session.getAttribute("carrito");
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
                        id, cantidades.getOrDefault(id, 0) + 1);
                }
            }
        }

        session.setAttribute("carrito", cantidades);
        return cantidades;
    }
}
