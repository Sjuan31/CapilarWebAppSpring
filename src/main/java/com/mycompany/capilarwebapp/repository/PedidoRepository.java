
package com.mycompany.capilarwebapp.repository;

import com.mycompany.capilarwebapp.modelo.Pedido;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Integer> {

    List<Pedido> findTop10ByOrderByFechaPedidoDescIdPedidoDesc();
}
