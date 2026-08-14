package com.mycompany.capilarwebapp.service;

import com.mycompany.capilarwebapp.modelo.Fabricante;
import com.mycompany.capilarwebapp.repository.FabricanteRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;

/**
 * Lógica de negocio para los fabricantes.
 */
@Service
public class FabricanteService {

    private final FabricanteRepository fabricanteRepository;

    public FabricanteService(FabricanteRepository fabricanteRepository) {
        this.fabricanteRepository = fabricanteRepository;
    }

    public List<Fabricante> listarFabricantes() {
        return fabricanteRepository.findAll();
    }

    public Optional<Fabricante> buscarPorId(int id) {
        return fabricanteRepository.findById(id);
    }

    public Fabricante guardarFabricante(Fabricante fabricante) {
        return fabricanteRepository.save(fabricante);
    }

    public void eliminarFabricante(int id) {
        fabricanteRepository.deleteById(id);
    }
}