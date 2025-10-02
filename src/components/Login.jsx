import React, { useEffect, useState } from "react";
import { googleDriveAPI } from "../services/googleDriver";
import "./Login.css";

const Login = ({ onLogin }) => {
  const [initializing, setInitializing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = async () => {
      setInitializing(true);
      try {
        await googleDriveAPI.initialize();
        console.log('Google APIs initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Google APIs:', error);
        setError('Failed to initialize Google services');
      } finally {
        setInitializing(false);
      }
    };
    
    initializeAuth();
  }, []);

  const handleLogin = async () => {
    setError(null);
    try {
      await googleDriveAPI.authenticate();
      onLogin();
    } catch (error) {
      console.error('Login failed:', error);
      setError('Failed to authenticate. Please check your API configuration.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Iniciar Sesión en Google Drive</h2>
        <p>Conecta tu cuenta de Google Drive para ver tus archivos multimedia</p>
        
        {initializing && (
          <div className="loading">Initializing Google APIs...</div>
        )}
        
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        <button 
          onClick={handleLogin} 
          className="login-btn"
          disabled={initializing}
        >
          {initializing ? 'Initializing...' : 'Iniciar Sesión con Google'}
        </button>
        
        <div className="config-info">
          <h4>Configuración requerida:</h4>
          <ul>
            <li>✅ Cliente OAuth configurado en Google Cloud</li>
            <li>✅ API de Google Drive habilitada</li>
            <li>✅ URI de redirección: http://localhost:5173</li>
            <li>✅ Usuario de prueba agregado</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Login;