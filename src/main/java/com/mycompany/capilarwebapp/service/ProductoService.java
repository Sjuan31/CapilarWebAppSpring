
package com.mycompany.capilarwebapp.service;

import com.mycompany.capilarwebapp.modelo.Producto;
import com.mycompany.capilarwebapp.repository.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public List<Producto> listarProductos() {
        return productoRepository.findAll();
    }

    public Optional<Producto> buscarPorId(int id) {
        return productoRepository.findById(id);
    }

    @Transactional
    public Producto buscarPorIdConBloqueo(int id) {
        return productoRepository.buscarPorIdConBloqueo(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "El producto con ID " + id + " no existe."));
    }

    public Producto guardarProducto(Producto producto) {
        return productoRepository.save(producto);
    }

    public void eliminarProducto(int id) {
        productoRepository.deleteById(id);
    }
}
