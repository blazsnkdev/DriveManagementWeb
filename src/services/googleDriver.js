const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

class GoogleDriveAPI {
  constructor() {
    this.tokenClient = null;
    this.gisInited = false;
  }

  // Solo necesitamos cargar Google Identity Services para la autenticación
  loadGis() {
    return new Promise((resolve) => {
      if (window.google && window.google.accounts) {
        this.gisInited = true;
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        this.gisInited = true;
        console.log('GIS initialized');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load Google Identity Services');
        resolve();
      };
      document.head.appendChild(script);
    });
  }

  async initialize() {
    await this.loadGis();
    console.log('GoogleDriveAPI initialized');
  }

  async authenticate() {
    if (!this.gisInited) {
      throw new Error('Google Identity Services not loaded');
    }

    return new Promise((resolve, reject) => {
      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
          if (response.error) {
            reject(response);
          } else {
            localStorage.setItem('googleDriveToken', response.access_token);
            resolve(response);
          }
        },
      });
      
      this.tokenClient.requestAccessToken();
    });
  }

  // Listar archivos usando Fetch API (más confiable)
  async listFiles() {
    const token = localStorage.getItem('googleDriveToken');
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        `pageSize=100&` +
        `fields=files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,createdTime,modifiedTime,size)&` +
        `q=${encodeURIComponent("mimeType contains 'image/' or mimeType contains 'video/'")}&` +
        `orderBy=modifiedTime desc`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expirado
          localStorage.removeItem('googleDriveToken');
          throw new Error('Session expired. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Files loaded via fetch:', data.files?.length || 0);
      return data.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  // Buscar archivos por nombre
  async searchFiles(searchTerm) {
    const token = localStorage.getItem('googleDriveToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const query = `name contains '${searchTerm}' and (mimeType contains 'image/' or mimeType contains 'video/')`;
      
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?` +
        `pageSize=100&` +
        `fields=files(id,name,mimeType,thumbnailLink,webContentLink,webViewLink,createdTime,modifiedTime,size)&` +
        `q=${encodeURIComponent(query)}&` +
        `orderBy=modifiedTime desc`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('Error searching files:', error);
      throw error;
    }
  }
getFileUrl(fileId) {
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
}

getDownloadUrl(fileId) {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

getEmbedUrl(fileId) {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}
  // Verificar si el token es válido
  async validateToken() {
    const token = localStorage.getItem('googleDriveToken');
    if (!token) return false;

    try {
      const response = await fetch(
        'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + token
      );
      return response.ok;
    } catch (error) {
      return false;
    }
  }
}

export const googleDriveAPI = new GoogleDriveAPI();