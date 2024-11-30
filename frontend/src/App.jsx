import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider} from 'react-router-dom';
import { useState, useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import axios from "axios"

import Home from './components/home';
import Collections from './components/collections';


const router = createBrowserRouter(
  createRoutesFromElements(
  <Route path='/' element={<Collections/>}>
  </Route>
  )
);

const App = () => {
  return <RouterProvider router={router}/>;
}

// function App() {
//   const [count, setCount] = useState(0)

//   const fetchAPI = async () => {
//     try {
//       const response = await axios.get("http://127.0.0.1:8080/image/square_0_0.png", {
//         responseType: 'blob', // Ensure the response is treated as a binary blob
//       });
      
//       // Create an object URL from the blob and set it as the image source
//       const imageUrl = URL.createObjectURL(response.data);
//       setImageSrc(imageUrl);
//       console.log(response);
//     } catch (error) {
//       console.error('Error fetching image:', error);
//     }
//   };
  

//   useEffect(() => {
//     fetchAPI();
//   }, []);

//   const [imageSrc, setImageSrc] = useState(null);

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>

//       {imageSrc && <img src={imageSrc} alt="Fetched" />}
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

export default App
