package com.mycompany.capilarwebapp.modelo;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * Representa un producto de la tienda CapilarDía.
 * Esta entidad se relaciona con la tabla producto de la base de datos.
 */
@Entity
@Table(name = "producto")
public class Producto {

    @Id
    private int idProducto;

    private String nombre;

    private float precio;

    private int stock;

    private String imagen;

    private int idCategoria;

    private int idFabricante;

    // Constructor vacío requerido por JPA
    public Producto() {
    }

    // Constructor con parámetros
    public Producto(int idProducto, String nombre, float precio, int stock,
            String imagen, int idCategoria, int idFabricante) {

        this.idProducto = idProducto;
        this.nombre = nombre;
        this.precio = precio;
        this.stock = stock;
        this.imagen = imagen;
        this.idCategoria = idCategoria;
        this.idFabricante = idFabricante;
    }

    public int getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(int idProducto) {
        this.idProducto = idProducto;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public float getPrecio() {
        return precio;
    }

    public void setPrecio(float precio) {
        this.precio = precio;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }

    public String getImagen() {
        return imagen;
    }

    public void setImagen(String imagen) {
        this.imagen = imagen;
    }

    public int getIdCategoria() {
        return idCategoria;
    }

    public void setIdCategoria(int idCategoria) {
        this.idCategoria = idCategoria;
    }

    public int getIdFabricante() {
        return idFabricante;
    }

    public void setIdFabricante(int idFabricante) {
        this.idFabricante = idFabricante;
    }

    @Override
    public String toString() {

        return "Producto{" +
                "idProducto=" + idProducto +
                ", nombre='" + nombre + '\'' +
                ", precio=" + precio +
                ", stock=" + stock +
                ", imagen='" + imagen + '\'' +
                ", idCategoria=" + idCategoria +
                ", idFabricante=" + idFabricante +
                '}';

    }
}