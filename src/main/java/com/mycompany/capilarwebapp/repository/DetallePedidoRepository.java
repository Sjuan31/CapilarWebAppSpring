
package com.mycompany.capilarwebapp.repository;

import com.mycompany.capilarwebapp.modelo.DetallePedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DetallePedidoRepository
        extends JpaRepository<DetallePedido, Integer> {
}
