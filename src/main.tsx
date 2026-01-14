import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'

// Configure Amplify BEFORE importing any components to avoid race conditions 
// where generateClient is called before the configuration is loaded.

// Use deep clone to ensure we can modify the configuration object
const finalOutputs = JSON.parse(JSON.stringify(outputs));

// Check for manual overrides from Amplify Hosting environment variables
const OVERRIDE_URL = import.meta.env.VITE_APP_SYNC_URL;
const OVERRIDE_KEY = import.meta.env.VITE_APP_SYNC_API_KEY;

if (finalOutputs.data) {
  if (OVERRIDE_URL) {
    console.log('Using manual AppSync URL override');
    finalOutputs.data.url = OVERRIDE_URL;
  }
  if (OVERRIDE_KEY) {
    console.log('Using manual API Key override');
    finalOutputs.data.api_key = OVERRIDE_KEY;
    // Force the default authorization type to API Key
    finalOutputs.data.default_authorization_type = 'API_KEY';
    // Ensure API_KEY is in the allowed types
    if (!finalOutputs.data.authorization_types.includes('API_KEY')) {
      finalOutputs.data.authorization_types.push('API_KEY');
    }
  }
}

console.log('Amplify Data Config:', finalOutputs.data);
console.log('Amplify Config Summary:', {
  hasData: !!finalOutputs.data,
  hasApiKey: !!finalOutputs.data?.api_key,
  region: finalOutputs.data?.aws_region,
  isOverridden: !!(OVERRIDE_URL || OVERRIDE_KEY),
  defaultAuth: finalOutputs.data?.default_authorization_type
});

Amplify.configure(finalOutputs)

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
