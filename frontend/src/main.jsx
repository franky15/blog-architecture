import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from './store'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Provider rend notre Cuisine Centrale (Store) accessible à tous les composants (Serveurs en salle) */}
    <Provider store={store}>
      {/* BrowserRouter nous permet de créer des routes (pages) dans l'application */}
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)

