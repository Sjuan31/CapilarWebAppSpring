
package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Producto;
import com.mycompany.capilarwebapp.service.ProductoService;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(
    origins = "http://localhost:5173",
    allowCredentials = "true"
)
public class ProductoApiController {

    private final ProductoService productoService;

    public ProductoApiController(ProductoService productoService) {
        this.productoService = productoService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public List<Map<String, Object>> listarProductos() {

        List<Producto> productos = productoService.listarProductos();

        List<Map<String, Object>> respuesta = new ArrayList<>();

        for (Producto producto : productos) {

            Map<String, Object> item = new LinkedHashMap<>();

            item.put("idProducto", producto.getIdProducto());
            item.put("nombre", producto.getNombre());
            item.put("precio", producto.getPrecio());
            item.put("stock", producto.getStock());
            item.put("imagen", producto.getImagen());
            item.put("idCategoria", producto.getIdCategoria());
            item.put("idFabricante", producto.getIdFabricante());

            respuesta.add(item);
        }

        return respuesta;
    }
}
