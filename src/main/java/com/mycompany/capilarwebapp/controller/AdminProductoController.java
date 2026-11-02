
package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Producto;
import com.mycompany.capilarwebapp.modelo.Categoria;
import com.mycompany.capilarwebapp.modelo.Fabricante;

import com.mycompany.capilarwebapp.service.ProductoService;
import com.mycompany.capilarwebapp.repository.CategoriaRepository;
import com.mycompany.capilarwebapp.repository.FabricanteRepository;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.dao.DataIntegrityViolationException;
import java.util.HashMap;
import java.util.Map;

import org.springframework.web.bind.annotation.PutMapping;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/productos")
public class AdminProductoController {

    private final ProductoService productoService;
    private final CategoriaRepository categoriaRepository;
    private final FabricanteRepository fabricanteRepository;

    public AdminProductoController(
            ProductoService productoService,
            CategoriaRepository categoriaRepository,
            FabricanteRepository fabricanteRepository) {

        this.productoService = productoService;
        this.categoriaRepository = categoriaRepository;
        this.fabricanteRepository = fabricanteRepository;
    }

    @GetMapping
    public List<Producto> listarProductos() {
        return productoService.listarProductos();
    }
    
    @PostMapping
    public ResponseEntity<?> guardarProducto(@RequestBody Producto producto) {
        try {
            Producto nuevoProducto = productoService.guardarProducto(producto);

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(nuevoProducto);

        } catch (Exception e) {
            return ResponseEntity
                    .badRequest()
                    .body("No fue posible guardar el producto: " + e.getMessage());
        }
    }
            

    @GetMapping("/categorias")
    public List<Categoria> listarCategorias() {
        return categoriaRepository.findAll();
    }

    @GetMapping("/fabricantes")
    public List<Fabricante> listarFabricantes() {
        return fabricanteRepository.findAll();
    }
    
    @DeleteMapping("/{idProducto}")
    public ResponseEntity<Map<String, Object>> eliminarProducto(
            @PathVariable int idProducto) {

        Map<String, Object> respuesta = new HashMap<>();

        if (productoService.buscarPorId(idProducto).isEmpty()) {
            respuesta.put("error", "El producto no existe.");

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(respuesta);
        }

        try {
            productoService.eliminarProducto(idProducto);

            respuesta.put("mensaje", "Producto eliminado correctamente.");
            respuesta.put("idProducto", idProducto);

            return ResponseEntity.ok(respuesta);

        } catch (DataIntegrityViolationException e) {

            respuesta.put(
                    "error",
                    "No se puede eliminar este producto porque está relacionado con pedidos u otros registros."
            );

            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(respuesta);
        }
    }
    
    @PutMapping("/{idProducto}")
    public ResponseEntity<?> actualizarProducto(
            @PathVariable int idProducto,
            @RequestBody Producto datosProducto) {

        Optional<Producto> productoEncontrado =
                productoService.buscarPorId(idProducto);

        if (productoEncontrado.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("El producto no existe.");
        }

        Producto producto = productoEncontrado.get();

        producto.setNombre(datosProducto.getNombre());
        producto.setPrecio(datosProducto.getPrecio());
        producto.setStock(datosProducto.getStock());
        producto.setImagen(datosProducto.getImagen());
        producto.setIdCategoria(datosProducto.getIdCategoria());
        producto.setIdFabricante(datosProducto.getIdFabricante());

        Producto actualizado = productoService.guardarProducto(producto);

        return ResponseEntity.ok(actualizado);
    }
}
