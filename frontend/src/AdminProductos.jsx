
import { useCallback, useEffect, useMemo, useState } from 'react';
import './AdminProductos.css';

const API_PRODUCTOS = '/api/admin/productos';
const API_CATEGORIAS = '/api/admin/productos/categorias';
const API_FABRICANTES = '/api/admin/productos/fabricantes';

function formatearPesos(valor) {
  return Number(valor || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

async function leerRespuesta(respuesta) {
  const texto = await respuesta.text();
  let datos = [];

  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = { mensaje: texto };
    }
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error('La sesión no está activa. Inicia sesión nuevamente.');
    }

    if (respuesta.status === 403) {
      throw new Error('No tienes permisos de administrador.');
    }

    throw new Error(
      datos.mensaje ||
      datos.message ||
      datos.error ||
      `Error al consultar información (${respuesta.status}).`
    );
  }

  return datos;
}

export default function AdminProductos() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [fabricantes, setFabricantes] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [eliminando, setEliminando] = useState(null);
  const [productoEditandoId, setProductoEditandoId] = useState(null);

  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: '',
    precio: '',
    stock: '',
    imagen: '',
    idCategoria: '',
    idFabricante: '',
  });

  
  const cargarInformacion = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const [respuestaProductos, respuestaCategorias, respuestaFabricantes] =
        await Promise.all([
          fetch(API_PRODUCTOS, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
          }),
          fetch(API_CATEGORIAS, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
          }),
          fetch(API_FABRICANTES, {
            credentials: 'include',
            headers: { Accept: 'application/json' },
          }),
        ]);

      const [datosProductos, datosCategorias, datosFabricantes] =
        await Promise.all([
          leerRespuesta(respuestaProductos),
          leerRespuesta(respuestaCategorias),
          leerRespuesta(respuestaFabricantes),
        ]);

      setProductos(Array.isArray(datosProductos) ? datosProductos : []);
      setCategorias(Array.isArray(datosCategorias) ? datosCategorias : []);
      setFabricantes(Array.isArray(datosFabricantes) ? datosFabricantes : []);

    } catch (err) {
      setError(err.message || 'No fue posible cargar los productos.');
    } finally {
      setCargando(false);
    }
  }, []);

  const editarProducto = (producto) => {
    setProductoEditandoId(producto.idProducto);

    setNuevoProducto({
      nombre: producto.nombre || '',
      precio: producto.precio ?? '',
      stock: producto.stock ?? '',
      imagen: producto.imagen || '',
      idCategoria: producto.idCategoria ?? '',
      idFabricante: producto.idFabricante ?? '',
    });

    setMensaje('');
    setMostrarFormulario(true);
  };

  const manejarCambio = (e) => {
    const { name, value } = e.target;

    setNuevoProducto(anterior => ({
      ...anterior,
      [name]: value,
    }));
  };

  const guardarProducto = async (e) => {
    e.preventDefault();

    setGuardando(true);
    setMensaje('');

    try {
      const producto = {
        nombre: nuevoProducto.nombre,
        precio: Number(nuevoProducto.precio),
        stock: Number(nuevoProducto.stock),
        imagen: nuevoProducto.imagen,
        idCategoria: Number(nuevoProducto.idCategoria),
        idFabricante: Number(nuevoProducto.idFabricante),
      };

      const editando = productoEditandoId !== null;

      const respuesta = await fetch(
        editando
          ? `${API_PRODUCTOS}/${productoEditandoId}`
          : API_PRODUCTOS,
        {
          method: editando ? 'PUT' : 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(producto),
        }
      );

      await leerRespuesta(respuesta);

      setMensaje(
        editando
          ? 'Producto actualizado correctamente.'
          : 'Producto registrado correctamente.'
      );

      setNuevoProducto({
        nombre: '',
        precio: '',
        stock: '',
        imagen: '',
        idCategoria: '',
        idFabricante: '',
      });

      setProductoEditandoId(null);
      setMostrarFormulario(false);

      await cargarInformacion();

    } catch (error) {
      setMensaje(error.message || 'No fue posible guardar el producto.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminarProducto = async (idProducto, nombreProducto) => {
    const confirmar = window.confirm(
      `¿Estás seguro de eliminar el producto "${nombreProducto}"?`
    );

    if (!confirmar) return;

    setEliminando(idProducto);
    setMensaje('');

    try {
      const respuesta = await fetch(`${API_PRODUCTOS}/${idProducto}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
        },
      });

      await leerRespuesta(respuesta);

      setMensaje('Producto eliminado correctamente.');

      await cargarInformacion();

    } catch (error) {
      setMensaje(error.message || 'No fue posible eliminar el producto.');
    } finally {
      setEliminando(null);
    }
  };


  useEffect(() => {
    cargarInformacion();
  }, [cargarInformacion]);

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    if (!termino) return productos;

    return productos.filter(producto =>
      String(producto.nombre || '').toLowerCase().includes(termino) ||
      String(producto.idProducto || '').includes(termino)
    );
  }, [productos, busqueda]);

  return (
    <main className="admin-productos">

      <header className="admin-productos-header">
        <div>
          <p className="admin-productos-eyebrow">
            CAPILARDÍA / ADMINISTRACIÓN
          </p>

          <h1>Gestión de productos</h1>

          <p>Consulta y administra el catálogo de la tienda.</p>
        </div>

        <div className="admin-productos-acciones">
          <a href="/admin" className="admin-productos-volver">
            Volver al panel
          </a>

          <button
            type="button"
            className="admin-productos-refresh"
            onClick={cargarInformacion}
            disabled={cargando}
          >
            ↻ {cargando ? 'Actualizando...' : 'Actualizar productos'}
          </button>

          <button
            type="button"
            className="admin-productos-refresh"
            onClick={() => {
              setProductoEditandoId(null);
              setNuevoProducto({
                nombre: '',
                precio: '',
                stock: '',
                imagen: '',
                idCategoria: '',
                idFabricante: '',
              });
              setMensaje('');
              setMostrarFormulario(true);
            }}
          >
            + Nuevo producto
          </button>
        </div>
      </header>

      <section className="admin-productos-resumen">
        <div>
          <span>Productos registrados</span>
          <strong>{productos.length}</strong>
        </div>

        <div>
          <span>Categorías disponibles</span>
          <strong>{categorias.length}</strong>
        </div>

        <div>
          <span>Fabricantes registrados</span>
          <strong>{fabricantes.length}</strong>
        </div>

        <div>
          <span>Existencias totales</span>
          <strong>
            {productos.reduce(
              (total, producto) => total + Number(producto.stock || 0),
              0
            )}
          </strong>
        </div>
      </section>

      <section className="admin-productos-panel">

        <div className="admin-productos-panel-heading">
          <div>
            <h2>Catálogo de productos</h2>
            <p>Productos registrados en la base de datos.</p>
          </div>

          <span>{productosFiltrados.length} resultados</span>
        </div>

        <div className="admin-productos-busqueda">
          <input
            type="search"
            placeholder="Buscar por nombre o número de producto..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>

        {error && (
          <div className="admin-productos-error" role="alert">
            <strong>No se pudo cargar el catálogo</strong>
            <p>{error}</p>

            <button type="button" onClick={cargarInformacion}>
              Reintentar
            </button>
          </div>
        )}

        {cargando && (
          <p className="admin-productos-mensaje">
            Consultando productos...
          </p>
        )}

        {!cargando && !error && (
          <div className="admin-productos-tabla-wrapper">
            <table className="admin-productos-tabla">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Nombre</th>
                  <th>Precio</th>
                  <th>Existencias</th>
                  <th>Categoría</th>
                  <th>Fabricante</th>
                  <th>Acciones</th>
                  
                </tr>
              </thead>

              <tbody>
                {productosFiltrados.map(producto => {
                  const categoria = categorias.find(
                    item => Number(item.idCategoria) ===
                      Number(producto.idCategoria)
                  );

                  const fabricante = fabricantes.find(
                    item => Number(item.idFabricante) ===
                      Number(producto.idFabricante)
                  );  

                  return (
                    <tr key={producto.idProducto}>
                      <td className="admin-productos-id">
                        #{producto.idProducto}
                      </td>

                      <td className="admin-productos-nombre">
                        {producto.nombre}
                      </td>

                      <td className="admin-productos-precio">
                        {formatearPesos(producto.precio)}
                      </td>

                      <td>
                        <span className={
                          Number(producto.stock) > 0
                            ? 'admin-productos-stock disponible'
                            : 'admin-productos-stock agotado'
                        }>
                          {producto.stock}
                        </span>
                      </td>

                      <td>
                        {categoria?.nombre || `ID ${producto.idCategoria}`}
                      </td>

                      <td>
                        {fabricante?.nombre || `ID ${producto.idFabricante}`}
                      </td>

                      <td className="admin-productos-acciones-fila">
                        <button
                          type="button"
                          className="admin-productos-editar"
                          onClick={() => editarProducto(producto)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          onClick={() => eliminarProducto(producto.idProducto, producto.nombre)}
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {productosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan="7" className="admin-productos-mensaje">
                      No se encontraron productos.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </section>
        
        {mostrarFormulario && (
          <div className="admin-productos-modal">
            <form
              className="admin-productos-formulario"
              onSubmit={guardarProducto}
            >
              <h2>
                {productoEditandoId !== null
                  ? 'Editar producto'
                  : 'Registrar producto'}
              </h2>

              <label>Nombre del producto</label>
              <input
                name="nombre"
                value={nuevoProducto.nombre}
                onChange={manejarCambio}
                required
              />

              <label>Precio</label>
              <input
                type="number"
                name="precio"
                min="1"
                value={nuevoProducto.precio}
                onChange={manejarCambio}
                required
              />

              <label>Existencias</label>
              <input
                type="number"
                name="stock"
                min="0"
                value={nuevoProducto.stock}
                onChange={manejarCambio}
                required
              />

              <label>Imagen (ruta o nombre del archivo)</label>
              <input
                name="imagen"
                value={nuevoProducto.imagen}
                onChange={manejarCambio}
                placeholder="Ejemplo: shampoo.jpg"
              />

              <label>Categoría</label>
              <select
                name="idCategoria"
                value={nuevoProducto.idCategoria}
                onChange={manejarCambio}
                required
              >
                <option value="">Seleccionar categoría</option>
                {categorias.map(categoria => (
                  <option
                    key={categoria.idCategoria}
                    value={categoria.idCategoria}
                  >
                    {categoria.nombre}
                  </option>
                ))}
              </select>

              <label>Fabricante</label>
              <select
                name="idFabricante"
                value={nuevoProducto.idFabricante}
                onChange={manejarCambio}
                required
              >
                <option value="">Seleccionar fabricante</option>
                {fabricantes.map(fabricante => (
                  <option
                    key={fabricante.idFabricante}
                    value={fabricante.idFabricante}
                  >
                    {fabricante.nombre}
                  </option>
                ))}
              </select>

              <div className="admin-productos-formulario-acciones">
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button type="submit" disabled={guardando}>
                  {guardando
                    ? 'Guardando...'
                    : productoEditandoId !== null
                      ? 'Actualizar producto'
                      : 'Guardar producto'}
                </button>
              </div>
            </form>
          </div>
        )}

        {mensaje && (
          <p className="admin-productos-mensaje" role="status">
            {mensaje}
          </p>
        )}

    </main>
  );
}
