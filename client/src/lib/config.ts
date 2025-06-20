// Backend configuration for Vercel deployment
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://your-replit-app.repl.co';

// Helper function to construct API URLs
export function apiUrl(path: string): string {
  // If path already has a protocol, return as-is
  if (path.startsWith('http')) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
}