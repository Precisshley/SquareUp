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

  socket = io('http://localhost:8080', {
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
  const [grid, setGrid] = useState(Array(3).fill(null).map(() => Array(3).fill(null)));
  const [version, setVersion] = useState(Date.now());
  const [isConnected, setIsConnected] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get('http://localhost:8080/pics');
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
      const response = await axios.get('http://localhost:8080/combined-image', {
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
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Our Community Mosaic</h1>
        <p className="text-gray-600">A picture is worth a thousand words.</p>
        <button
          onClick={handleDownloadCombined}
          disabled={isDownloading}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors duration-200 disabled:bg-blue-300"
        >
          {isDownloading ? 'Downloading...' : 'Download Combined Image'}
        </button>
      </div>

      <div className="relative mx-8 my-12">
        <div className="absolute -inset-4 bg-amber-900/20 blur-md" />
        <div className="absolute -inset-4 bg-gradient-to-br from-amber-800 to-amber-950 rounded-lg shadow-[inset_0_2px_4px_rgba(255,255,255,0.1)]" />
        <div className="absolute -inset-2 border-2 border-amber-950/30 rounded-sm" />
        <div className="absolute -inset-4 bg-[url('/wood-texture.png')] opacity-30 mix-blend-overlay rounded-lg" />
        <div className="absolute -inset-1 border border-amber-100/10 rounded-sm" />
        <div className="absolute -inset-4 translate-y-1 -z-10 bg-black/20 blur-md" />

        <div className="grid grid-cols-3 relative z-10">
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
                      src={`http://localhost:8080/image/${item.Key.replace('uploads/', '')}?v=${version}`}
                      alt={`Community piece ${rowIndex}-${colIndex}`}
                      className="w-full h-full object-cover"
                    />
                  </Suspense>
                ) : (
                  <div className="w-full h-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">Awaiting contribution</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <p className="text-center text-gray-500 text-sm mt-6">
        Each piece represents a unique contribution from our team members
      </p>
    </div>
  );
};

export default Collections;