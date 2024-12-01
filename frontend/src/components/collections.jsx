import { useState, useEffect, lazy, Suspense } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

// Create a single socket instance with better error handling
let socket = null;
const initSocket = () => {
  if (socket?.connected) {
    return socket;
  }
  
  if (socket) {
    socket.close();
    socket = null;
  }

  socket = io(import.meta.env.VITE_API_URL, {
    withCredentials: true,
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    autoConnect: false,
    forceNew: true
  });

  return socket;
};

// Lazy load images that are not in the viewport
const LazyImage = lazy(() => import('./LazyImage'));

const Collections = () => {
  const [grid, setGrid] = useState([]);
  const [version, setVersion] = useState(Date.now());
  const [isConnected, setIsConnected] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/pics`);
        if (response.data.grid) {
          setGrid(response.data.grid);
          setVersion(Date.now());
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    const currentSocket = initSocket();

    // Define event handlers
    const onConnect = () => {
      console.log('Socket connected');
      setIsConnected(true);
      fetchImages();
    };

    const onDisconnect = (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    };

    const onGridUpdate = (data) => {
      console.log('Received grid update:', data);
      setGrid(data.grid);
      setVersion(Date.now());
    };

    const onError = (error) => {
      console.error('Socket error:', error);
      setIsConnected(false);
    };

    // Set up event listeners
    currentSocket.on('connect', onConnect);
    currentSocket.on('disconnect', onDisconnect);
    currentSocket.on('grid_update', onGridUpdate);
    currentSocket.on('error', onError);

    // Connect socket
    currentSocket.connect();

    // Initial fetch
    fetchImages();

    // Cleanup
    return () => {
      if (currentSocket) {
        currentSocket.off('connect', onConnect);
        currentSocket.off('disconnect', onDisconnect);
        currentSocket.off('grid_update', onGridUpdate);
        currentSocket.off('error', onError);
        currentSocket.disconnect();
      }
    };
  }, []); // Empty dependency array

  const handleDownloadCombined = async () => {
    try {
      setIsDownloading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/combined-image`, {
        responseType: 'blob',
        withCredentials: true
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'community-mosaic.png');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading combined image:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-200 to-purple-300 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Our Community Mosaic</h1>
          <p className="text-gray-600">A picture is worth a thousand words.</p>
          <button
            onClick={handleDownloadCombined}
            disabled={isDownloading}
            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200 disabled:bg-blue-300"
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </button>
        </div>

        <div className="relative mx-8 my-12">
          <div className="absolute -inset-4 bg-gradient-to-br from-amber-800/90 to-amber-950 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.4)]" />
          <div className="absolute -inset-[18px] bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg opacity-75 blur-[2px]" />
          <div className="absolute -inset-4 bg-[url('/wood-texture.jpg')] bg-repeat opacity-100 mix-blend-overlay rounded-lg" />
          <div className="absolute -inset-4 bg-gradient-to-br from-amber-100/10 to-amber-950/30 rounded-lg" />
          <div className="absolute inset-0 bg-black/5 rounded-sm" />
          
          <div className="absolute inset-0 shadow-inner rounded-sm" />
          <div className="absolute -inset-[1px] border border-amber-100/20 rounded-sm" />
          <div className="absolute -inset-[2px] border border-amber-950/30 rounded-sm" />
          
          <div className="absolute -inset-4 bg-gradient-to-tr from-transparent via-amber-100/10 to-transparent opacity-40" />
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-100/20 blur-md rounded-full mix-blend-overlay" />
          
          <div className="absolute -inset-4 translate-y-2 -z-10 bg-black/20 blur-xl rounded-lg" />

          <div className="relative bg-black/5 rounded-sm p-[1px]">
            <div className="grid" style={{ 
              gridTemplateColumns: `repeat(${grid.length}, 1fr)`,
              gap: '1px',
              background: 'rgba(0,0,0,0.1)',
            }}>
              {grid.map((row, rowIndex) => 
                row.map((item, colIndex) => (
                  <div 
                    key={`${rowIndex}-${colIndex}-${version}`}
                    className="relative aspect-square transition-transform hover:scale-[1.02] duration-200"
                  >
                    {item ? (
                      <Suspense fallback={
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                          <div className="animate-pulse bg-gray-200 w-full h-full" />
                        </div>
                      }>
                        <LazyImage
                          src={`${import.meta.env.VITE_API_URL}/image/${item.Key.replace('uploads/', '')}?v=${version}`}
                          alt={`Community piece ${rowIndex}-${colIndex}`}
                          className="w-full h-full object-cover rounded-[1px]"
                        />
                      </Suspense>
                    ) : (
                      <div className="w-full h-full bg-gray-100/90 border border-gray-300/30 flex items-center justify-center rounded-[1px]">
                        {/* Empty cell styling */}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Each piece represents a unique contribution from our community
        </p>
      </div>
    </div>
  );
};

export default Collections;