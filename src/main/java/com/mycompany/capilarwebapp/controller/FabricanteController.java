package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Fabricante;
import com.mycompany.capilarwebapp.service.FabricanteService;
import java.util.Optional;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador para gestionar los fabricantes de CapilarDía.
 */
@Controller
@RequestMapping("/fabricantes")
public class FabricanteController {

    private final FabricanteService fabricanteService;

    public FabricanteController(FabricanteService fabricanteService) {
        this.fabricanteService = fabricanteService;
    }

    // Listar fabricantes
    @GetMapping
    public String listarFabricantes(Model model) {

        model.addAttribute(
                "fabricantes",
                fabricanteService.listarFabricantes()
        );

        return "fabricantes";
    }

    // Formulario para crear fabricante
    @GetMapping("/nuevo")
    public String nuevoFabricante(Model model) {

        model.addAttribute("fabricante", new Fabricante());

        return "fabricante-form";
    }

    // Guardar fabricante
    @PostMapping("/guardar")
    public String guardarFabricante(
            @ModelAttribute Fabricante fabricante) {

        fabricanteService.guardarFabricante(fabricante);

        return "redirect:/fabricantes";
    }

    // Formulario para editar fabricante
    @GetMapping("/editar/{id}")
    public String editarFabricante(
            @PathVariable int id,
            Model model) {

        Optional<Fabricante> fabricante =
                fabricanteService.buscarPorId(id);

        if (fabricante.isPresent()) {

            model.addAttribute(
                    "fabricante",
                    fabricante.get()
            );

            return "fabricante-form";
        }

        return "redirect:/fabricantes";
    }

    // Eliminar fabricante
    @GetMapping("/eliminar/{id}")
    public String eliminarFabricante(
            @PathVariable int id) {

        fabricanteService.eliminarFabricante(id);

        return "redirect:/fabricantes";
    }
}