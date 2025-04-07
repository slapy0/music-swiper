import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getStoredTokens, 
  getTokensFromUrl, 
  storeTokens, 
  clearTokens,
  getValidToken
} from '../lib/spotify';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      // Check if we're on the callback page
      const { access_token, refresh_token, expires_in } = getTokensFromUrl();
      
      if (access_token && refresh_token && expires_in) {
        // Store tokens from URL
        storeTokens(access_token, refresh_token, Number(expires_in));
        setIsAuthenticated(true);
        
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } else {
        // Check if we have stored tokens
        const { accessToken } = getStoredTokens();
        if (accessToken) {
          // Validate token
          const validToken = await getValidToken();
          setIsAuthenticated(!!validToken);
        }
      }
      
      setIsLoading(false);
    };
    
    initAuth();
  }, []);

  const login = () => {
    window.location.href = import.meta.env.VITE_API_URL + '/api/auth/login';
  };

  const logout = () => {
    clearTokens();
    setIsAuthenticated(false);
  };

  const getToken = async () => {
    return await getValidToken();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
