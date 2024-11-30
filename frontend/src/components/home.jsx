import React, { useState } from 'react'
import axios from 'axios';

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('file', event.target.file.files[0]);

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
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-6">
      <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-semibold text-center text-gray-800 mb-4">
          Upload an Image to Start the Collaboration
        </h1>
        
        {!showQR ? (
          <>
            <p className="text-lg text-gray-600 text-center mb-6">
              Please upload the image that will be split into pieces for everyone to work on.
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

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-200 disabled:bg-blue-300"
                >
                  {isLoading ? 'Uploading...' : 'Upload Image'}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Scan QR Code to Start Contributing
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