import React from 'react'
import { DashboardPage } from './features/dashboard/ui/DashboardPage'
import './index.css'

function App() {
  return (
    <>
      {/* We'll add a minimal router later, for now just show Dashboard */}
      <DashboardPage />
    </>
  )
}

export default App
