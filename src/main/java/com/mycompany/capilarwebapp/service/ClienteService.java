package com.mycompany.capilarwebapp.service;

import com.mycompany.capilarwebapp.modelo.Cliente;
import com.mycompany.capilarwebapp.repository.ClienteRepository;

import java.util.List;
import java.util.Optional;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public ClienteService(ClienteRepository clienteRepository) {
        this.clienteRepository = clienteRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    // LISTAR CLIENTES
    public List<Cliente> listarClientes() {
        return clienteRepository.findAll();
    }

    // BUSCAR CLIENTE POR ID
    public Optional<Cliente> buscarPorId(int id) {
        return clienteRepository.findById(id);
    }

    // BUSCAR CLIENTE POR CORREO
    public Optional<Cliente> buscarPorEmail(String email) {
        if (email == null || email.isBlank()) {
            return Optional.empty();
        }

        return clienteRepository.findByEmail(email.trim().toLowerCase());
    }

    // REGISTRAR CLIENTE
    @Transactional
    public Cliente registrarCliente(Cliente cliente) {

        if (cliente == null) {
            throw new IllegalArgumentException(
                "Los datos del usuario son obligatorios."
            );
        }

        if (cliente.getNombre() == null
                || cliente.getNombre().isBlank()) {
            throw new IllegalArgumentException(
                "El nombre es obligatorio."
            );
        }

        if (cliente.getEmail() == null
                || cliente.getEmail().isBlank()) {
            throw new IllegalArgumentException(
                "El correo electrónico es obligatorio."
            );
        }

        if (cliente.getPassword() == null
                || cliente.getPassword().length() < 8) {
            throw new IllegalArgumentException(
                "La contraseña debe tener mínimo 8 caracteres."
            );
        }

        String email = cliente.getEmail().trim().toLowerCase();

        if (clienteRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException(
                "Ya existe una cuenta registrada con ese correo."
            );
        }

        cliente.setEmail(email);

        // Las cuentas creadas desde el registro siempre serán clientes.
        cliente.setRol("cliente");
        cliente.setEstado("Activo");

        // Nunca guardar la contraseña sin protección.
        cliente.setPassword(
            passwordEncoder.encode(cliente.getPassword())
        );

        return clienteRepository.save(cliente);
    }

    // INICIAR SESIÓN
    @Transactional
    public Optional<Cliente> iniciarSesion(
            String email,
            String password) {

        if (email == null || email.isBlank()
                || password == null || password.isBlank()) {
            return Optional.empty();
        }

        Optional<Cliente> resultado =
                clienteRepository.findByEmail(
                    email.trim().toLowerCase()
                );

        if (resultado.isEmpty()) {
            return Optional.empty();
        }

        Cliente cliente = resultado.get();

        if (!"Activo".equalsIgnoreCase(cliente.getEstado())) {
            return Optional.empty();
        }

        String passwordGuardada = cliente.getPassword();

        if (passwordGuardada == null) {
            return Optional.empty();
        }

        boolean coincide;

        // Contraseñas que ya están protegidas con BCrypt.
        if (passwordGuardada.startsWith("$2a$")
                || passwordGuardada.startsWith("$2b$")
                || passwordGuardada.startsWith("$2y$")) {

            coincide = passwordEncoder.matches(
                password,
                passwordGuardada
            );

        } else {
            // Compatibilidad temporal con contraseñas antiguas
            // que estaban guardadas como texto sin cifrar.
            coincide = password.equals(passwordGuardada);

            // Si coincide, actualizar inmediatamente a BCrypt.
            if (coincide) {
                cliente.setPassword(
                    passwordEncoder.encode(password)
                );

                clienteRepository.save(cliente);
            }
        }

        if (!coincide) {
            return Optional.empty();
        }

        return Optional.of(cliente);
    }

    // GUARDAR CLIENTE
    public Cliente guardarCliente(Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    // ELIMINAR CLIENTE
    public void eliminarCliente(int id) {
        clienteRepository.deleteById(id);
    }
}