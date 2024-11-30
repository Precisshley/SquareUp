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
    <div className="container mx-auto max-w-[200px]">
      {/* <h1 className="text-2xl font-bold mb-4">Completed Squares</h1> */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '5px',
        }}
      >
        {grid.map((row, rowIndex) => 
          row.map((item, colIndex) => (
            <div 
              key={`${rowIndex}-${colIndex}`}
              style={{ aspectRatio: '1' }}
            >
              {item ? (
                <img
                  src={`http://localhost:8080/image/${item.Key.replace('uploads/', '')}`}
                  alt={`Square ${rowIndex}-${colIndex}`}
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div 
                  style={{
                    width: '200px',
                    height: '200px',
                    backgroundColor: '#f0f0f0'
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Collections;