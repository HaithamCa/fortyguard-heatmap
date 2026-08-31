import React from 'react'
import Dashboard from './pages/Dashboard'
import Landing from './pages/Landing'

export default function App() {
  const [started, setStarted] = React.useState(false);

  if (!started) {
    return <Landing onStart={() => setStarted(true)} />;
  }

  return <Dashboard />
}
