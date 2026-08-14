package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Producto;
import com.mycompany.capilarwebapp.service.ProductoService;
import java.util.Optional;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Controlador para mostrar el detalle de un producto.
 */
@Controller
@RequestMapping("/producto")
public class DetalleProductoController {

    private final ProductoService productoService;

    public DetalleProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping("/{id}")
    public String detalleProducto(
            @PathVariable int id,
            Model model) {

        Optional<Producto> producto =
                productoService.buscarPorId(id);

        if (producto.isPresent()) {
            model.addAttribute("producto", producto.get());
            return "detalle-producto";
        }

        return "redirect:/productos";
    }
}

