package com.mycompany.capilarwebapp.service;

import com.mycompany.capilarwebapp.modelo.Producto;
import com.mycompany.capilarwebapp.repository.ProductoRepository;
import java.util.List;
import org.springframework.stereotype.Service;

/**
 * Contiene la lógica de negocio relacionada con los productos.
 */
@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    /**
     * Consulta todos los productos registrados.
     */
    public List<Producto> listarProductos() {
        return productoRepository.findAll();
    }

}