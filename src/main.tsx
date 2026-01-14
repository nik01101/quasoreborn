import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'

// Configure Amplify BEFORE importing any components to avoid race conditions 
// where generateClient is called before the configuration is loaded.
console.log('Amplify Config:', {
  hasData: !!outputs.data,
  region: (outputs.data as any)?.aws_region,
  authMode: (outputs.data as any)?.default_authorization_type
});
Amplify.configure(outputs)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
