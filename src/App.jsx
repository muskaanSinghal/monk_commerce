import ProductList from './components/ProductList';
import logo from "./assets/icons/icon-logo.svg";

import './App.css'

function App() {
  return (
    <>
      {/* App Header */}
      <div className={"header"}>
        <img className={"logo"} src={logo} />
        <h1>Monk Upsell & Cross-sell</h1>
      </div>
      {/* Main Component */}
      <ProductList />
    </>
  )
}

export default App
