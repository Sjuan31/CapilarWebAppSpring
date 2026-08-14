package com.mycompany.capilarwebapp.service;

import com.mycompany.capilarwebapp.modelo.Categoria;
import com.mycompany.capilarwebapp.repository.CategoriaRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Lógica de negocio para las categorías.
 */
@Service
public class CategoriaService {

    private final CategoriaRepository categoriaRepository;

    public CategoriaService(CategoriaRepository categoriaRepository) {
        this.categoriaRepository = categoriaRepository;
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
        categoriaRepository.deleteById(id);
    }
}