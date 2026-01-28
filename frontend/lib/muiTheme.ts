// Use node-specific entry to avoid ESM directory import issues on server
import { createTheme } from '@mui/material/node/styles'

// Use the same accent used in CSS :root
const theme = createTheme({
  palette: {
    primary: {
      main: '#1f7a8c'
    }
  },
  typography: {
    fontFamily: 'Roboto, Helvetica, Arial, sans-serif',
    h1: { fontFamily: 'Helvetica, Roboto, Arial, sans-serif' },
    h2: { fontFamily: 'Helvetica, Roboto, Arial, sans-serif' },
    h3: { fontFamily: 'Helvetica, Roboto, Arial, sans-serif' },
    h4: { fontFamily: 'Helvetica, Roboto, Arial, sans-serif' },
    h5: { fontFamily: 'Helvetica, Roboto, Arial, sans-serif' },
    h6: { fontFamily: 'Helvetica, Roboto, Arial, sans-serif' }
  }
})

export default theme
