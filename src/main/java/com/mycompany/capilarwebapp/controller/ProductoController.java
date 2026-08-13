package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Producto;
import com.mycompany.capilarwebapp.service.ProductoService;
import java.util.List;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controlador web para consultar los productos de CapilarDía.
 */
@Controller
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    /**
     * Muestra la lista de productos registrados.
     */
    @GetMapping("/productos")
    public String listarProductos(Model model) {

        List<Producto> productos =
                productoService.listarProductos();

        model.addAttribute("productos", productos);

        return "productos";
    }

}