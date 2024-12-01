import React, { useState } from 'react';
import axios from 'axios';
import logo from '../assets/logo.jpg';

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [gridSize, setGridSize] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent form submission
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', event.target.file.files[0]);
    formData.append('gridSize', gridSize); // Send the selected grid size to the backend

    try {
      await axios.post('http://localhost:8080/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setShowQR(true);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-orange-200 to-purple-300 flex flex-col gap-5 justify-center items-center p-5">
      <div className="max-w-2xl w-full bg-white p-10 rounded-lg shadow-lg">
      <img
          className="h-25 w-auto rounded-lg"
          src={logo}
          alt="SquareUp logo"
        />
        
        {!showQR ? (
          <>
          <h1 className="text-2xl font-semibold text-center text-gray-800 mb-8 mt-8">
          Upload an Image to Start the Collab!
        </h1>
            {/* Upload form */}
            <p className="text-lg text-gray-600 text-center mb-8">
            Upload an image and select the number of pieces to split it into. Your guests will get a QR code to replace a random piece with their own image, and together you'll create a unique mosaic!
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="file" className="block text-lg font-medium text-gray-700 mb-2">
                  Select an image to upload:
                </label>
                <input
                  type="file"
                  name="file"
                  accept="image/*"
                  required
                  className="block w-full text-sm text-gray-800 border border-gray-300 rounded-lg py-2 px-4"
                />
              </div>

              {/* Grid size selection buttons */}
              <div className="mb-6">
                <h2 className="text-lg font-medium text-gray-700 mb-4">
                  Select Grid Size:
                </h2>
                <div className="flex justify-center space-x-4">
                  {/* Grid size buttons */}
                  <button
                    type="button"  // Ensure this button doesn't submit the form
                    onClick={() => setGridSize(5)}
                    className={`px-4 py-2 rounded-lg ${gridSize === 5 ? 'bg-slate-950 text-white' : 'bg-gray-200'}`}
                  >
                    5x5 (25 photos)
                  </button>
                  <button
                    type="button"  // Ensure this button doesn't submit the form
                    onClick={() => setGridSize(10)}
                    className={`px-4 py-2 rounded-lg ${gridSize === 10 ? 'bg-slate-950 text-white' : 'bg-gray-200'}`}
                  >
                    10x10 (100 photos)
                  </button>
                  <button
                    type="button"  // Ensure this button doesn't submit the form
                    onClick={() => setGridSize(15)}
                    className={`px-4 py-2 rounded-lg ${gridSize === 15 ? 'bg-slate-950 text-white' : 'bg-gray-200'}`}
                  >
                    15x15 (225 photos)
                  </button>
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  disabled={isLoading || !gridSize} // Disable if grid size is not selected
                  className="w-full py-4 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-blue-300 mt-6"
                >
                  {isLoading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Scan QR Code to Start Contributing!
            </h2>
            <div className="p-4 bg-white rounded-lg shadow">
              <img 
                src="http://localhost:8080/generate_qr" 
                alt="QR Code"
                className="w-64 h-64"
              />
            </div>
            <p className="text-gray-600 text-center">
              Share this QR code with others to let them contribute their pieces!
            </p>
            <button
              onClick={() => setShowQR(false)}
              className="text-blue-500 hover:text-blue-700"
            >
              Upload Another Image
            </button>
          </div>
        )}

        <div className="mt-4 text-center">
          <a
            href="/composite"
            className="text-blue-500 hover:text-blue-700 font-medium"
          >
            See Live Composite Image
          </a>
        </div>
      </div>
    </div>
  );
};
  
export default Home;
