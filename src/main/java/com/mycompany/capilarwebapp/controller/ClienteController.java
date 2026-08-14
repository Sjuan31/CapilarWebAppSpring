package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Cliente;
import com.mycompany.capilarwebapp.service.ClienteService;
import java.util.Optional;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

/**
 * Controlador para gestionar los clientes de CapilarDía.
 */
@Controller
@RequestMapping("/clientes")
public class ClienteController {

    private final ClienteService clienteService;

    public ClienteController(ClienteService clienteService) {
        this.clienteService = clienteService;
    }

    // Listar clientes
    @GetMapping
    public String listarClientes(Model model) {

        model.addAttribute(
                "clientes",
                clienteService.listarClientes()
        );

        return "clientes";
    }

    // Formulario para crear cliente
    @GetMapping("/nuevo")
    public String nuevoCliente(Model model) {

        model.addAttribute("cliente", new Cliente());

        return "cliente-form";
    }

    // Guardar cliente
    @PostMapping("/guardar")
    public String guardarCliente(
            @ModelAttribute Cliente cliente) {

        clienteService.guardarCliente(cliente);

        return "redirect:/clientes";
    }

    // Formulario para editar cliente
    @GetMapping("/editar/{id}")
    public String editarCliente(
            @PathVariable int id,
            Model model) {

        Optional<Cliente> cliente =
                clienteService.buscarPorId(id);

        if (cliente.isPresent()) {

            model.addAttribute(
                    "cliente",
                    cliente.get()
            );

            return "cliente-form";
        }

        return "redirect:/clientes";
    }

    // Eliminar cliente
    @GetMapping("/eliminar/{id}")
    public String eliminarCliente(
            @PathVariable int id) {

        clienteService.eliminarCliente(id);

        return "redirect:/clientes";
    }
}