package com.mycompany.capilarwebapp.repository;

import com.mycompany.capilarwebapp.modelo.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repositorio para consultar y gestionar productos.
 */
@Repository
public interface ProductoRepository extends JpaRepository<Producto, Integer> {
}