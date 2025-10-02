import { useState } from 'react'
import './App.css'
import DriveManager from './components/Drivermanager'

function App() {
  const [count, setCount] = useState(0)

  return (
        <div className="App">
      <header className="App-header">
        <h1>Google Drive Manager</h1>
      </header>
      <DriveManager />
    </div>
  )
}

export default App
