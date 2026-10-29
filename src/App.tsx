import React from 'react';
import { useProjectStore } from './store/projectStore';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';

const App: React.FC = () => {
  const { currentPage } = useProjectStore();

  return (
    <div className="app-container">
      {currentPage === 'dashboard' ? <Dashboard /> : <EditorPage />}
    </div>
  );
};

export default App;
