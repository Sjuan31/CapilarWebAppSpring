package com.mycompany.capilarwebapp.service;

import com.mycompany.capilarwebapp.modelo.Categoria;
import com.mycompany.capilarwebapp.repository.CategoriaRepository;
import com.mycompany.capilarwebapp.repository.ProductoRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;
    private final ProductoRepository productoRepository;

    public CategoriaService(
            CategoriaRepository categoriaRepository,
            ProductoRepository productoRepository) {

        this.categoriaRepository = categoriaRepository;
        this.productoRepository = productoRepository;
    }

    public List<Categoria> listarCategorias() {
        return categoriaRepository.findAll();
    }

    public Optional<Categoria> buscarPorId(int id) {
        return categoriaRepository.findById(id);
    }

    public Categoria guardarCategoria(Categoria categoria) {
        return categoriaRepository.save(categoria);
    }

    public void eliminarCategoria(int id) {

        if (productoRepository.existsByIdCategoria(id)) {
            throw new IllegalStateException(
                    "No se puede eliminar esta categoría porque tiene productos asociados."
            );
        }

        categoriaRepository.deleteById(id);
    }
}