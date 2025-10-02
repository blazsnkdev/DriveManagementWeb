import React, { useState } from 'react';
import ReactPlayer from 'react-player';
import { googleDriveAPI } from '../services/googleDriver';
import './FileGrid.css';

const FileGrid = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const isImage = (mimeType) => mimeType && mimeType.startsWith('image/');
  const isVideo = (mimeType) => mimeType && mimeType.startsWith('video/');

  const openModal = (file) => {
    setSelectedFile(file);
    setIsVideoPlaying(false);
  };

  const closeModal = () => {
    setSelectedFile(null);
    setIsVideoPlaying(false);
  };

  const getFileType = (mimeType) => {
    if (isImage(mimeType)) return 'Imagen';
    if (isVideo(mimeType)) return 'Video';
    return 'Archivo';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES');
    } catch (error) {
      return dateString;
    }
  };

  // Función para forzar la descarga
  const handleDownload = async (file) => {
    try {
      const downloadUrl = googleDriveAPI.getDownloadUrl(file.id);
      
      // Crear un enlace temporal para descargar
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log('Descargando:', file.name);
    } catch (error) {
      console.error('Error al descargar:', error);
      // Fallback: abrir en nueva pestaña
      window.open(googleDriveAPI.getDownloadUrl(file.id), '_blank');
    }
  };

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
  };

  return (
    <div className="file-grid-container">
      <div className="file-grid-header">
        <span>{files.length} archivos encontrados</span>
      </div>
      
      <div className="file-grid">
        {files.map((file) => (
          <div 
            key={file.id} 
            className="file-item"
            onClick={() => openModal(file)}
          >
            {isImage(file.mimeType) && (
              <div className="file-thumbnail">
                <img 
                  src={googleDriveAPI.getFileUrl(file.id)} 
                  alt={file.name}
                  loading="lazy"
                  onError={(e) => {
                    // Si falla la miniatura, usar el enlace directo
                    e.target.src = googleDriveAPI.getDownloadUrl(file.id);
                  }}
                />
                <div className="file-type-badge image-badge">IMAGEN</div>
              </div>
            )}
            {isVideo(file.mimeType) && (
              <div className="file-thumbnail video-thumbnail">
                <div className="video-preview">
                  <img 
                    src={file.thumbnailLink || `/api/placeholder/200/150`}
                    alt={file.name}
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                  <div className="video-overlay">
                    <div className="play-button">▶</div>
                  </div>
                </div>
                <div className="file-type-badge video-badge">VIDEO</div>
              </div>
            )}
            {!isImage(file.mimeType) && !isVideo(file.mimeType) && (
              <div className="file-thumbnail unknown-thumbnail">
                <div className="file-icon">📄</div>
                <div className="file-type-badge unknown-badge">ARCHIVO</div>
              </div>
            )}
            <div className="file-info">
              <div className="file-name" title={file.name}>
                {file.name.length > 30 
                  ? file.name.substring(0, 30) + '...' 
                  : file.name
                }
              </div>
              <div className="file-meta">
                <span className="file-type">{getFileType(file.mimeType)}</span>
                {file.modifiedTime && (
                  <span className="file-date">
                    {formatDate(file.modifiedTime)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para visualización */}
      {selectedFile && (
        <div className="modal" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>×</button>
            
            <div className="modal-media-container">
              {isImage(selectedFile.mimeType) && (
                <img 
                  src={googleDriveAPI.getDownloadUrl(selectedFile.id)} 
                  alt={selectedFile.name}
                  className="modal-media"
                  onError={(e) => {
                    e.target.src = googleDriveAPI.getFileUrl(selectedFile.id);
                  }}
                />
              )}
              
              {isVideo(selectedFile.mimeType) && (
                <div className="video-container">
                  {!isVideoPlaying ? (
                    <div className="video-preview-modal" onClick={handleVideoPlay}>
                      <img 
                        src={selectedFile.thumbnailLink || googleDriveAPI.getFileUrl(selectedFile.id)}
                        alt={selectedFile.name}
                        className="video-poster"
                      />
                      <div className="video-play-overlay">
                        <div className="play-button-large">▶</div>
                        <p>Haz clic para reproducir</p>
                      </div>
                    </div>
                  ) : (
                    <ReactPlayer
                      url={googleDriveAPI.getDownloadUrl(selectedFile.id)}
                      controls={true}
                      width="100%"
                      height="100%"
                      playing={isVideoPlaying}
                      className="modal-video-player"
                    />
                  )}
                </div>
              )}
              
              {!isImage(selectedFile.mimeType) && !isVideo(selectedFile.mimeType) && (
                <div className="unknown-file-modal">
                  <div className="unknown-file-icon">📄</div>
                  <h3>Archivo no visualizable</h3>
                  <p>Este tipo de archivo no se puede previsualizar</p>
                </div>
              )}
            </div>
            
            <div className="file-info-modal">
              <h3>{selectedFile.name}</h3>
              <div className="file-details">
                <p><strong>Tipo:</strong> {getFileType(selectedFile.mimeType)}</p>
                {selectedFile.modifiedTime && (
                  <p><strong>Modificado:</strong> {formatDate(selectedFile.modifiedTime)}</p>
                )}
                {selectedFile.size && (
                  <p><strong>Tamaño:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                )}
              </div>
              <div className="modal-actions">
                <button 
                  onClick={() => handleDownload(selectedFile)}
                  className="download-btn"
                >
                  📥 Descargar
                </button>
                <a 
                  href={googleDriveAPI.getDownloadUrl(selectedFile.id)} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="open-btn"
                >
                  🔗 Abrir en nueva pestaña
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileGrid;