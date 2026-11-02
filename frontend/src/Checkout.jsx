
import { useEffect, useState } from 'react';
import './App.css';

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
      datos.message ||
      datos.detail ||
      datos.error ||
      `Error del servidor (${respuesta.status}).`
    );
  }

  return datos;
}

function Checkout() {
  const [carrito, setCarrito] = useState(carritoVacio);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  const [formulario, setFormulario] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    metodoPago: 'contra_entrega',
  });

  useEffect(() => {
    async function cargarCarrito() {
      try {
        const respuesta = await fetch('/api/carrito', {
          credentials: 'include',
          headers: { Accept: 'application/json' },
        });

        const datos = await leerRespuesta(respuesta);
        setCarrito(datos);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    }

    cargarCarrito();
  }, []);

  function actualizarCampo(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));
  }

  async function confirmarCompra(evento) {
    evento.preventDefault();

    if (procesando) return;

    setProcesando(true);
    setError('');

    try {
      const respuesta = await fetch('/api/checkout/confirmar', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(formulario),
      });

      const datos = await leerRespuesta(respuesta);

      setPedidoConfirmado(datos);

      setCarrito(carritoVacio);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) {
    return (
      <main className="checkout-contenedor">
        <p>Cargando información de tu pedido...</p>
      </main>
    );
  }

  if (pedidoConfirmado) {
    return (
      <main className="checkout-contenedor">
        <section className="checkout-confirmacion">
          <p className="etiqueta">CAPILARDÍA</p>
          <h1>¡Gracias por tu compra!</h1>
          <p>
            Tu pedido ha sido registrado correctamente.
          </p>

          <div className="checkout-confirmacion-dato">
            <span>Número de pedido</span>
            <strong>{pedidoConfirmado.idPedido}</strong>
          </div>

          <div className="checkout-confirmacion-dato">
            <span>Total de la compra</span>
            <strong>{formatearPrecio(pedidoConfirmado.total)}</strong>
          </div>

          <p>{pedidoConfirmado.mensaje}</p>

          <a className="boton-principal" href="/">
            Volver a la tienda
          </a>
        </section>
      </main>
    );
  }

  if (!carrito.items || carrito.items.length === 0) {
    return (
      <main className="checkout-contenedor">
        <section className="checkout-confirmacion">
          <h1>Tu carrito está vacío</h1>
          <p>Agrega productos antes de finalizar tu compra.</p>
          <a className="boton-principal" href="/">
            Volver a la tienda
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-pagina">
      <section className="checkout-banner">
        <p className="etiqueta">CAPILARDÍA</p>
        <h1>Finalizar compra</h1>
        <p>Completa tus datos para recibir tu pedido.</p>
      </section>

      <div className="checkout-contenedor">
        <a className="checkout-volver" href="/">
          ← Volver a la tienda
        </a>

        <div className="checkout-grid">

          <form
            className="checkout-formulario"
            onSubmit={confirmarCompra}
          >
            <h2>Información de entrega</h2>

            <label htmlFor="nombre">Nombre completo</label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Tu nombre completo"
              value={formulario.nombre}
              onChange={actualizarCampo}
              required
            />

            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="correo@ejemplo.com"
              value={formulario.email}
              onChange={actualizarCampo}
              required
            />

            <label htmlFor="telefono">Teléfono</label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              inputMode="numeric"
              maxLength="10"
              pattern="[0-9]{10}"
              placeholder="3001234567"
              value={formulario.telefono}
              onChange={actualizarCampo}
              required
            />
            <small>Ingresa un número celular de 10 dígitos.</small>

            <label htmlFor="direccion">Dirección de entrega</label>
            <textarea
              id="direccion"
              name="direccion"
              placeholder="Dirección completa, barrio y municipio"
              value={formulario.direccion}
              onChange={actualizarCampo}
              rows="4"
              required
            />

            <h2 className="checkout-subtitulo">
              Método de pago
            </h2>

            <label className="checkout-opcion-pago">
              <input
                type="radio"
                name="metodoPago"
                value="contra_entrega"
                checked={formulario.metodoPago === 'contra_entrega'}
                onChange={actualizarCampo}
              />
              Pago contra entrega
            </label>

            <label className="checkout-opcion-pago">
              <input
                type="radio"
                name="metodoPago"
                value="transferencia"
                checked={formulario.metodoPago === 'transferencia'}
                onChange={actualizarCampo}
              />
              Transferencia bancaria
            </label>

            {error && (
              <p className="checkout-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="checkout-boton-confirmar"
              type="submit"
              disabled={procesando}
            >
              {procesando
                ? 'Procesando compra...'
                : 'Confirmar pedido'}
            </button>

            <p className="checkout-seguridad">
              Tu pedido será validado antes de confirmar la compra.
            </p>
          </form>

          <aside className="checkout-resumen">
            <h2>Tu pedido</h2>

            {carrito.items.map((item) => (
              <article
                className="checkout-producto"
                key={item.idProducto}
              >
                <div>
                  <h3>{item.nombre}</h3>
                  <p>Cantidad: {item.cantidad}</p>
                </div>

                <strong>
                  {formatearPrecio(item.subtotal)}
                </strong>
              </article>
            ))}

            <div className="checkout-total-linea">
              <span>Subtotal</span>
              <span>{formatearPrecio(carrito.total)}</span>
            </div>

            <div className="checkout-total-linea">
              <span>Envío</span>
              <span>Por calcular</span>
            </div>

            <div className="checkout-total-final">
              <span>Total</span>
              <strong>{formatearPrecio(carrito.total)}</strong>
            </div>

            <p className="checkout-nota">
              El valor del pedido se valida con los precios
              vigentes de la base de datos al confirmar la compra.
              El envío se calcula por separado.
            </p>
          </aside>

        </div>
      </div>
    </main>
  );
}

export default Checkout;
