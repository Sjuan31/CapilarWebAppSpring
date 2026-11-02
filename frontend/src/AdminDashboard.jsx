import { useCallback, useEffect, useState } from 'react';
import './AdminDashboard.css';

const API_DASHBOARD = '/api/admin/dashboard';

function formatearPesos(valor) {
  return Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

function formatearFecha(fecha) {
  if (!fecha) return '—';

  return new Date(`${fecha}T00:00:00`).toLocaleDateString('es-CO');
}

async function leerRespuesta(respuesta) {
  const texto = await respuesta.text();
  let datos = {};

  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = { mensaje: texto };
    }
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error('Tu sesión no está activa. Inicia sesión nuevamente.');
    }
    if (respuesta.status === 403) {
      throw new Error('No tienes permisos de administrador para consultar este panel.');
    }

    throw new Error(
      datos.mensaje ||
      datos.message ||
      datos.detail ||
      datos.error ||
      `No fue posible cargar el panel (${respuesta.status}).`
    );
  }

  return datos;
}

function Icono({ tipo }) {
  const paths = {
    clientes: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1" /><path d="M16 5.5a3 3 0 0 1 0 5.8M18 14a5 5 0 0 1 3 4.5V20" /></>,
    productos: <><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></>,
    pedidos: <><path d="M4 4h16v16H4z" /><path d="M8 9h8M8 13h8M8 17h5" /></>,
    ventas: <><path d="M3 3v18h18" /><path d="m7 14 4-4 3 3 6-7" /></>,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="admin-stat-icon">
      {paths[tipo]}
    </svg>
  );
}

function TarjetaIndicador({ titulo, valor, tipo, detalle }) {
  return (
    <article className="admin-stat-card">
      <div className={`admin-stat-icon-wrap ${tipo}`}>
        <Icono tipo={tipo} />
      </div>
      <div className="admin-stat-copy">
        <p>{titulo}</p>
        <strong>{valor}</strong>
        <span>{detalle}</span>
      </div>
    </article>
  );
}


function GraficoVentas({
  ventas,
  cargando,
  error,
  reintentar
}) {
  const maximo = Math.max(
    ...ventas.map(item => Number(item.ventas) || 0),
    1
  );

  const formatoCompacto = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    notation: 'compact',
    maximumFractionDigits: 1
  });

  return (
    <section className="admin-chart-panel">

      <div className="admin-chart-heading">
        <div>
          <p className="admin-eyebrow">RENDIMIENTO COMERCIAL</p>
          <h2>Ventas mensuales</h2>
          <p>Comportamiento de las ventas durante los últimos seis meses.</p>
        </div>

        <span className="admin-chart-period">
          Últimos 6 meses
        </span>
      </div>

      {cargando ? (
        <p className="admin-loading">
          Consultando ventas...
        </p>
      ) : error ? (
        <div className="admin-chart-error" role="alert">
          <p>{error}</p>
          <button type="button" onClick={reintentar}>
            Reintentar
          </button>
        </div>
      ) : ventas.length === 0 ? (
        <p className="admin-chart-empty">
          No hay información de ventas disponible.
        </p>
      ) : (
        <div
          className="admin-chart"
          role="img"
          aria-label="Gráfico de barras de ventas mensuales"
        >
          {ventas.map((item, index) => {
            const valor = Number(item.ventas) || 0;

            const altura = valor > 0
              ? Math.max((valor / maximo) * 100, 3)
              : 0;

            return (
              <div
                className="admin-chart-column"
                key={`${item.mes}-${item.anio}-${index}`}
              >
                <div className="admin-chart-value">
                  {formatoCompacto.format(valor)}
                </div>

                <div className="admin-chart-bar-area">
                  <div
                    className="admin-chart-bar"
                    style={{ height: `${altura}%` }}
                    title={`${item.mes} ${item.anio}: ${formatearPesos(valor)}`}
                  />
                </div>

                <span className="admin-chart-month">
                  {item.mes}
                </span>

                <span className="admin-chart-year">
                  {item.anio}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div className="admin-chart-footer">
        <span>
          <i />
          Ventas registradas
        </span>
        <span>Fuente: MySQL · tienda_2</span>
      </div>

    </section>
  );
}


export default function AdminDashboard() {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [cargandoPedidos, setCargandoPedidos] = useState(true);
  const [errorPedidos, setErrorPedidos] = useState('');
  const [ventasMensuales, setVentasMensuales] = useState([]);
  const [cargandoVentas, setCargandoVentas] = useState(true);
  const [errorVentas, setErrorVentas] = useState('');                                                       

  const cargarDashboard = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const respuesta = await fetch(API_DASHBOARD, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      const resultado = await leerRespuesta(respuesta);
      setDatos(resultado);
    } catch (err) {
      setError(err.message || 'Ocurrió un error al cargar el Dashboard.');
      setDatos(null);
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarPedidosRecientes = useCallback(async () => {
    setCargandoPedidos(true);
    setErrorPedidos('');

      try {
        const respuesta = await fetch('/api/admin/pedidos-recientes', {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        const resultado = await leerRespuesta(respuesta);
        setPedidosRecientes(resultado);
      } catch (err) {
        setErrorPedidos(
          err.message || 'No fue posible consultar los pedidos recientes.'
        );
      } finally {
        setCargandoPedidos(false);
      }
    }, []);
  
const cargarVentasMensuales = useCallback(async () => {
  setCargandoVentas(true);
  setErrorVentas('');

  try {
    const respuesta = await fetch('/api/admin/ventas-mensuales', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    const resultado = await leerRespuesta(respuesta);

    setVentasMensuales(
      Array.isArray(resultado) ? resultado : []
    );

  } catch (err) {
    setErrorVentas(
      err.message || 'No fue posible consultar las ventas mensuales.'
    );
  } finally {
    setCargandoVentas(false);
  }
}, []);


  const actualizarPanel = useCallback(() => {
    cargarDashboard();
    cargarPedidosRecientes();
    cargarVentasMensuales();
  }, [
    cargarDashboard,
    cargarPedidosRecientes,
    cargarVentasMensuales
  ]);

  useEffect(() => {
      actualizarPanel();
    }, [actualizarPanel]);

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">
          <span className="admin-brand-mark">C</span>
          <span>CAPILARDÍA<small>Administración</small></span>
        </a>

        <p className="admin-menu-label">MENÚ PRINCIPAL</p>
        <nav className="admin-menu" aria-label="Menú administrativo">
          <a className="active" href="/admin" aria-current="page">
            <span>▦</span> Resumen
          </a>
          <a href="/admin/productos"><span>◇</span> Productos</a>
          <a href="/admin/pedidos"><span>▤</span> Pedidos</a>
          <a href="/admin/clientes"><span>♙</span> Clientes</a>
          <a href="/admin/categorias"><span>▧</span> Categorías</a>
        </nav>

        <div className="admin-sidebar-bottom">
          <a href="/"><span>↗</span> Volver a la tienda</a>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">CAPILARDÍA / ADMINISTRACIÓN</p>
            <h1>Panel de control</h1>
          </div>
          <button
            type="button"
            className="admin-refresh"
            onClick={actualizarPanel}
            disabled={cargando}
          >
            <span aria-hidden="true">↻</span>
            {cargando ? 'Actualizando...' : 'Actualizar datos'}
          </button>
        </header>

        <div className="admin-welcome">
          <div>
            <p className="admin-eyebrow">RESUMEN GENERAL</p>
            <h2>Tu negocio, de un vistazo.</h2>
            <p>Indicadores consultados directamente desde la base de datos.</p>
          </div>
          <div className="admin-welcome-decoration" aria-hidden="true">C.</div>
        </div>

        {error && (
          <div className="admin-alert" role="alert">
            <strong>No se pudo cargar el Dashboard</strong>
            <p>{error}</p>
            <button type="button" onClick={cargarDashboard}>Reintentar</button>
          </div>
        )}

        {cargando && !datos && !error && (
          <p className="admin-loading" role="status">Consultando información...</p>
        )}

        {datos && (
          <>
            <section className="admin-stats-grid" aria-label="Indicadores del negocio">
              <TarjetaIndicador
                titulo="Clientes registrados"
                valor={Number(datos.totalClientes || 0).toLocaleString('es-CO')}
                tipo="clientes"
                detalle="Registros en la tienda"
              />
              <TarjetaIndicador
                titulo="Productos"
                valor={Number(datos.totalProductos || 0).toLocaleString('es-CO')}
                tipo="productos"
                detalle="Productos registrados"
              />
              <TarjetaIndicador
                titulo="Pedidos"
                valor={Number(datos.totalPedidos || 0).toLocaleString('es-CO')}
                tipo="pedidos"
                detalle="Pedidos registrados"
              />
              <TarjetaIndicador
                titulo="Ventas acumuladas"
                valor={formatearPesos(datos.ventasTotales)}
                tipo="ventas"
                detalle="Total registrado en ventas"
              />
              <GraficoVentas
                ventas={ventasMensuales}
                cargando={cargandoVentas}
                error={errorVentas}
                reintentar={cargarVentasMensuales}
              />
            </section>

          
            <section className="admin-orders-panel">
              <div className="admin-orders-heading">
                <div>
                  <p className="admin-eyebrow">ACTIVIDAD RECIENTE</p>
                  <h2>Pedidos recientes</h2>
                  <p>Últimas compras registradas en CapilarDía.</p>
                </div>
                <span className="admin-orders-count">
                  {pedidosRecientes.length} pedidos
                </span>
              </div>

              {cargandoPedidos ? (
                <p className="admin-loading">Consultando pedidos...</p>
              ) : errorPedidos ? (
                <div className="admin-orders-error" role="alert">
                  {errorPedidos}
                  <button type="button" onClick={cargarPedidosRecientes}>
                    Reintentar
                  </button>
                </div>
              ) : pedidosRecientes.length === 0 ? (
                <p className="admin-orders-empty">
                  Todavía no hay pedidos registrados.
                </p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>Pedido</th>
                        <th>Cliente</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado</th>
                      </tr>
                    </thead>

                    <tbody>
                      {pedidosRecientes.map((pedido) => (
                        <tr key={pedido.idPedido}>
                          <td className="admin-order-id">
                            #{pedido.idPedido}
                          </td>

                          <td>{pedido.cliente}</td>

                          <td>{formatearFecha(pedido.fecha)}</td>

                          <td className="admin-order-total">
                            {formatearPesos(pedido.total)}
                          </td>

                          <td>
                            <span className="admin-order-status">
                              {pedido.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="admin-info-panel">
              <div className="admin-info-heading">
                <div>
                  <p className="admin-eyebrow">ESTADO DE LA CONEXIÓN</p>
                  <h2>Datos del negocio</h2>
                </div>
                <span className="admin-status">
                  <i /> Conectado
                </span>
              </div>

              <p>
                La información de clientes, productos, pedidos y ventas se está
                obteniendo del endpoint administrativo de Spring Boot.
              </p>
              <div className="admin-info-footer">
                <span>Fuente: MySQL · tienda_2</span>
                <span>API: GET /api/admin/dashboard</span>
              </div>
            </section>
          </>
        )}
      </section>
    </main>
  );
}
