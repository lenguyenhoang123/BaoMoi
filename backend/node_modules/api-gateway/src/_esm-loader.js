// ESM loader for Node.js
import { pathToFileURL } from 'url';

// Get the current file URL
const baseURL = pathToFileURL(process.cwd() + '/').href;

// Load the module with the specified specifier
const loader = async (specifier, context, nextResolve) => {
  const { parentURL = baseURL } = context;
  
  // Handle TypeScript files
  if (specifier.endsWith('.ts') || specifier.endsWith('.tsx')) {
    return {
      shortCircuit: true,
      url: new URL(specifier, parentURL).href
    };
  }
  
  // Default handling
  return nextResolve(specifier);
};

export { loader };
