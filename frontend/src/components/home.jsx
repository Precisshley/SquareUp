import React from 'react'

const home = () => {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-6">
        <div className="max-w-2xl w-full bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-3xl font-semibold text-center text-gray-800 mb-4">
            Upload an Image to Start the Collaboration
          </h1>
          <p className="text-lg text-gray-600 text-center mb-6">
            Please upload the image that will be split into pieces for everyone to work on.
          </p>
  
          {/* Upload form */}
          <form action="/" method="post" encType="multipart/form-data" className="space-y-6">
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
                className="w-full py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition duration-200"
              >
                Upload Image
              </button>
            </div>
          </form>
  
          <p className="text-center text-gray-600 mt-6">
            Once the image is uploaded, you will be able to see the QR code to scan and submit pieces!
          </p>
  
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
  
  export default home;