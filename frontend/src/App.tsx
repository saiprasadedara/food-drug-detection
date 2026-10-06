import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AnalyzePage from './pages/AnalyzePage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/analyze" element={<AnalyzePage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}
