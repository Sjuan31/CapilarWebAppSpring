package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Producto;
import com.mycompany.capilarwebapp.service.ProductoService;
import java.util.Optional;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador para gestionar los productos de CapilarDía.
 */
@Controller
@RequestMapping("/productos")
public class ProductoController {

    private final ProductoService productoService;

    public ProductoController(ProductoService productoService) {
        this.productoService = productoService;
    }

    // Mostrar todos los productos
    @GetMapping
    public String listarProductos(Model model) {

        model.addAttribute("productos",
                productoService.listarProductos());

        return "productos";
    }

    // Mostrar formulario para nuevo producto
    @GetMapping("/nuevo")
    public String nuevoProducto(Model model) {

        model.addAttribute("producto", new Producto());

        return "producto-form";
    }

    // Guardar producto
    @PostMapping("/guardar")
    public String guardarProducto(@ModelAttribute Producto producto) {

        productoService.guardarProducto(producto);

        return "redirect:/productos";
    }

    // Mostrar formulario para editar
    @GetMapping("/editar/{id}")
    public String editarProducto(@PathVariable int id, Model model) {

        Optional<Producto> producto =
                productoService.buscarPorId(id);

        if (producto.isPresent()) {
            model.addAttribute("producto", producto.get());
            return "producto-form";
        }

        return "redirect:/productos";
    }

    // Eliminar producto
    @GetMapping("/eliminar/{id}")
    public String eliminarProducto(@PathVariable int id) {

        productoService.eliminarProducto(id);

        return "redirect:/productos";
    }
}