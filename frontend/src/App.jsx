import { Route, createBrowserRouter, createRoutesFromElements, RouterProvider} from 'react-router-dom';

import MainLayout from './layouts/MainLayout';
import Home from './components/home';
import Collections from './components/collections';
import Square from './components/square';
import NotFoundPage from './components/NotFound';
import Loading from './components/loading';

const router = createBrowserRouter(
  createRoutesFromElements(
  <Route path='/' element={<MainLayout/>}>
  <Route index element={<Collections/>}/>
  <Route path='/home' element={<Home/>}/>
  <Route path='/image' element={<Square/>}/>
  <Route path='/loading' element={<Loading/>}/>
  <Route path='*' element={<NotFoundPage/>}/>
  </Route>
  )
);

const App = () => {
  return <RouterProvider router={router}/>;
}

export default App
