
import { useCallback, useEffect, useMemo, useState } from 'react';
import './AdminPedidos.css';

const API_PEDIDOS = '/api/admin/pedidos';

const ESTADOS = [
  'Pendiente',
  'En preparación',
  'Enviado',
  'Entregado',
  'Cancelado'
];

function formatearPesos(valor) {
  return Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
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
    throw new Error(
      datos.mensaje ||
      datos.message ||
      datos.error ||
      `Error del servidor (${respuesta.status}).`
    );
  }

  return datos;
}

export default function AdminPedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState('');

  const [actualizandoEstado, setActualizandoEstado] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [errorEstado, setErrorEstado] = useState('');

  const cargarPedidos = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const respuesta = await fetch(API_PEDIDOS, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });

      const datos = await leerRespuesta(respuesta);

      if (!Array.isArray(datos)) {
        throw new Error('La API no devolvió una lista de pedidos.');
      }

      setPedidos(datos);
    } catch (err) {
      setError(err.message || 'No fue posible consultar los pedidos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const pedidosFiltrados = useMemo(() => {
    return pedidos.filter((pedido) => {
      const texto = busqueda.trim().toLowerCase();

      const coincideBusqueda =
        !texto ||
        String(pedido.idPedido).includes(texto) ||
        String(pedido.cliente || '').toLowerCase().includes(texto);

      const coincideEstado =
        filtroEstado === 'Todos' ||
        pedido.estado === filtroEstado;

      return coincideBusqueda && coincideEstado;
    });
  }, [pedidos, busqueda, filtroEstado]);

  async function abrirDetalle(idPedido) {
    setPedidoSeleccionado(null);
    setCargandoDetalle(true);
    setErrorDetalle('');
    setMensaje('');
    setErrorEstado('');

    try {
      const respuesta = await fetch(`${API_PEDIDOS}/${idPedido}`, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' }
      });

      const datos = await leerRespuesta(respuesta);
      setPedidoSeleccionado(datos);
    } catch (err) {
      setErrorDetalle(err.message || 'No fue posible consultar el pedido.');
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function cambiarEstado(nuevoEstado) {
    if (!pedidoSeleccionado || actualizandoEstado) return;

    setActualizandoEstado(true);
    setMensaje('');
    setErrorEstado('');

    try {
      const respuesta = await fetch(
        `${API_PEDIDOS}/${pedidoSeleccionado.idPedido}/estado`,
        {
          method: 'PUT',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({ estado: nuevoEstado })
        }
      );

      const datos = await leerRespuesta(respuesta);

      setPedidoSeleccionado((anterior) => ({
        ...anterior,
        estado: datos.estado || nuevoEstado
      }));

      setMensaje(datos.mensaje || 'Estado actualizado correctamente.');

      await cargarPedidos();
    } catch (err) {
      setErrorEstado(err.message || 'No fue posible actualizar el estado.');
    } finally {
      setActualizandoEstado(false);
    }
  }

  function cerrarDetalle() {
    setPedidoSeleccionado(null);
    setErrorDetalle('');
    setMensaje('');
    setErrorEstado('');
  }

  return (
    <main className="admin-pedidos">

      <header className="admin-pedidos-header">
        <div>
          <p className="admin-pedidos-eyebrow">
            CAPILARDÍA / ADMINISTRACIÓN
          </p>
          <h1>Gestión de pedidos</h1>
          <p>Consulta las compras y administra sus estados.</p>
        </div>

        <button
          type="button"
          className="admin-pedidos-refresh"
          onClick={cargarPedidos}
          disabled={cargando}
        >
          ↻ {cargando ? 'Actualizando...' : 'Actualizar pedidos'}
        </button>
      </header>

      <section className="admin-pedidos-resumen">
        <div>
          <span>Total de pedidos</span>
          <strong>{pedidos.length}</strong>
        </div>

        <div>
          <span>Pendientes</span>
          <strong>
            {pedidos.filter(p => p.estado === 'Pendiente').length}
          </strong>
        </div>

        <div>
          <span>En preparación</span>
          <strong>
            {pedidos.filter(p => p.estado === 'En preparación').length}
          </strong>
        </div>

        <div>
          <span>Entregados</span>
          <strong>
            {pedidos.filter(p => p.estado === 'Entregado').length}
          </strong>
        </div>
      </section>

      <section className="admin-pedidos-panel">

        <div className="admin-pedidos-panel-heading">
          <div>
            <h2>Todos los pedidos</h2>
            <p>Listado de compras registradas en la tienda.</p>
          </div>

          <span>{pedidosFiltrados.length} resultados</span>
        </div>

        <div className="admin-pedidos-filtros">
          <input
            type="search"
            placeholder="Buscar por número o cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="Todos">Todos los estados</option>
            {ESTADOS.map(estado => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        {cargando ? (
          <p className="admin-pedidos-mensaje">
            Consultando pedidos...
          </p>
        ) : error ? (
          <div className="admin-pedidos-error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={cargarPedidos}>
              Reintentar
            </button>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <p className="admin-pedidos-mensaje">
            No se encontraron pedidos.
          </p>
        ) : (
          <div className="admin-pedidos-tabla-wrapper">
            <table className="admin-pedidos-tabla">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>

              <tbody>
                {pedidosFiltrados.map(pedido => (
                  <tr key={pedido.idPedido}>
                    <td className="admin-pedido-numero">
                      #{pedido.idPedido}
                    </td>
                    <td>{pedido.cliente}</td>
                    <td>{formatearFecha(pedido.fecha)}</td>
                    <td className="admin-pedido-total">
                      {formatearPesos(pedido.total)}
                    </td>
                    <td>
                      <span className={`admin-pedido-estado ${String(pedido.estado || '').toLowerCase().replaceAll(' ', '-')}`}>
                        {pedido.estado}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="admin-pedido-ver"
                        onClick={() => abrirDetalle(pedido.idPedido)}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {(cargandoDetalle || errorDetalle || pedidoSeleccionado) && (
        <div className="admin-pedido-modal-fondo">
          <section
            className="admin-pedido-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-pedido-modal-titulo"
          >
            <div className="admin-pedido-modal-header">
              <div>
                <p className="admin-pedidos-eyebrow">
                  INFORMACIÓN DE COMPRA
                </p>
                <h2 id="admin-pedido-modal-titulo">
                  Detalle del pedido
                </h2>
              </div>

              <button
                type="button"
                onClick={cerrarDetalle}
                aria-label="Cerrar detalle"
              >
                ×
              </button>
            </div>

            {cargandoDetalle ? (
              <p className="admin-pedidos-mensaje">
                Consultando detalle...
              </p>
            ) : errorDetalle ? (
              <div className="admin-pedidos-error" role="alert">
                {errorDetalle}
              </div>
            ) : pedidoSeleccionado && (
              <>
                <div className="admin-pedido-datos">
                  <div>
                    <span>Número de pedido</span>
                    <strong>#{pedidoSeleccionado.idPedido}</strong>
                  </div>

                  <div>
                    <span>Cliente</span>
                    <strong>{pedidoSeleccionado.cliente}</strong>
                  </div>

                  <div>
                    <span>Fecha</span>
                    <strong>{formatearFecha(pedidoSeleccionado.fecha)}</strong>
                  </div>

                  <div>
                    <span>Estado actual</span>
                    <strong>{pedidoSeleccionado.estado}</strong>
                  </div>
                </div>

                <h3 className="admin-pedido-productos-titulo">
                  Productos comprados
                </h3>

                <div className="admin-pedido-productos">
                  {(pedidoSeleccionado.productos || []).map((producto, index) => (
                    <article
                      className="admin-pedido-producto"
                      key={`${producto.idProducto}-${index}`}
                    >
                      <div>
                        <strong>{producto.nombre}</strong>
                        <span>
                          Cantidad: {producto.cantidad}
                        </span>
                      </div>

                      <div>
                        <span>
                          {formatearPesos(producto.precioUnitario)} unidad
                        </span>
                        <strong>
                          {formatearPesos(producto.subtotal)}
                        </strong>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="admin-pedido-total-final">
                  <span>Total de la compra</span>
                  <strong>
                    {formatearPesos(pedidoSeleccionado.total)}
                  </strong>
                </div>

                <div className="admin-pedido-cambiar-estado">
                  <label htmlFor="nuevo-estado">
                    Actualizar estado del pedido
                  </label>

                  <select
                    id="nuevo-estado"
                    value={pedidoSeleccionado.estado}
                    onChange={(e) => cambiarEstado(e.target.value)}
                    disabled={actualizandoEstado}
                  >
                    {ESTADOS.map(estado => (
                      <option key={estado} value={estado}>
                        {estado}
                      </option>
                    ))}
                  </select>

                  {actualizandoEstado && (
                    <p>Actualizando estado...</p>
                  )}

                  {mensaje && (
                    <p className="admin-pedido-exito" role="status">
                      {mensaje}
                    </p>
                  )}

                  {errorEstado && (
                    <p className="admin-pedido-error" role="alert">
                      {errorEstado}
                    </p>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
