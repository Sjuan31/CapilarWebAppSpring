package com.mycompany.capilarwebapp.repository;

import com.mycompany.capilarwebapp.modelo.Fabricante;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Acceso a datos para los fabricantes.
 */
@Repository
public interface FabricanteRepository
        extends JpaRepository<Fabricante, Integer> {
}