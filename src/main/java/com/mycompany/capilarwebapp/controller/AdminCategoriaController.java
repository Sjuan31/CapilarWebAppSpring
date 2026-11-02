
package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Categoria;
import com.mycompany.capilarwebapp.service.CategoriaService;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/categorias")
public class AdminCategoriaController {

    private final CategoriaService categoriaService;

    public AdminCategoriaController(CategoriaService categoriaService) {
        this.categoriaService = categoriaService;
    }

    @GetMapping
    public ResponseEntity<List<Categoria>> listarCategorias() {
        return ResponseEntity.ok(categoriaService.listarCategorias());
    }

    @PostMapping
    public ResponseEntity<Categoria> guardarCategoria(
            @RequestBody Categoria categoria) {

        Categoria nuevaCategoria =
                categoriaService.guardarCategoria(categoria);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(nuevaCategoria);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarCategoria(
            @PathVariable int id,
            @RequestBody Categoria datos) {

        return categoriaService.buscarPorId(id)
                .map(categoria -> {
                    categoria.setNombre(datos.getNombre());
                    categoria.setDescripcion(datos.getDescripcion());

                    return ResponseEntity.ok(
                            categoriaService.guardarCategoria(categoria)
                    );
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarCategoria(@PathVariable int id) {

        if (categoriaService.buscarPorId(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        try {
            categoriaService.eliminarCategoria(id);
            return ResponseEntity.noContent().build();

        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(e.getMessage());
        }
    }
}
