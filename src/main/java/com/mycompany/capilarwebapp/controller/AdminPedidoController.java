
package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Pedido;
import com.mycompany.capilarwebapp.modelo.Cliente;
import com.mycompany.capilarwebapp.modelo.Venta;
import com.mycompany.capilarwebapp.modelo.DetallePedido;
import com.mycompany.capilarwebapp.modelo.Producto;

import com.mycompany.capilarwebapp.repository.PedidoRepository;
import com.mycompany.capilarwebapp.repository.ClienteRepository;
import com.mycompany.capilarwebapp.repository.VentaRepository;
import com.mycompany.capilarwebapp.repository.DetallePedidoRepository;
import com.mycompany.capilarwebapp.repository.ProductoRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;

@RestController
@RequestMapping("/api/admin")
public class AdminPedidoController {

    private final PedidoRepository pedidoRepository;
    private final ClienteRepository clienteRepository;
    private final VentaRepository ventaRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final ProductoRepository productoRepository;

    public AdminPedidoController(
        PedidoRepository pedidoRepository,
        ClienteRepository clienteRepository,
        VentaRepository ventaRepository,
        DetallePedidoRepository detallePedidoRepository,
        ProductoRepository productoRepository) {

    this.pedidoRepository = pedidoRepository;
    this.clienteRepository = clienteRepository;
    this.ventaRepository = ventaRepository;
    this.detallePedidoRepository = detallePedidoRepository;
    this.productoRepository = productoRepository;
}

    @GetMapping("/pedidos")
    public List<Map<String, Object>> obtenerTodosLosPedidos() {

        List<Pedido> pedidos = pedidoRepository.findAll();

        List<Map<String, Object>> resultado = new ArrayList<>();

        for (Pedido pedido : pedidos) {

            Map<String, Object> datosPedido = new HashMap<>();

            Optional<Cliente> cliente =
                    clienteRepository.findById(pedido.getIdCliente());

            Optional<Venta> venta =
                    ventaRepository.findByIdPedido(pedido.getIdPedido());

            datosPedido.put("idPedido", pedido.getIdPedido());

            datosPedido.put(
                    "cliente",
                    cliente.map(Cliente::getNombre)
                            .orElse("Cliente no disponible")
            );

            datosPedido.put("fecha", pedido.getFechaPedido());
            datosPedido.put("estado", pedido.getEstadoPedido());

            datosPedido.put(
                    "total",
                    venta.map(Venta::getTotal).orElse(0f)
            );

            resultado.add(datosPedido);
        }

        return resultado;
    }
    
    @GetMapping("/pedidos/{idPedido}")
    public Map<String, Object> obtenerDetallePedido(
            @org.springframework.web.bind.annotation.PathVariable Integer idPedido) {

        Map<String, Object> resultado = new HashMap<>();

        Optional<Pedido> pedidoEncontrado =
                pedidoRepository.findById(idPedido);

        if (pedidoEncontrado.isEmpty()) {
            resultado.put("error", "Pedido no encontrado.");
            return resultado;
        }

        Pedido pedido = pedidoEncontrado.get();

        List<DetallePedido> detalles =
                detallePedidoRepository.findByIdPedido(idPedido);

        List<Map<String, Object>> productos = new ArrayList<>();

        float totalCalculado = 0;

        for (DetallePedido detalle : detalles) {

            Optional<Producto> productoEncontrado =
                    productoRepository.findById(detalle.getIdProducto());

            Map<String, Object> datosProducto = new HashMap<>();

            datosProducto.put("idProducto", detalle.getIdProducto());

            datosProducto.put(
                    "nombre",
                    productoEncontrado.map(Producto::getNombre)
                            .orElse("Producto no disponible")
            );

            datosProducto.put("cantidad", detalle.getCantidadProducto());
            datosProducto.put("precioUnitario", detalle.getPrecioProducto());

            float subtotal =
                    detalle.getCantidadProducto() * detalle.getPrecioProducto();

            datosProducto.put("subtotal", subtotal);

            totalCalculado += subtotal;

            productos.add(datosProducto);
        }

        Optional<Cliente> cliente =
                clienteRepository.findById(pedido.getIdCliente());

        Optional<Venta> venta =
                ventaRepository.findByIdPedido(idPedido);

        resultado.put("idPedido", pedido.getIdPedido());
        resultado.put("cliente", cliente.map(Cliente::getNombre)
                .orElse("Cliente no disponible"));
        resultado.put("fecha", pedido.getFechaPedido());
        resultado.put("estado", pedido.getEstadoPedido());
        resultado.put("productos", productos);
        resultado.put("total", venta.map(Venta::getTotal)
                .orElse(totalCalculado));

        return resultado;
    }
        
    @PutMapping("/pedidos/{idPedido}/estado")
    public ResponseEntity<Map<String, Object>> actualizarEstadoPedido(
            @org.springframework.web.bind.annotation.PathVariable Integer idPedido,
            @RequestBody Map<String, String> solicitud) {

        Map<String, Object> respuesta = new HashMap<>();

        Optional<Pedido> pedidoEncontrado =
                pedidoRepository.findById(idPedido);

        if (pedidoEncontrado.isEmpty()) {
            respuesta.put("error", "Pedido no encontrado.");

            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(respuesta);
        }

        String nuevoEstado = solicitud.get("estado");

        if (nuevoEstado == null || nuevoEstado.isBlank()) {
            respuesta.put("error", "Debes indicar el nuevo estado.");

            return ResponseEntity.badRequest().body(respuesta);
        }

        nuevoEstado = nuevoEstado.trim();

        List<String> estadosPermitidos = List.of(
                "Pendiente",
                "En preparación",
                "Enviado",
                "Entregado",
                "Cancelado"
        );

        if (!estadosPermitidos.contains(nuevoEstado)) {
            respuesta.put("error", "El estado indicado no es válido.");

            return ResponseEntity.badRequest().body(respuesta);
        }

        Pedido pedido = pedidoEncontrado.get();

        pedido.setEstadoPedido(nuevoEstado);

        pedidoRepository.save(pedido);

        respuesta.put("mensaje", "Estado del pedido actualizado correctamente.");
        respuesta.put("idPedido", pedido.getIdPedido());
        respuesta.put("estado", pedido.getEstadoPedido());

        return ResponseEntity.ok(respuesta);
    }


}
