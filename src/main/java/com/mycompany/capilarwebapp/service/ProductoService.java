package com.mycompany.capilarwebapp.service;

import com.mycompany.capilarwebapp.modelo.Producto;
import com.mycompany.capilarwebapp.repository.ProductoRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Servicio para gestionar los productos de CapilarDía.
 */
@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    // Consultar todos los productos
    public List<Producto> listarProductos() {
        return productoRepository.findAll();
    }

    // Buscar un producto por su ID
    public Optional<Producto> buscarPorId(int id) {
        return productoRepository.findById(id);
    }

    // Guardar o actualizar un producto
    public Producto guardarProducto(Producto producto) {
        return productoRepository.save(producto);
    }

    // Eliminar un producto
    public void eliminarProducto(int id) {
        productoRepository.deleteById(id);
    }
}