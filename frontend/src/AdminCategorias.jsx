
import { useCallback, useEffect, useMemo, useState } from 'react';
import './AdminCategorias.css';

const API_CATEGORIAS = '/api/admin/categorias';

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

export default function AdminCategorias() {
    const [categorias, setCategorias] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [categoriaEditandoId, setCategoriaEditandoId] = useState(null);
    const [eliminando, setEliminando] = useState(null);

    const [nuevaCategoria, setNuevaCategoria] = useState({
        nombre: '',
        descripcion: ''
    });

    const cargarCategorias = useCallback(async () => {
        setCargando(true);
        setError('');

        try {
            const respuesta = await fetch(API_CATEGORIAS, {
                credentials: 'include',
                headers: {
                    Accept: 'application/json'
                }
            });

            const datos = await leerRespuesta(respuesta);

            setCategorias(Array.isArray(datos) ? datos : []);
        } catch (err) {
            setError(err.message || 'No fue posible cargar las categorías.');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarCategorias();
    }, [cargarCategorias]);

    const categoriasFiltradas = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        if (!termino) return categorias;

        return categorias.filter(categoria =>
            String(categoria.nombre || '').toLowerCase().includes(termino) ||
            String(categoria.idCategoria || '').includes(termino)
        );
    }, [categorias, busqueda]);

    const manejarCambio = (e) => {
        const { name, value } = e.target;

        setNuevaCategoria(anterior => ({
            ...anterior,
            [name]: value
        }));
    };

    const abrirFormularioNuevo = () => {
        setCategoriaEditandoId(null);
        setNuevaCategoria({
            nombre: '',
            descripcion: ''
        });
        setMensaje('');
        setMostrarFormulario(true);
    };

    const editarCategoria = (categoria) => {
        setCategoriaEditandoId(categoria.idCategoria);

        setNuevaCategoria({
            nombre: categoria.nombre || '',
            descripcion: categoria.descripcion || ''
        });

        setMensaje('');
        setMostrarFormulario(true);
    };

    const guardarCategoria = async (e) => {
        e.preventDefault();

        setGuardando(true);
        setMensaje('');

        try {
            const editando = categoriaEditandoId !== null;

            const respuesta = await fetch(
                editando
                    ? `${API_CATEGORIAS}/${categoriaEditandoId}`
                    : API_CATEGORIAS,
                {
                    method: editando ? 'PUT' : 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify({
                        idCategoria: editando ? categoriaEditandoId : 0,
                        nombre: nuevaCategoria.nombre.trim(),
                        descripcion: nuevaCategoria.descripcion.trim()
                    })
                }
            );

            await leerRespuesta(respuesta);

            setMensaje(
                editando
                    ? 'Categoría actualizada correctamente.'
                    : 'Categoría registrada correctamente.'
            );

            setMostrarFormulario(false);
            setCategoriaEditandoId(null);
            setNuevaCategoria({
                nombre: '',
                descripcion: ''
            });

            await cargarCategorias();
        } catch (err) {
            setMensaje(err.message || 'No fue posible guardar la categoría.');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarCategoria = async (id, nombre) => {
        const confirmar = window.confirm(
            `¿Estás seguro de eliminar la categoría "${nombre}"?`
        );

        if (!confirmar) return;

        setEliminando(id);
        setMensaje('');

        try {
            const respuesta = await fetch(`${API_CATEGORIAS}/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    Accept: 'application/json'
                }
            });

            await leerRespuesta(respuesta);

            setMensaje('Categoría eliminada correctamente.');

            await cargarCategorias();
        } catch (err) {
            setMensaje(err.message || 'No fue posible eliminar la categoría.');
        } finally {
            setEliminando(null);
        }
    };

    return (
        <main className="admin-categorias">

            <header className="admin-categorias-header">
                <div>
                    <p className="admin-categorias-eyebrow">
                        CAPILARDÍA / ADMINISTRACIÓN
                    </p>

                    <h1>Gestión de categorías</h1>

                    <p>Consulta y administra las categorías de la tienda.</p>
                </div>

                <div className="admin-categorias-acciones">
                    <a href="/admin" className="admin-categorias-volver">
                        Volver al panel
                    </a>

                    <button
                        type="button"
                        className="admin-categorias-refresh"
                        onClick={cargarCategorias}
                        disabled={cargando}
                    >
                        ↻ {cargando ? 'Actualizando...' : 'Actualizar categorías'}
                    </button>

                    <button
                        type="button"
                        className="admin-categorias-refresh"
                        onClick={abrirFormularioNuevo}
                    >
                        + Nueva categoría
                    </button>
                </div>
            </header>

            <section className="admin-categorias-resumen">
                <div>
                    <span>Categorías registradas</span>
                    <strong>{categorias.length}</strong>
                </div>

                <div>
                    <span>Categorías con descripción</span>
                    <strong>
                        {categorias.filter(c => String(c.descripcion || '').trim()).length}
                    </strong>
                </div>
            </section>

            <section className="admin-categorias-panel">

                <div className="admin-categorias-panel-heading">
                    <div>
                        <h2>Listado de categorías</h2>
                        <p>Categorías registradas en la base de datos.</p>
                    </div>

                    <span>{categoriasFiltradas.length} resultados</span>
                </div>

                <div className="admin-categorias-busqueda">
                    <input
                        type="search"
                        placeholder="Buscar por nombre o número de categoría..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="admin-categorias-error" role="alert">
                        <strong>No se pudieron cargar las categorías</strong>
                        <p>{error}</p>

                        <button type="button" onClick={cargarCategorias}>
                            Reintentar
                        </button>
                    </div>
                )}

                {cargando && (
                    <p className="admin-categorias-mensaje">
                        Consultando categorías...
                    </p>
                )}

                {!cargando && !error && (
                    <div className="admin-categorias-tabla-wrapper">
                        <table className="admin-categorias-tabla">
                            <thead>
                                <tr>
                                    <th>Identificador</th>
                                    <th>Nombre</th>
                                    <th>Descripción</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {categoriasFiltradas.map(categoria => (
                                    <tr key={categoria.idCategoria}>
                                        <td className="admin-categorias-id">
                                            #{categoria.idCategoria}
                                        </td>

                                        <td className="admin-categorias-nombre">
                                            {categoria.nombre}
                                        </td>

                                        <td className="admin-categorias-descripcion">
                                            {categoria.descripcion || 'Sin descripción'}
                                        </td>

                                        <td className="admin-categorias-acciones-fila">
                                            <button
                                                type="button"
                                                className="admin-categorias-editar"
                                                onClick={() => editarCategoria(categoria)}
                                            >
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                className="admin-categorias-eliminar"
                                                onClick={() => eliminarCategoria(
                                                    categoria.idCategoria,
                                                    categoria.nombre
                                                )}
                                                disabled={eliminando === categoria.idCategoria}
                                            >
                                                {eliminando === categoria.idCategoria
                                                    ? 'Eliminando...'
                                                    : 'Eliminar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {categoriasFiltradas.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="admin-categorias-mensaje">
                                            No se encontraron categorías.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {mostrarFormulario && (
                <div className="admin-categorias-modal">
                    <form
                        className="admin-categorias-formulario"
                        onSubmit={guardarCategoria}
                    >
                        <h2>
                            {categoriaEditandoId !== null
                                ? 'Editar categoría'
                                : 'Registrar categoría'}
                        </h2>

                        <label>Nombre de la categoría</label>
                        <input
                            name="nombre"
                            value={nuevaCategoria.nombre}
                            onChange={manejarCambio}
                            maxLength="50"
                            required
                        />

                        <label>Descripción</label>
                        <textarea
                            name="descripcion"
                            value={nuevaCategoria.descripcion}
                            onChange={manejarCambio}
                            rows="4"
                        />

                        <div className="admin-categorias-formulario-acciones">
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
                                    : categoriaEditandoId !== null
                                        ? 'Actualizar categoría'
                                        : 'Guardar categoría'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {mensaje && (
                <p className="admin-categorias-mensaje" role="status">
                    {mensaje}
                </p>
            )}

        </main>
    );
}
