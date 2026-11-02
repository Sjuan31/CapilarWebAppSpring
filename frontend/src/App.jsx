
import { useCallback, useEffect, useState } from 'react';
import './App.css';
import './Carrito.css';
import Checkout from './Checkout';
import AdminDashboard from './AdminDashboard';
import AdminPedidos from './AdminPedidos';
import AdminProductos from './AdminProductos';
import AdminCategorias from './AdminCategorias';
import AdminClientes from './AdminClientes';

// Imágenes de los productos.
import shampooImg from './assets/productos/shampoo.png';
import acondicionadorImg from './assets/productos/acondicionador.png';
import tratamientoImg from './assets/productos/tratamiento.png';
import aceiteImg from './assets/productos/aceite.png';

// Imágenes de las categorías.
import categoriaShampoo from './assets/categorias/shampoo.png';
import categoriaAcondicionador from './assets/categorias/acondicionador.png';
import categoriaTratamientos from './assets/categorias/tratamiento.png';

// Imágenes de marca y banners.
import bannerPrincipal from './assets/banners/G10.png';
import bannerLinea from './assets/banners/G12.png';
import historiaMarca from './assets/marca/historia-capilar-dia.jpg';

const imagenesProductos = {
  'shampoo.png': shampooImg,
  'acondicionador.png': acondicionadorImg,
  'tratamiento.png': tratamientoImg,
  'aceite.png': aceiteImg,
};

const categorias = [
  { nombre: 'Shampoo', imagen: categoriaShampoo },
  { nombre: 'Acondicionadores', imagen: categoriaAcondicionador },
  { nombre: 'Tratamientos', imagen: categoriaTratamientos },
  { nombre: 'Aceites capilares', imagen: aceiteImg },
];

const nombresCategorias = {
  1: 'Limpieza capilar',
  2: 'Acondicionadores',
  3: 'Tratamientos',
  4: 'Nutrición capilar',
};

const carritoVacio = {
  items: [],
  cantidadTotal: 0,
  total: 0,
};

function formatearPrecio(precio) {
  return Number(precio || 0).toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

async function leerRespuesta(respuesta) {
  const texto = await respuesta.text();
  let datos = {};

  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = { message: texto };
    }
  }

  if (!respuesta.ok) {
    throw new Error(
      datos.mensaje ||
        datos.message ||
        datos.detail ||
        datos.error ||
        `Error del servidor (${respuesta.status}).`
    );
  }

  return datos;
}

// Ventana de inicio de sesión y registro.
function AuthPanel({ abierto, modo, cambiarModo, cerrar, autenticar, error, mensaje, procesando }) {
  const [formulario, setFormulario] = useState({ nombre: '', email: '', password: '', telefono: '', direccion: '' });

  useEffect(() => {
    if (abierto) setFormulario({ nombre: '', email: '', password: '', telefono: '', direccion: '' });
  }, [abierto, modo]);

  if (!abierto) return null;

  function actualizar(campo, valor) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function enviar(evento) {
    evento.preventDefault();
    autenticar(formulario);
  }

  return (
    <div role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) cerrar(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,.55)', display: 'grid', placeItems: 'center', padding: 16 }}>
      <section role="dialog" aria-modal="true" aria-labelledby="titulo-auth"
        style={{ background: '#fff', width: '100%', maxWidth: 430, maxHeight: '90vh', overflowY: 'auto', borderRadius: 16, padding: 28, position: 'relative', boxShadow: '0 15px 50px rgba(0,0,0,.2)' }}>
        <button type="button" onClick={cerrar} aria-label="Cerrar" style={{ position: 'absolute', top: 12, right: 16, border: 0, background: 'transparent', fontSize: 25, cursor: 'pointer' }}>×</button>
        <p style={{ color: '#e4843d', fontWeight: 700, letterSpacing: 1 }}>CAPILARDÍA</p>
        <h2 id="titulo-auth" style={{ marginTop: 4 }}>{modo === 'registro' ? 'Crear una cuenta' : 'Bienvenido de nuevo'}</h2>
        <p>{modo === 'registro' ? 'Regístrate para continuar con tus compras.' : 'Ingresa con tu correo y contraseña.'}</p>
        {mensaje && <p role="status" style={{ color: '#287a42' }}>{mensaje}</p>}
        {error && <p role="alert" style={{ color: '#b42318' }}>{error}</p>}
        <form onSubmit={enviar} style={{ display: 'grid', gap: 12 }}>
          {modo === 'registro' && <>
            <input required placeholder="Nombre completo" value={formulario.nombre} onChange={(e) => actualizar('nombre', e.target.value)} />
            <input required type="tel" placeholder="Teléfono" value={formulario.telefono} onChange={(e) => actualizar('telefono', e.target.value)} />
            <input required placeholder="Dirección" value={formulario.direccion} onChange={(e) => actualizar('direccion', e.target.value)} />
          </>}
          <input required type="email" autoComplete="email" placeholder="Correo electrónico" value={formulario.email} onChange={(e) => actualizar('email', e.target.value)} />
          <input required type="password" autoComplete={modo === 'registro' ? 'new-password' : 'current-password'} minLength={modo === 'registro' ? 8 : undefined} placeholder="Contraseña" value={formulario.password} onChange={(e) => actualizar('password', e.target.value)} />
          <button disabled={procesando} type="submit" style={{ border: 0, borderRadius: 8, padding: 13, background: '#e4843d', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            {procesando ? 'Procesando...' : modo === 'registro' ? 'Crear cuenta' : 'Iniciar sesión'}
          </button>
        </form>
        <p style={{ marginTop: 18, textAlign: 'center' }}>
          {modo === 'registro' ? '¿Ya tienes cuenta?' : '¿Aún no tienes cuenta?'}{' '}
          <button type="button" onClick={() => cambiarModo(modo === 'registro' ? 'login' : 'registro')} style={{ border: 0, background: 'none', color: '#b95d25', fontWeight: 700, cursor: 'pointer' }}>
            {modo === 'registro' ? 'Inicia sesión' : 'Regístrate'}
          </button>
        </p>
      </section>
    </div>
  );
}

// Encabezado de navegación.

function Header({
  cantidadCarrito,
  abrirCarrito,
  usuario,
  abrirAuth,
  cerrarSesion
}) {
  const esAdmin = ['ADMIN', 'ADMINISTRADOR'].includes(
    String(usuario?.rol || '').trim().toUpperCase()
  );

  return (
    <>
      <div className="barra-superior">
        Envíos a todo el país | Cuidado capilar para cada día
      </div>

      <header className="encabezado">

        {/* Información de soporte */}
        <div className="encabezado-utilidades">
          <span>Soporte al cliente</span>
          <span>Atención personalizada</span>
        </div>

        {/* Logotipo central */}
        <a
          className="logo"
          href="#inicio"
          aria-label="CapilarDía, inicio"
        >
          <span>CAPILARDÍA</span>
          <small>Belleza y cuidado profesional para tu cabello</small>
        </a>

        {/* Cuenta y carrito: lado derecho */}
        <div className="encabezado-acciones">

          <div className="cuenta-header">
            {usuario ? (
              <>
                <span className="saludo-usuario">
                  Hola, {usuario.nombre}
                </span>

                {esAdmin && (
                  <a
                    className="boton-admin-header"
                    href="/admin"
                  >
                    Panel administrativo ↗
                  </a>
                )}

                <button
                  className="boton-sesion-header"
                  type="button"
                  onClick={cerrarSesion}
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <button
                className="boton-sesion-header boton-ingresar-header"
                type="button"
                onClick={abrirAuth}
              >
                Iniciar sesión
              </button>
            )}
          </div>

          <button
            className="carrito carrito-abrir"
            type="button"
            onClick={abrirCarrito}
            aria-label={`Abrir carrito, ${cantidadCarrito} artículos`}
          >
            <span aria-hidden="true">♧</span>
            <span>Carrito</span>
            <span className="carrito-cantidad">
              {cantidadCarrito}
            </span>
          </button>

        </div>

        {/* Navegación */}
        <nav
          className="navegacion"
          aria-label="Navegación principal"
        >
          <a href="#inicio">Inicio</a>
          <a href="#productos">Productos</a>
          <a href="#categorias">Categorías</a>
          <a href="#nosotros">Nosotros</a>
          <a href="#contacto">Contacto</a>
        </nav>

      </header>
    </>
  );
}



// Banner principal.
function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-contenido">
        <p className="etiqueta">BELLEZA NATURAL</p>
        <h1>Belleza natural que se siente, se ve y se vive.</h1>
        <p className="hero-descripcion">
          Productos para cuidar, nutrir y realzar la belleza natural de tu cabello.
        </p>
        <a className="boton-principal" href="#productos">
          Explorar productos
        </a>
      </div>

      <div className="hero-fotografia">
        <img src={bannerPrincipal} alt="Colección CapilarDía" />
      </div>
    </section>
  );
}

// Categorías de la tienda.
function Categories() {
  return (
    <section className="categorias" id="categorias">
      <div className="seccion-encabezado">
        <p className="etiqueta">DESCUBRE TU RUTINA</p>
        <h2>Categorías principales</h2>
      </div>

      <div className="categorias-grid">
        {categorias.map((categoria) => (
          <a
            className="categoria-item"
            href="#productos"
            key={categoria.nombre}
          >
            <div className="categoria-circulo">
              <img
                src={categoria.imagen}
                alt={categoria.nombre}
                loading="lazy"
              />
            </div>
            <span>{categoria.nombre}</span>
          </a>
        ))}
      </div>
    </section>
  );
}

// Tarjeta individual de producto.
function ProductCard({ producto, agregarAlCarrito, agregando }) {
  const agotado = producto.stock <= 0;

  return (
    <article className="producto-card">
      <a className="producto-imagen" href="#productos">
        <img
          src={producto.imagen}
          alt={producto.alt}
          loading="lazy"
        />
      </a>

      <div className="producto-informacion">
        <p className="producto-categoria">{producto.categoria}</p>
        <h3>{producto.nombre}</h3>
        <p className="producto-precio">
          {formatearPrecio(producto.precio)}
        </p>

        <button
          className="boton-producto"
          type="button"
          onClick={() => agregarAlCarrito(producto)}
          disabled={agotado || agregando}
        >
          {agotado
            ? 'Agotado'
            : agregando
              ? 'Agregando...'
              : 'Agregar'}
        </button>
      </div>
    </article>
  );
}

// Catálogo de productos.
function ProductList({ productos, agregarAlCarrito, productoAgregando }) {
  return (
    <div className="productos-grid">
      {productos.map((producto) => (
        <ProductCard
          key={producto.id}
          producto={producto}
          agregarAlCarrito={agregarAlCarrito}
          agregando={productoAgregando === producto.id}
        />
      ))}
    </div>
  );
}

// Panel funcional del carrito.
function CartPanel({
  abierto,
  carrito,
  cerrarCarrito,
  quitarUnidad,
  agregarUnidad,
  vaciarCarrito,
  procesando,
  error,
}) {
  useEffect(() => {
    if (!abierto) return undefined;

    const cerrarConEscape = (evento) => {
      if (evento.key === 'Escape') cerrarCarrito();
    };

    document.addEventListener('keydown', cerrarConEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', cerrarConEscape);
      document.body.style.overflow = '';
    };
  }, [abierto, cerrarCarrito]);

  if (!abierto) return null;

  const items = Array.isArray(carrito?.items) ? carrito.items : [];

  return (
    <div
      className="carrito-fondo"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) cerrarCarrito();
      }}
    >
      <section
        className="carrito-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="carrito-titulo"
      >
        <div className="carrito-encabezado">
          <div>
            <p className="etiqueta">CAPILARDÍA</p>
            <h2 id="carrito-titulo">Tu carrito</h2>
          </div>

          <button
            type="button"
            className="carrito-cerrar"
            onClick={cerrarCarrito}
            aria-label="Cerrar carrito"
          >
            ×
          </button>
        </div>

        {error && <p className="carrito-error" role="alert">{error}</p>}

        {items.length === 0 ? (
          <div className="carrito-vacio">
            <p className="carrito-vacio-icono" aria-hidden="true">♧</p>
            <h3>Tu carrito está vacío</h3>
            <p>Descubre nuestros productos y encuentra tus favoritos.</p>
            <button
              type="button"
              className="boton-principal"
              onClick={cerrarCarrito}
            >
              Seguir explorando
            </button>
          </div>
        ) : (
          <>
            <div className="carrito-lista">
              {items.map((item) => {
                const imagen =
                  imagenesProductos[item.imagen] || shampooImg;

                return (
                  <article
                    className="carrito-item"
                    key={item.idProducto}
                  >
                    <img
                      className="carrito-item-imagen"
                      src={imagen}
                      alt={item.nombre}
                    />

                    <div className="carrito-item-info">
                      <h3>{item.nombre}</h3>
                      <p>{formatearPrecio(item.precio)} unidad</p>
                      <p>Cantidad: {item.cantidad}</p>
                      <strong>
                        {formatearPrecio(item.subtotal)}
                      </strong>

                      
                      <div className="carrito-acciones-cantidad">
                        <button
                          type="button"
                          className="carrito-quitar"
                          onClick={() => quitarUnidad(item.idProducto)}
                          disabled={procesando}
                        >
                          Quitar una unidad
                        </button>

                        <button
                          type="button"
                          className="carrito-agregar-unidad"
                          onClick={() => agregarUnidad(item.idProducto)}
                          disabled={procesando || item.cantidad >= item.stock}
                        >
                          Agregar una unidad
                        </button>
                      </div>

                    </div>
                  </article>
                );
              })}
            </div>

            <div className="carrito-resumen">
              <div className="carrito-total">
                <span>Productos</span>
                <span>{carrito.cantidadTotal || 0}</span>
              </div>

              <div className="carrito-total carrito-total-final">
                <span>Total</span>
                <strong>{formatearPrecio(carrito.total)}</strong>
              </div>

              <button
                type="button"
                className="boton-principal carrito-continuar"
                onClick={() => {
                  window.location.href = '/checkout';
                }}
              >
                Continuar con la compra
              </button>

              <button
                type="button"
                className="carrito-vaciar"
                onClick={vaciarCarrito}
                disabled={procesando}
              >
                {procesando ? 'Actualizando...' : 'Vaciar carrito'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// Historia de la marca.
function BrandStory() {
  return (
    <section className="historia" id="nosotros">
      <div className="historia-contenido">
        <p className="etiqueta">NUESTRA PROMESA</p>
        <h2>El cuidado de tu cabello empieza con una buena rutina.</h2>
        <p>
          En CapilarDía queremos acompañarte con productos para el
          cuidado capilar, pensados para que disfrutes tu rutina diaria.
        </p>
        <a className="boton-principal" href="#productos">
          Conoce nuestros productos
        </a>
      </div>

      <div className="historia-fotografia">
        <img
          src={historiaMarca}
          alt="Imagen editorial de la marca CapilarDía"
          loading="lazy"
        />
      </div>
    </section>
  );
}

// Franja promocional.
function FeaturedLine() {
  return (
    <section className="linea-destacada">
      <div className="linea-contenido">
        <p className="etiqueta">CUIDADO ESPECIALIZADO</p>
        <h2>Tu cabello merece una rutina extraordinaria.</h2>
        <p>
          Encuentra productos para nutrir, hidratar y cuidar tu cabello.
        </p>
        <a className="boton-principal" href="#productos">
          Ver productos
        </a>
      </div>

      <div className="linea-fotografia">
        <img
          src={bannerLinea}
          alt="Productos de la línea de cuidado capilar"
          loading="lazy"
        />
      </div>
    </section>
  );
}

// Pie de página.
function Footer() {
  return (
    <footer className="pie-pagina" id="contacto">
      <div className="pie-marca">
        <a className="logo" href="#inicio">CAPILARDÍA</a>
        <p>Belleza y cuidado profesional para tu cabello.</p>
      </div>

      <div>
        <h3>Productos</h3>
        <a href="#categorias">Línea capilar</a>
        <a href="#productos">Nuestros productos</a>
      </div>

      <div>
        <h3>Información</h3>
        <a href="#nosotros">Sobre nosotros</a>
        <a href="#contacto">Contacto</a>
      </div>

      <div>
        <h3>Ayuda</h3>
        <a href="#contacto">Atención al cliente</a>
        <a href="#contacto">Información de envíos</a>
      </div>

      <p className="pie-copyright">
        © 2026 CapilarDía. Todos los derechos reservados.
      </p>
    </footer>
  );
}

// Aplicación principal.
function App() {
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [errorProductos, setErrorProductos] = useState('');
  const [productoAgregando, setProductoAgregando] = useState(null);

  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [carrito, setCarrito] = useState(carritoVacio);
  const [cargandoCarrito, setCargandoCarrito] = useState(true);
  const [procesandoCarrito, setProcesandoCarrito] = useState(false);
  const [errorCarrito, setErrorCarrito] = useState('');

  const [usuario, setUsuario] = useState(null);
  const [authAbierto, setAuthAbierto] = useState(false);
  const [modoAuth, setModoAuth] = useState('login');
  const [errorAuth, setErrorAuth] = useState('');
  const [mensajeAuth, setMensajeAuth] = useState('');
  const [procesandoAuth, setProcesandoAuth] = useState(false);

  const cantidadCarrito = Number(carrito?.cantidadTotal || 0);

  const cargarCarrito = useCallback(async () => {
    const respuesta = await fetch('/api/carrito', {
      method: 'GET',
      credentials: 'include',
      headers: { Accept: 'application/json' },
    });

    const datos = await leerRespuesta(respuesta);
    setCarrito(datos);
    return datos;
  }, []);

  useEffect(() => {
    let activo = true;
    fetch('/api/auth/sesion', { credentials: 'include', headers: { Accept: 'application/json' } })
      .then(async (respuesta) => {
        if (respuesta.status === 401) return null;
        return leerRespuesta(respuesta);
      })
      .then((datos) => { if (activo && datos?.autenticado) setUsuario(datos); })
      .catch(() => { if (activo) setUsuario(null); });
    return () => { activo = false; };
  }, []);

  async function autenticar(formulario) {
    setProcesandoAuth(true);
    setErrorAuth('');
    setMensajeAuth('');
    const registro = modoAuth === 'registro';
    try {
      const respuesta = await fetch(registro ? '/api/auth/registro' : '/api/auth/login', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(registro ? {
          nombre: formulario.nombre.trim(), email: formulario.email.trim(), password: formulario.password,
          telefono: formulario.telefono.trim(), direccion: formulario.direccion.trim(),
        } : { email: formulario.email.trim(), password: formulario.password }),
      });
      const datos = await leerRespuesta(respuesta);
      if (registro) {
        setModoAuth('login');
        setMensajeAuth('Cuenta creada correctamente. Ahora inicia sesión.');
      } else {
        setUsuario(datos);
        setAuthAbierto(false);
        setMensajeAuth('');
        try { await cargarCarrito(); } catch (error) { setErrorCarrito(error.message); }
      }
    } catch (error) {
      setErrorAuth(error.message);
    } finally {
      setProcesandoAuth(false);
    }
  }

  async function cerrarSesion() {
    try {
      const respuesta = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', headers: { Accept: 'application/json' } });
      await leerRespuesta(respuesta);
      setUsuario(null);
      setCarrito(carritoVacio);
      setCarritoAbierto(false);
    } catch (error) {
      window.alert(error.message);
    }
  }

  function abrirAutenticacion() {
    setModoAuth('login');
    setErrorAuth('');
    setMensajeAuth('');
    setAuthAbierto(true);
  }

  useEffect(() => {
    let activo = true;

    async function cargarProductos() {
      try {
        const respuesta = await fetch('/api/productos', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        const datos = await leerRespuesta(respuesta);

        if (!Array.isArray(datos)) {
          throw new Error('La API no devolvió una lista de productos.');
        }

        const productosFormateados = datos.map((producto) => ({
          id: producto.idProducto,
          nombre: producto.nombre,
          categoria:
            nombresCategorias[producto.idCategoria] || 'Cuidado capilar',
          precio: producto.precio,
          stock: producto.stock,
          imagen: imagenesProductos[producto.imagen] || shampooImg,
          alt: producto.nombre,
        }));

        if (activo) setProductos(productosFormateados);
      } catch (error) {
        if (activo) setErrorProductos(error.message);
      } finally {
        if (activo) setCargandoProductos(false);
      }
    }

    cargarProductos();

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    let activo = true;

    async function iniciarCarrito() {
      try {
        const respuesta = await fetch('/api/carrito', {
          method: 'GET',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        const datos = await leerRespuesta(respuesta);

        if (activo) setCarrito(datos);
      } catch (error) {
        if (activo) setErrorCarrito(error.message);
      } finally {
        if (activo) setCargandoCarrito(false);
      }
    }

    iniciarCarrito();

    return () => {
      activo = false;
    };
  }, []);

  async function agregarAlCarrito(producto) {
    if (producto.stock <= 0 || productoAgregando !== null) return;

    setProductoAgregando(producto.id);
    setErrorCarrito('');

    try {
      const respuesta = await fetch(
        `/api/carrito/agregar/${producto.id}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }
      );

      const datos = await leerRespuesta(respuesta);
      setCarrito(datos);
    } catch (error) {
      setErrorCarrito(error.message);
      window.alert(error.message);
    } finally {
      setProductoAgregando(null);
    }
  }

  async function quitarUnidad(idProducto) {
    if (procesandoCarrito) return;

    setProcesandoCarrito(true);
    setErrorCarrito('');

    try {
      const respuesta = await fetch(
        `/api/carrito/eliminar/${idProducto}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }
      );

      const datos = await leerRespuesta(respuesta);
      setCarrito(datos);
    } catch (error) {
      setErrorCarrito(error.message);
    } finally {
      setProcesandoCarrito(false);
    }
  }

  
  async function agregarUnidad(idProducto) {
    if (procesandoCarrito) return;

    setProcesandoCarrito(true);
    setErrorCarrito('');

    try {
      const respuesta = await fetch(
        `/api/carrito/agregar/${idProducto}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: { Accept: 'application/json' },
        }
      );

      const datos = await leerRespuesta(respuesta);
      setCarrito(datos);
    } catch (error) {
      setErrorCarrito(error.message);
    } finally {
      setProcesandoCarrito(false);
    }
  }


  async function vaciarCarrito() {
    if (procesandoCarrito) return;

    setProcesandoCarrito(true);
    setErrorCarrito('');

    try {
      const respuesta = await fetch('/api/carrito/vaciar', {
        method: 'DELETE',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      const datos = await leerRespuesta(respuesta);
      setCarrito(datos);
    } catch (error) {
      setErrorCarrito(error.message);
    } finally {
      setProcesandoCarrito(false);
    }
  }

  const abrirCarrito = useCallback(() => {
    setCarritoAbierto(true);
    setErrorCarrito('');

    cargarCarrito().catch((error) => {
      setErrorCarrito(error.message);
    });
  }, [cargarCarrito]);

  const cerrarCarrito = useCallback(() => {
    setCarritoAbierto(false);
  }, []);

  
  // Detectar si el usuario está en el checkout
  if (window.location.pathname === '/checkout') {
    return <Checkout />;
  }

  if (window.location.pathname === '/admin/pedidos') {
    return <AdminPedidos />;
  }

  if (window.location.pathname === '/admin') {
    return <AdminDashboard />;
  }
  
  if (window.location.pathname === '/admin/productos') {
    return <AdminProductos />;
  }

  if (window.location.pathname === '/admin/categorias') {
    return <AdminCategorias />;
  }

  if (window.location.pathname === '/admin/clientes') {
      return <AdminClientes />;
  }

  return (
    <>
      <Header
        cantidadCarrito={cantidadCarrito}
        abrirCarrito={abrirCarrito}
        usuario={usuario}
        abrirAuth={abrirAutenticacion}
        cerrarSesion={cerrarSesion}
      />

      <AuthPanel
        abierto={authAbierto}
        modo={modoAuth}
        cambiarModo={(modo) => { setModoAuth(modo); setErrorAuth(''); setMensajeAuth(''); }}
        cerrar={() => setAuthAbierto(false)}
        autenticar={autenticar}
        error={errorAuth}
        mensaje={mensajeAuth}
        procesando={procesandoAuth}
      />

      <main>
        <Hero />
        <Categories />

        <section className="catalogo" id="productos">
          <div className="seccion-encabezado">
            <p className="etiqueta">NUESTRA SELECCIÓN</p>
            <h2>Nuestros cuatro productos</h2>
            <p>Encuentra tus aliados para una rutina capilar.</p>
          </div>

          {cargandoProductos && (
            <p role="status">Cargando productos...</p>
          )}

          {!cargandoProductos && errorProductos && (
            <p role="alert">{errorProductos}</p>
          )}

          {!cargandoProductos &&
            !errorProductos &&
            productos.length === 0 && (
              <p>No hay productos registrados en el catálogo.</p>
            )}

          {!cargandoProductos &&
            !errorProductos &&
            productos.length > 0 && (
              <ProductList
                productos={productos}
                agregarAlCarrito={agregarAlCarrito}
                productoAgregando={productoAgregando}
              />
            )}
        </section>

        <FeaturedLine />
        <BrandStory />
      </main>

      <Footer />

      <CartPanel
        abierto={carritoAbierto}
        carrito={carrito}
        cerrarCarrito={cerrarCarrito}
        quitarUnidad={quitarUnidad}
        agregarUnidad={agregarUnidad}
        vaciarCarrito={vaciarCarrito}
        procesando={procesandoCarrito || cargandoCarrito}
        error={errorCarrito}
      />
    </>
  );
}

export default App;
