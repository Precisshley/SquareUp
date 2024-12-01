import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Navigate, useParams } from 'react-router-dom';

const Square = () => {
  const [position, setPosition] = useState(null);
  const [piecePath, setPiecePath] = useState(null);
  const [uploadedImagePath, setUploadedImagePath] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [needsReset, setNeedsReset] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { id } = useParams();

  // Add a ref to track if we've already fetched
  const hasFetched = React.useRef(false);

  useEffect(() => {
    const fetchSquareData = async () => {
      if (hasFetched.current) return;
      hasFetched.current = true;

      try {
        console.log('Fetching square data...');
        const response = await axios.get('http://localhost:8080/qrcode');
        console.log('Response:', response.data);
        
        const { position, piece_path } = response.data;
        setPosition(position);
        setPiecePath(piece_path);
      } catch (error) {
        console.error('Error fetching square data:', error);
        setError(error.message);
        if (error.response?.data?.error === 'all_pieces_served') {
          setNeedsReset(true);
        }
      }
    };

    fetchSquareData();
  }, []); 

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setShowConfirm(true);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewUrl(null);
    setShowConfirm(false);
  };

  const handleReset = async (event) => {
    event.preventDefault();
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://localhost:8080/reset', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // Clear the uploaded image path before reload
      setUploadedImagePath(null);
      window.location.reload();
    } catch (error) {
      console.error('Error resetting game:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) return;

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8080/qrcode', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log('Upload response:', response.data);
      
      if (response.data.success) {
        // Redirect to home page after successful upload
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.response?.data?.error === 'all_pieces_served') {
        setNeedsReset(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (needsReset) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-200 to-purple-300 py-8">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">All Pieces Have Been Served!</h1>
            <p className="text-gray-600 mb-6">Please upload a new image to start over:</p>
            <form onSubmit={handleReset} encType="multipart/form-data" className="space-y-4">
              <input 
                type="file" 
                name="file" 
                accept="image/*" 
                onChange={handleFileChange} 
                required 
                disabled={isLoading}
                className="block w-full text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition duration-200"
              />
              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-blue-300"
              >
                {isLoading ? 'Uploading...' : 'Start New Game'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-orange-200 to-purple-300 py-8">
        <div className="max-w-2xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">Error: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-200 to-purple-300 py-8">
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Let&apos;s Square Up!</h1>
          </div>

          {piecePath && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Here&apos;s your piece of the puzzle:</h2>
              <div className="border rounded-lg p-2 bg-gray-50">
                <img
                  src={`http://localhost:8080/piece/${piecePath}`}
                  alt="Your piece"
                  className="max-h-96 mx-auto object-contain"
                  onError={(e) => {
                    console.error('Error loading image:', e);
                    setError('Failed to load piece image');
                  }}
                />
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Now it&apos;s your turn! Recreate this image in your style:</h2>
            <form onSubmit={handleSubmit} encType="multipart/form-data">
              {!showConfirm ? (
                <input 
                  type="file" 
                  name="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  required 
                  disabled={isLoading}
                  className="block w-full text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition duration-200"
                />
              ) : (
                <div className="space-y-4">
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-h-96 mx-auto object-contain"
                    />
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-green-500 text-white font-semibold rounded-lg hover:bg-green-600 transition duration-200 disabled:bg-green-300"
                    >
                      {isLoading ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-6 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Square; 