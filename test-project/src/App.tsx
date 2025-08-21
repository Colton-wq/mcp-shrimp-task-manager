import React from 'react';
import HelloWorld from './components/HelloWorld';
import './App.css';

const App: React.FC = () => {
  return (
    <div className="app">
      <header className="app-header">
        <HelloWorld name="React Developer" />
        <HelloWorld name="Code Quality Tester" className="secondary" />
      </header>
      <main className="app-main">
        <section>
          <h2>Code Quality Test Project</h2>
          <p>
            This project is designed to test the code quality analysis tool.
            It includes TypeScript, React components, and proper code structure.
          </p>
          <ul>
            <li>✅ TypeScript strict mode enabled</li>
            <li>✅ ESLint configuration active</li>
            <li>✅ React best practices followed</li>
            <li>✅ Proper component structure</li>
            <li>✅ Accessibility considerations</li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default App;