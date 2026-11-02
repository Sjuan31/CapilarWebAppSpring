
package com.mycompany.capilarwebapp.controller;

import com.mycompany.capilarwebapp.modelo.Pedido;
import com.mycompany.capilarwebapp.modelo.Cliente;
import com.mycompany.capilarwebapp.modelo.Venta;

import com.mycompany.capilarwebapp.repository.ClienteRepository;
import com.mycompany.capilarwebapp.repository.ProductoRepository;
import com.mycompany.capilarwebapp.repository.PedidoRepository;
import com.mycompany.capilarwebapp.repository.VentaRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Optional;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.capilarwebapp.modelo.Venta;
import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/admin")
public class AdminDashboardController {

    private final ClienteRepository clienteRepository;
    private final ProductoRepository productoRepository;
    private final PedidoRepository pedidoRepository;
    private final VentaRepository ventaRepository;

    public AdminDashboardController(
            ClienteRepository clienteRepository,
            ProductoRepository productoRepository,
            PedidoRepository pedidoRepository,
            VentaRepository ventaRepository) {

        this.clienteRepository = clienteRepository;
        this.productoRepository = productoRepository;
        this.pedidoRepository = pedidoRepository;
        this.ventaRepository = ventaRepository;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> obtenerDashboard() {

        Map<String, Object> datos = new HashMap<>();

        double ventasTotales = ventaRepository.findAll()
                .stream()
                .mapToDouble(venta -> venta.getTotal())
                .sum();

        datos.put("totalClientes", clienteRepository.count());
        datos.put("totalProductos", productoRepository.count());
        datos.put("totalPedidos", pedidoRepository.count());
        datos.put("ventasTotales", ventasTotales);

        return datos;
    }
    
    
    @GetMapping("/ventas-mensuales")
    public List<Map<String, Object>> obtenerVentasMensuales() {

        YearMonth mesActual = YearMonth.now();
        YearMonth primerMes = mesActual.minusMonths(5);

        Map<YearMonth, Double> ventasPorMes = new HashMap<>();

        // Inicializar los últimos seis meses en cero.
        for (int i = 0; i < 6; i++) {
            YearMonth mes = primerMes.plusMonths(i);
            ventasPorMes.put(mes, 0.0);
        }

        // Consultar las ventas registradas.
        List<Venta> ventas = ventaRepository.findAll();

        for (Venta venta : ventas) {

            if (venta.getFechaVenta() == null ||
                    venta.getTotal() == null) {
                continue;
            }

            YearMonth mesVenta = YearMonth.from(venta.getFechaVenta());

            if (ventasPorMes.containsKey(mesVenta)) {

                double acumulado = ventasPorMes.get(mesVenta);

                ventasPorMes.put(
                        mesVenta,
                        acumulado + venta.getTotal()
                );
            }
        }

        List<Map<String, Object>> resultado = new ArrayList<>();

        // Construir los datos para React.
        for (Map.Entry<YearMonth, Double> entrada :
                ventasPorMes.entrySet()) {

            YearMonth mes = entrada.getKey();

            String nombreMes = mes.getMonth()
                    .getDisplayName(
                            TextStyle.SHORT,
                            new Locale("es", "CO")
                    );

            nombreMes = nombreMes.substring(0, 1).toUpperCase()
                    + nombreMes.substring(1);

            Map<String, Object> datosMes = new HashMap<>();

            datosMes.put("mes", nombreMes);
            datosMes.put("anio", mes.getYear());
            datosMes.put("ventas", entrada.getValue());

            resultado.add(datosMes);
        }

        return resultado;
    }

    @GetMapping("/pedidos-recientes")
    public List<Map<String, Object>> obtenerPedidosRecientes() {

        List<Pedido> pedidos =
                pedidoRepository.findTop10ByOrderByFechaPedidoDescIdPedidoDesc();

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
}
