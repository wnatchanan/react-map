import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import MapView from './components/MapView';
import MainPage from "./components/pages/MainPage";
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/map" element={<MapView />} />
        <Route path="*" element={<Navigate to="/home" />} />
        <Route path="/home" element={<MainPage />} />
      </Routes>
    </Router>
  );

}

export default App;
