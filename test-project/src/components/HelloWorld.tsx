import React from 'react';

interface HelloWorldProps {
  name?: string;
  className?: string;
}

const HelloWorld: React.FC<HelloWorldProps> = ({ 
  name = 'World', 
  className = '' 
}) => {
  const handleClick = () => {
    console.log(`Hello, ${name}!`);
  };

  return (
    <div className={`hello-world ${className}`}>
      <h1>Hello, {name}!</h1>
      <p>This is a simple React component for testing code quality analysis.</p>
      <button 
        onClick={handleClick}
        type="button"
        aria-label={`Say hello to ${name}`}
      >
        Click me!
      </button>
    </div>
  );
};

export default HelloWorld;