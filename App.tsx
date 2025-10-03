
import React from 'react';

// Define the types for our project structure
interface FileNode {
  name: string;
  children?: FileNode[];
}

// The data representing the project structure
const projectStructure: FileNode = {
  name: 'social-data-analyser/',
  children: [
    { name: '.env' },
    { name: 'package.json' },
    { name: 'server.js' },
    { name: 'index.html' },
    { name: 'index.tsx' },
    { name: 'App.tsx' },
    { name: 'metadata.json' },
    {
      name: 'routes/',
      children: [{ name: 'analysisRoutes.ts' }],
    },
    {
      name: 'controllers/',
      children: [{ name: 'analysisController.ts' }],
    },
    {
      name: 'services/',
      children: [{ name: 'githubService.ts' }, { name: 'redditService.ts' }],
    },
    {
      name: 'utils/',
      children: [{ name: 'apiClient.ts' }],
    },
  ],
};

// A recursive component to render the file tree
const TreeNode: React.FC<{ node: FileNode; level?: number }> = ({ node, level = 0 }) => {
  const isDirectory = node.children && node.children.length > 0;
  const isRoot = level === 0;

  return (
    <div style={{ marginLeft: isRoot ? 0 : '1rem' }}>
      <div className="flex items-center font-mono text-lg py-1">
        {!isRoot && (
          <span className="text-gray-600 mr-2">{isDirectory ? ' L' : ' |'}--</span>
        )}
         <span className={isDirectory ? "text-blue-400" : "text-gray-300"}>{node.name}</span>
      </div>
      {isDirectory && (
        <div>
          {node.children?.map((child, index) => (
            <TreeNode key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-8 w-full max-w-2xl border border-gray-700">
        <h1 className="text-3xl font-bold mb-2 text-center text-emerald-400">Project Structure Created</h1>
        <p className="text-gray-400 text-center mb-8">
          The following file structure has been generated with default boilerplate code.
        </p>
        <div className="bg-gray-900 p-6 rounded-md">
           <TreeNode node={projectStructure} />
        </div>
      </div>
    </div>
  );
};

export default App;
