package com.mycompany.capilarwebapp.repository;

import com.mycompany.capilarwebapp.modelo.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos para las categorías.
 */
@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Integer> {
}