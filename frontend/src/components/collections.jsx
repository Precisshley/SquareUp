import { useState, useEffect } from 'react';
import axios from 'axios';

const Collections = () => {
  const [grid, setGrid] = useState(Array(3).fill(null).map(() => Array(3).fill(null)));

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const response = await axios.get('http://localhost:8080/pics');
        console.log('Response:', response.data);
        if (response.data.grid) {
          setGrid(response.data.grid);
        }
      } catch (error) {
        console.error('Error fetching images:', error);
      }
    };

    fetchImages();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Our Community Mosaic</h1>
        <p className="text-gray-600">A picture is worth a thousand words.</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {grid.map((row, rowIndex) => 
            row.map((item, colIndex) => (
              <div 
                key={`${rowIndex}-${colIndex}`}
                className="relative aspect-square transition-transform hover:scale-[1.02] duration-200"
              >
                {item ? (
                  <img
                    src={`http://localhost:8080/image/${item.Key.replace('uploads/', '')}`}
                    alt={`Community piece ${rowIndex}-${colIndex}`}
                    className="w-full h-full object-cover rounded-md shadow-sm"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center">
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