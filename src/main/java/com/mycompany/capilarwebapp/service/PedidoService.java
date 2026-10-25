
package com.mycompany.capilarwebapp.service;

import com.mycompany.capilarwebapp.modelo.Cliente;
import com.mycompany.capilarwebapp.modelo.Pedido;
import com.mycompany.capilarwebapp.modelo.DetallePedido;
import com.mycompany.capilarwebapp.modelo.Venta;
import com.mycompany.capilarwebapp.modelo.MetodoPago;
import com.mycompany.capilarwebapp.modelo.Producto;

import com.mycompany.capilarwebapp.repository.ClienteRepository;
import com.mycompany.capilarwebapp.repository.PedidoRepository;
import com.mycompany.capilarwebapp.repository.DetallePedidoRepository;
import com.mycompany.capilarwebapp.repository.VentaRepository;
import com.mycompany.capilarwebapp.repository.MetodoPagoRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.sql.Timestamp;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public class PedidoService {

    private final ClienteRepository clienteRepository;
    private final PedidoRepository pedidoRepository;
    private final DetallePedidoRepository detallePedidoRepository;
    private final VentaRepository ventaRepository;
    private final MetodoPagoRepository metodoPagoRepository;
    private final ProductoService productoService;

    public PedidoService(
            ClienteRepository clienteRepository,
            PedidoRepository pedidoRepository,
            DetallePedidoRepository detallePedidoRepository,
            VentaRepository ventaRepository,
            MetodoPagoRepository metodoPagoRepository,
            ProductoService productoService) {

        this.clienteRepository = clienteRepository;
        this.pedidoRepository = pedidoRepository;
        this.detallePedidoRepository = detallePedidoRepository;
        this.ventaRepository = ventaRepository;
        this.metodoPagoRepository = metodoPagoRepository;
        this.productoService = productoService;
    }

    @Transactional
    public Pedido registrarCompra(
            String nombre,
            String email,
            String telefono,
            String direccion,
            String tipoPago,
            List<DetallePedido> detalles,
            Float totalRecibido) {

        if (nombre == null || nombre.isBlank()
                || email == null || email.isBlank()
                || telefono == null || telefono.isBlank()
                || direccion == null || direccion.isBlank()) {
            throw new IllegalArgumentException(
                    "Todos los datos del comprador son obligatorios.");
        }

        if (detalles == null || detalles.isEmpty()) {
            throw new IllegalArgumentException(
                    "El carrito no contiene productos.");
        }

        if (!"contra_entrega".equals(tipoPago)
                && !"transferencia".equals(tipoPago)) {
            throw new IllegalArgumentException(
                    "El método de pago no es válido.");
        }

        Set<Integer> productosProcesados = new HashSet<>();
        float totalCalculado = 0;

        // Validar los productos y calcular el precio vigente.
        for (DetallePedido detalle : detalles) {

            if (detalle == null
                    || detalle.getIdProducto() == null
                    || detalle.getCantidadProducto() <= 0) {
                throw new IllegalArgumentException(
                        "Hay productos o cantidades inválidas.");
            }

            Integer idProducto = detalle.getIdProducto();

            if (!productosProcesados.add(idProducto)) {
                throw new IllegalArgumentException(
                        "El carrito contiene productos duplicados.");
            }

            Producto producto =
                    productoService.buscarPorIdConBloqueo(idProducto);

            int cantidad = detalle.getCantidadProducto();
            float precioActual = producto.getPrecio();

            if (!Float.isFinite(precioActual) || precioActual <= 0) {
                throw new IllegalArgumentException(
                        "El precio de " + producto.getNombre()
                        + " no es válido.");
            }

            if (producto.getStock() < cantidad) {
                throw new IllegalArgumentException(
                        "No hay suficientes unidades de "
                        + producto.getNombre()
                        + ". Disponibles: " + producto.getStock() + ".");
            }

            detalle.setPrecioProducto(precioActual);

            totalCalculado += precioActual * cantidad;

            // Descontar el inventario.
            producto.setStock(producto.getStock() - cantidad);
        }

        if (!Float.isFinite(totalCalculado) || totalCalculado <= 0) {
            throw new IllegalArgumentException(
                    "No se pudo calcular el total de la compra.");
        }

        /*
         * Verifica el total que mostró el checkout.
         * La base de datos sigue siendo la fuente del precio real.
         */
        if (totalRecibido == null
                || !Float.isFinite(totalRecibido)
                || Math.abs(totalCalculado - totalRecibido) > 0.02f) {
            throw new IllegalArgumentException(
                    "El precio de los productos cambió. "
                    + "Regresa al carrito y verifica el total.");
        }

        // Buscar al cliente por correo.
        Cliente cliente;
        Optional<Cliente> clienteExistente =
                clienteRepository.findByEmail(email.trim());

        if (clienteExistente.isPresent()) {
            cliente = clienteExistente.get();
            cliente.setNombre(nombre.trim());
            cliente.setTelefono(telefono.trim());
            cliente.setDireccion(direccion.trim());
        } else {
            cliente = new Cliente();
            cliente.setNombre(nombre.trim());
            cliente.setEmail(email.trim());
            cliente.setPassword(
                    java.util.UUID.randomUUID().toString());
            cliente.setRol("cliente");
            cliente.setTelefono(telefono.trim());
            cliente.setDireccion(direccion.trim());
            cliente.setFechaRegistro(
                    new Timestamp(System.currentTimeMillis()));
            cliente.setEstado("Activo");
        }

        cliente = clienteRepository.save(cliente);

        // Registrar el pedido.
        Pedido pedido = new Pedido();
        pedido.setFechaPedido(LocalDate.now());
        pedido.setEstadoPedido("Pendiente");
        pedido.setIdCliente(cliente.getIdCliente());

        Pedido pedidoGuardado = pedidoRepository.save(pedido);

        // Registrar los detalles del pedido.
        for (DetallePedido detalle : detalles) {
            detalle.setIdPedido(pedidoGuardado.getIdPedido());
        }

        detallePedidoRepository.saveAll(detalles);

        // Registrar la venta con el total calculado.
        Venta venta = new Venta();
        venta.setFechaVenta(LocalDate.now());
        venta.setIdCliente(cliente.getIdCliente());
        venta.setIdPedido(pedidoGuardado.getIdPedido());
        venta.setTotal(totalCalculado);

        Venta ventaGuardada = ventaRepository.save(venta);

        // Registrar el método de pago.
        MetodoPago metodoPago = new MetodoPago();
        metodoPago.setIdVenta(ventaGuardada.getIdVenta());
        metodoPago.setTipoPago(
                "contra_entrega".equals(tipoPago)
                        ? "Contra entrega" : "Transferencia");
        metodoPago.setMonto(totalCalculado);

        metodoPagoRepository.save(metodoPago);

        return pedidoGuardado;
    }
}
