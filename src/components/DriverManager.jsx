    import React, { useState, useEffect } from "react";
    import { googleDriveAPI } from "../services/googleDriver";
    import FileGrid from "./FileGrid";
    import Login from "./Login";
    import "./DriverManager.css";

    const DriveManager = () => {
    const [files, setFiles] = useState([]);
    const [filteredFiles, setFilteredFiles] = useState([]);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [apiInitialized, setApiInitialized] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    useEffect(() => {
        const initializeApp = async () => {
        await googleDriveAPI.initialize();
        setApiInitialized(true);
        
        const token = localStorage.getItem('googleDriveToken');
        if (token && await googleDriveAPI.validateToken()) {
            setIsAuthenticated(true);
            loadFiles();
        }
        };

        initializeApp();
    }, []);

    // Búsqueda en tiempo real mejorada
    useEffect(() => {
        const searchFiles = async () => {
        if (searchTerm.trim() === "") {
            setFilteredFiles(files);
            return;
        }

        setSearchLoading(true);
        try {
            // Si tenemos pocos archivos, buscar localmente
            if (files.length > 0 && files.length < 50) {
            const filtered = files.filter(file =>
                file.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredFiles(filtered);
            } else {
            // Si tenemos muchos archivos, buscar en la API
            const searchResults = await googleDriveAPI.searchFiles(searchTerm);
            setFilteredFiles(searchResults);
            }
        } catch (error) {
            console.error('Error searching files:', error);
            // Fallback a búsqueda local
            const filtered = files.filter(file =>
            file.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredFiles(filtered);
        }
        setSearchLoading(false);
        };

        // Debounce para no hacer muchas llamadas a la API
        const timeoutId = setTimeout(searchFiles, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, files]);

    const loadFiles = async () => {
        if (!apiInitialized) {
        console.log('API not initialized yet');
        return;
        }

        setLoading(true);
        try {
        const fileList = await googleDriveAPI.listFiles();
        setFiles(fileList);
        setFilteredFiles(fileList);
        console.log('Files loaded successfully:', fileList.length);
        } catch (error) {
        console.error('Error loading files:', error);
        if (error.message.includes('expired') || error.message.includes('login')) {
            handleLogout();
            alert('Sesión expirada. Por favor inicia sesión nuevamente.');
        }
        }
        setLoading(false);
    };

    const handleLogin = () => {
        setIsAuthenticated(true);
        setTimeout(() => {
        loadFiles();
        }, 1000);
    };

    const handleLogout = () => {
        localStorage.removeItem('googleDriveToken');
        setIsAuthenticated(false);
        setFiles([]);
        setFilteredFiles([]);
        setSearchTerm("");
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm("");
    };

    const retryLoadFiles = () => {
        loadFiles();
    };

    if (!isAuthenticated) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <div className="drive-manager">
        <div className="header">
            <div className="search-container">
            <div className="search-input-wrapper">
                <input
                type="text"
                placeholder="Buscar fotos, videos... (por nombre)"
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
                disabled={loading}
                />
                {searchTerm && (
                <button onClick={clearSearch} className="clear-search-btn">
                    ×
                </button>
                )}
            </div>
            <div className="search-stats">
                {searchLoading && <span>Buscando...</span>}
                {!searchLoading && searchTerm && (
                <span>
                    {filteredFiles.length} resultados para "{searchTerm}"
                </span>
                )}
                {!searchLoading && !searchTerm && files.length > 0 && (
                <span>{files.length} archivos en total</span>
                )}
            </div>
            </div>
            
            <div className="header-actions">
            <button onClick={retryLoadFiles} className="refresh-btn" disabled={loading}>
                {loading ? 'Cargando...' : 'Actualizar'}
            </button>
            <button onClick={handleLogout} className="logout-btn">
                Cerrar Sesión
            </button>
            </div>
        </div>

        {loading ? (
            <div className="loading">Cargando archivos...</div>
        ) : files.length === 0 ? (
            <div className="no-results">
            <p>No se encontraron archivos multimedia</p>
            <button onClick={retryLoadFiles} className="clear-search-link">
                Reintentar
            </button>
            </div>
        ) : filteredFiles.length === 0 && searchTerm ? (
            <div className="no-results">
            <p>No se encontraron resultados para "{searchTerm}"</p>
            <button onClick={clearSearch} className="clear-search-link">
                Mostrar todos los archivos
            </button>
            </div>
        ) : (
            <FileGrid files={filteredFiles} />
        )}
        </div>
    );
    };

    export default DriveManager;