
import { useCallback, useEffect, useMemo, useState } from 'react';
import './AdminClientes.css';

const API_CLIENTES = '/api/admin/clientes';

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

function formatearFecha(fecha) {
    if (!fecha) return 'No disponible';

    const valor = new Date(fecha);

    if (Number.isNaN(valor.getTime())) return 'No disponible';

    return valor.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

export default function AdminClientes() {
    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState('');
    const [mensaje, setMensaje] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [eliminando, setEliminando] = useState(null);
    const [clienteEditandoId, setClienteEditandoId] = useState(null);

    const [datosCliente, setDatosCliente] = useState({
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        estado: 'Activo'
    });

    const cargarClientes = useCallback(async () => {
        setCargando(true);
        setError('');

        try {
            const respuesta = await fetch(API_CLIENTES, {
                credentials: 'include',
                headers: {
                    Accept: 'application/json'
                }
            });

            const datos = await leerRespuesta(respuesta);

            setClientes(Array.isArray(datos) ? datos : []);
        } catch (err) {
            setError(err.message || 'No fue posible cargar los clientes.');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarClientes();
    }, [cargarClientes]);

    const clientesFiltrados = useMemo(() => {
        const termino = busqueda.trim().toLowerCase();

        if (!termino) return clientes;

        return clientes.filter(cliente =>
            String(cliente.nombre || '').toLowerCase().includes(termino) ||
            String(cliente.email || '').toLowerCase().includes(termino) ||
            String(cliente.idCliente || '').includes(termino)
        );
    }, [clientes, busqueda]);

    const manejarCambio = (e) => {
        const { name, value } = e.target;

        setDatosCliente(anterior => ({
            ...anterior,
            [name]: value
        }));
    };

    const editarCliente = (cliente) => {
        setClienteEditandoId(cliente.idCliente);

        setDatosCliente({
            nombre: cliente.nombre || '',
            email: cliente.email || '',
            telefono: cliente.telefono || '',
            direccion: cliente.direccion || '',
            estado: cliente.estado || 'Activo'
        });

        setMensaje('');
        setMostrarFormulario(true);
    };

    const guardarCliente = async (e) => {
        e.preventDefault();

        setGuardando(true);
        setMensaje('');

        try {
            const respuesta = await fetch(
                `${API_CLIENTES}/${clienteEditandoId}`,
                {
                    method: 'PUT',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json'
                    },
                    body: JSON.stringify(datosCliente)
                }
            );

            await leerRespuesta(respuesta);

            setMensaje('Cliente actualizado correctamente.');
            setMostrarFormulario(false);
            setClienteEditandoId(null);

            await cargarClientes();
        } catch (err) {
            setMensaje(err.message || 'No fue posible actualizar el cliente.');
        } finally {
            setGuardando(false);
        }
    };

    const eliminarCliente = async (id, nombre) => {
        const confirmar = window.confirm(
            `¿Estás seguro de eliminar al cliente "${nombre}"?`
        );

        if (!confirmar) return;

        setEliminando(id);
        setMensaje('');

        try {
            const respuesta = await fetch(`${API_CLIENTES}/${id}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: {
                    Accept: 'application/json'
                }
            });

            await leerRespuesta(respuesta);

            setMensaje('Cliente eliminado correctamente.');

            await cargarClientes();
        } catch (err) {
            setMensaje(err.message || 'No fue posible eliminar el cliente.');
        } finally {
            setEliminando(null);
        }
    };

    return (
        <main className="admin-clientes">

            <header className="admin-clientes-header">
                <div>
                    <p className="admin-clientes-eyebrow">
                        CAPILARDÍA / ADMINISTRACIÓN
                    </p>

                    <h1>Gestión de clientes</h1>

                    <p>Consulta y administra los clientes registrados en la tienda.</p>
                </div>

                <div className="admin-clientes-acciones">
                    <a href="/admin" className="admin-clientes-volver">
                        Volver al panel
                    </a>

                    <button
                        type="button"
                        className="admin-clientes-refresh"
                        onClick={cargarClientes}
                        disabled={cargando}
                    >
                        ↻ {cargando ? 'Actualizando...' : 'Actualizar clientes'}
                    </button>
                </div>
            </header>

            <section className="admin-clientes-resumen">
                <div>
                    <span>Clientes registrados</span>
                    <strong>{clientes.length}</strong>
                </div>

                <div>
                    <span>Clientes activos</span>
                    <strong>
                        {clientes.filter(c =>
                            String(c.estado || '').toLowerCase() === 'activo'
                        ).length}
                    </strong>
                </div>

                <div>
                    <span>Clientes inactivos</span>
                    <strong>
                        {clientes.filter(c =>
                            String(c.estado || '').toLowerCase() === 'inactivo'
                        ).length}
                    </strong>
                </div>
            </section>

            <section className="admin-clientes-panel">

                <div className="admin-clientes-panel-heading">
                    <div>
                        <h2>Clientes registrados</h2>
                        <p>Información de los clientes almacenada en la base de datos.</p>
                    </div>

                    <span>{clientesFiltrados.length} resultados</span>
                </div>

                <div className="admin-clientes-busqueda">
                    <input
                        type="search"
                        placeholder="Buscar por nombre, correo o número de cliente..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </div>

                {error && (
                    <div className="admin-clientes-error" role="alert">
                        <strong>No se pudieron cargar los clientes</strong>
                        <p>{error}</p>

                        <button type="button" onClick={cargarClientes}>
                            Reintentar
                        </button>
                    </div>
                )}

                {cargando && (
                    <p className="admin-clientes-mensaje">
                        Consultando clientes...
                    </p>
                )}

                {!cargando && !error && (
                    <div className="admin-clientes-tabla-wrapper">
                        <table className="admin-clientes-tabla">
                            <thead>
                                <tr>
                                    <th>Identificador</th>
                                    <th>Nombre</th>
                                    <th>Correo</th>
                                    <th>Teléfono</th>
                                    <th>Dirección</th>
                                    <th>Rol</th>
                                    <th>Estado</th>
                                    <th>Registro</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>

                            <tbody>
                                {clientesFiltrados.map(cliente => (
                                    <tr key={cliente.idCliente}>
                                        <td className="admin-clientes-id">
                                            #{cliente.idCliente}
                                        </td>

                                        <td className="admin-clientes-nombre">
                                            {cliente.nombre}
                                        </td>

                                        <td>{cliente.email}</td>

                                        <td>{cliente.telefono || 'No registrado'}</td>

                                        <td className="admin-clientes-direccion">
                                            {cliente.direccion || 'No registrada'}
                                        </td>

                                        <td>{cliente.rol || 'cliente'}</td>

                                        <td>
                                            <span className={
                                                String(cliente.estado || '').toLowerCase() === 'activo'
                                                    ? 'admin-clientes-estado activo'
                                                    : 'admin-clientes-estado inactivo'
                                            }>
                                                {cliente.estado || 'Sin estado'}
                                            </span>
                                        </td>

                                        <td>{formatearFecha(cliente.fechaRegistro)}</td>

                                        <td className="admin-clientes-acciones-fila">
                                            <button
                                                type="button"
                                                className="admin-clientes-editar"
                                                onClick={() => editarCliente(cliente)}
                                            >
                                                Editar
                                            </button>

                                            <button
                                                type="button"
                                                className="admin-clientes-eliminar"
                                                onClick={() => eliminarCliente(
                                                    cliente.idCliente,
                                                    cliente.nombre
                                                )}
                                                disabled={eliminando === cliente.idCliente}
                                            >
                                                {eliminando === cliente.idCliente
                                                    ? 'Eliminando...'
                                                    : 'Eliminar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {clientesFiltrados.length === 0 && (
                                    <tr>
                                        <td colSpan="9" className="admin-clientes-mensaje">
                                            No se encontraron clientes.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {mostrarFormulario && (
                <div className="admin-clientes-modal">
                    <form
                        className="admin-clientes-formulario"
                        onSubmit={guardarCliente}
                    >
                        <h2>Editar cliente</h2>

                        <label>Nombre completo</label>
                        <input
                            name="nombre"
                            value={datosCliente.nombre}
                            onChange={manejarCambio}
                            maxLength="100"
                            required
                        />

                        <label>Correo electrónico</label>
                        <input
                            type="email"
                            name="email"
                            value={datosCliente.email}
                            onChange={manejarCambio}
                            maxLength="100"
                            required
                        />

                        <label>Teléfono</label>
                        <input
                            name="telefono"
                            value={datosCliente.telefono}
                            onChange={manejarCambio}
                            maxLength="20"
                        />

                        <label>Dirección</label>
                        <input
                            name="direccion"
                            value={datosCliente.direccion}
                            onChange={manejarCambio}
                            maxLength="255"
                        />

                        <label>Estado</label>
                        <select
                            name="estado"
                            value={datosCliente.estado}
                            onChange={manejarCambio}
                            required
                        >
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                        </select>

                        <div className="admin-clientes-formulario-acciones">
                            <button
                                type="button"
                                onClick={() => setMostrarFormulario(false)}
                                disabled={guardando}
                            >
                                Cancelar
                            </button>

                            <button type="submit" disabled={guardando}>
                                {guardando ? 'Guardando...' : 'Actualizar cliente'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {mensaje && (
                <p className="admin-clientes-mensaje" role="status">
                    {mensaje}
                </p>
            )}

        </main>
    );
}
