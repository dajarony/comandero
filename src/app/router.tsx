import { createBrowserRouter, Navigate } from 'react-router-dom';

// Placeholder — routes will be added in Task 14 when all features are ready
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/mesas" replace /> },
  { path: '*', element: <div style={{ padding: 24, fontFamily: 'sans-serif' }}><h2>🚧 Cargando...</h2><p>Las pantallas se añaden en el siguiente paso.</p></div> },
]);
