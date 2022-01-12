import "./App.css";
import Header from "./components/Header/Header";
import {Screen} from "./components";
import {createTheme, ThemeProvider} from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useParams } from "react-router-dom";

function App() {
  const locator = useParams();
  const theme = createTheme({
    palette: {
      mode: "dark",
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            "&.Mui-disabled": {
              opacity: 0.6
            }
          }
        }
      }
    }
  });

  return (

    <div className="App" style={{ backgroundColor: "transparent" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Header />
        <Screen locator={locator}/>
      </ThemeProvider>
    </div>
  );
}

export default App;
