/**
 * @module main
 * @description Punto de entrada React — monta RouterProvider
 * SUME Docblock v2.0
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from './app/router'
import { syncManager } from './core/api/syncManager'
import './index.css'

// Inicializar motor de sincronización (Modo Offline)
syncManager.initializeSyncListeners();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster position="top-center" reverseOrder={false} />
    <RouterProvider router={router} />
  </StrictMode>,
)
