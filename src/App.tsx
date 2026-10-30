import React from 'react';
import { useProjectStore } from './store/projectStore';
import Dashboard from './pages/Dashboard';
import EditorPage from './pages/EditorPage';

const App: React.FC = () => {
  const { currentPage } = useProjectStore();

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col">
      {currentPage === 'dashboard' ? <Dashboard /> : <EditorPage />}
    </div>
  );
};

export default App;
