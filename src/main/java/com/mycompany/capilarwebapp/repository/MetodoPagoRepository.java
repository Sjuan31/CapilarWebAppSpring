
package com.mycompany.capilarwebapp.repository;

import com.mycompany.capilarwebapp.modelo.MetodoPago;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MetodoPagoRepository
        extends JpaRepository<MetodoPago, Integer> {
}
