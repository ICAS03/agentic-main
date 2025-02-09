import "../styles/globals.css";
import Web3ModalProvider from "../context/Web3Modal";

function App({ Component, pageProps }) {
  return (
    <Web3ModalProvider>
      <Component {...pageProps} />
    </Web3ModalProvider>
  );
}

export default App;
