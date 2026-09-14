import * as React from 'react'
import { ChakraProvider } from '@chakra-ui/react'
import * as ReactDOM from 'react-dom/client'
import App from './App'
import "./index.css"
import { Provider } from 'react-redux'
import store from './redux/store'

// 👇 Only start MSW in development
// if (process.env.NODE_ENV === 'development') {
//   const { worker } = await import('./mocks/browser');
//   await worker.start();
// }

const rootElement = document.getElementById('root')
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <ChakraProvider>
          <App />
      </ChakraProvider>
    </Provider>
  </React.StrictMode>,
)
