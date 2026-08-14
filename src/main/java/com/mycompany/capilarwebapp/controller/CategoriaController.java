package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Categoria;
import com.mycompany.capilarwebapp.service.CategoriaService;
import java.util.Optional;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador para gestionar las categorías de productos.
 */
@Controller
@RequestMapping("/categorias")
public class CategoriaController {

    private final CategoriaService categoriaService;

    public CategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    // Listar categorías
    @GetMapping
    public String listarCategorias(Model model) {

        model.addAttribute(
                "categorias",
                categoriaService.listarCategorias()
        );

        return "categorias";
    }

    // Formulario para crear categoría
    @GetMapping("/nuevo")
    public String nuevaCategoria(Model model) {

        model.addAttribute("categoria", new Categoria());

        return "categoria-form";
    }

    // Guardar categoría
    @PostMapping("/guardar")
    public String guardarCategoria(
            @ModelAttribute Categoria categoria) {

        categoriaService.guardarCategoria(categoria);

        return "redirect:/categorias";
    }

    // Formulario para editar categoría
    @GetMapping("/editar/{id}")
    public String editarCategoria(
            @PathVariable int id,
            Model model) {

        Optional<Categoria> categoria =
                categoriaService.buscarPorId(id);

        if (categoria.isPresent()) {

            model.addAttribute(
                    "categoria",
                    categoria.get()
            );

            return "categoria-form";
        }

        return "redirect:/categorias";
    }

    // Eliminar categoría
    @GetMapping("/eliminar/{id}")
    public String eliminarCategoria(
            @PathVariable int id) {

        categoriaService.eliminarCategoria(id);

        return "redirect:/categorias";
    }
}