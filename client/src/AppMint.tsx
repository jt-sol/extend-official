import {Home} from "./components";

import {createTheme, ThemeProvider} from "@mui/material/styles";
import {
    CANDY_START_DATE,
} from "./constants";
import Header from "./components/Header/Header";
import CssBaseline from "@mui/material/CssBaseline";

import {useConnection} from "./contexts";

const startDateSeed = parseInt(CANDY_START_DATE, 10);

const txTimeout = 60000; // milliseconds (confirm this works for your project)

const theme = createTheme({
  palette: {
    mode: "dark",
  },
});

const AppMint = () => {
  const connection = useConnection();
  return (
    <div className="AppMint" style={{ backgroundColor: "transparent" }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Header />
        <Home
          connection={connection}
          startDate={startDateSeed}
          txTimeout={txTimeout}
        />
      </ThemeProvider>
    </div>
  );
};

export default AppMint;
