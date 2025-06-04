/// <reference types="vinxi/types/client" />
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/react-start'
import { createRouter } from './router'

const router = createRouter()

const App = () => <StartClient router={router} />

hydrateRoot(document, <App />)

export default App
