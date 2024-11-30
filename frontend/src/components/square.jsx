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
    setFile(event.target.files[0]);
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
        // Extract row and column from position state
        // position format is like "Position: Row 1, Column 1"
        const positionMatch = position.match(/Row (\d+), Column (\d+)/);
        if (positionMatch) {
          const row = parseInt(positionMatch[1]) - 1; // Subtract 1 since display is 1-based but filename is 0-based
          const col = parseInt(positionMatch[2]) - 1;
          const imagePath = `square_${row}_${col}.png`;
          setUploadedImagePath(imagePath);
          console.log('Set uploaded image path to:', imagePath);
        }
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

//   if (!position || !piecePath) {
//     return <Navigate to="/" replace />;
//   }

  if (needsReset) {
    return (
      <div className="container">
        <h1>All Pieces Have Been Served!</h1>
        <p>Please upload a new image to start over:</p>
        <form onSubmit={handleReset} encType="multipart/form-data">
          <input 
            type="file" 
            name="file" 
            accept="image/*" 
            onChange={handleFileChange} 
            required 
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Uploading...' : 'Start New Game'}
          </button>
        </form>
      </div>
    );
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="container">
      <h1>Your Square</h1>
      {position && <p>{position}</p>}

      {piecePath && (
        <>
          <h2>Reference Image:</h2>
          <img
            src={`http://localhost:8080/piece/${piecePath}`}
            alt="Your piece"
            className="piece-image"
            onError={(e) => {
              console.error('Error loading image:', e);
              setError('Failed to load piece image');
            }}
          />
        </>
      )}

      {uploadedImagePath && (
        <>
          <h2>Your Uploaded Version:</h2>
          <img
            src={`http://localhost:8080/image/${uploadedImagePath}?t=${Date.now()}`}
            alt="Your uploaded version"
            className="piece-image"
          />
        </>
      )}

      <h2>Upload Your Version:</h2>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <input 
          type="file" 
          name="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          required 
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
};

export default Square; 