import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth, useClerk } from '@clerk/clerk-react';
import { toast } from 'react-toastify';

const SessionContext = createContext();

export const useSession = () => useContext(SessionContext);

export const SessionProvider = ({ children }) => {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [isActive, setIsActive] = useState(true);
  
  // Configurable timeouts (in milliseconds)
  const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes of inactivity
  const MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours max session
  const WARNING_TIME = 2 * 60 * 1000; // Show warning 2 minutes before logout
  
  const inactivityTimerRef = useRef(null);
  const sessionTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const sessionStartTimeRef = useRef(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (!isSignedIn) return;

    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
    }

    setShowWarning(false);

    // Set warning timer (shows warning before logout)
    warningTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingTime(WARNING_TIME / 1000);
      toast.warning('You will be logged out due to inactivity in 2 minutes. Move your mouse or press a key to stay logged in.', {
        autoClose: false,
        toastId: 'inactivity-warning',
      });
    }, INACTIVITY_TIMEOUT - WARNING_TIME);

    // Set inactivity logout timer
    inactivityTimerRef.current = setTimeout(() => {
      handleSessionExpired('inactivity');
    }, INACTIVITY_TIMEOUT);
  };

  // Check if maximum session duration exceeded
  const checkMaxSessionDuration = () => {
    if (!isSignedIn) return;

    const sessionDuration = Date.now() - sessionStartTimeRef.current;
    
    if (sessionDuration >= MAX_SESSION_DURATION) {
      handleSessionExpired('max-duration');
    } else {
      // Check again in 1 minute
      sessionTimerRef.current = setTimeout(checkMaxSessionDuration, 60000);
    }
  };

  // Handle session expiration
  const handleSessionExpired = async (reason) => {
    try {
      await signOut();
      
      const messages = {
        'inactivity': 'You have been logged out due to inactivity for security reasons.',
        'max-duration': 'Your session has expired. Please log in again.',
        'tab-visibility': 'Your session was ended due to prolonged inactivity.',
      };
      
      toast.info(messages[reason] || 'Your session has expired.', {
        autoClose: 5000,
      });
      
      // Redirect to home
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Extend session (called when user dismisses warning)
  const extendSession = () => {
    setShowWarning(false);
    toast.dismiss('inactivity-warning');
    resetInactivityTimer();
  };

  // Activity event listeners
  useEffect(() => {
    if (!isSignedIn) return;

    const events = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => {
      setIsActive(true);
      resetInactivityTimer();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity);
    });

    // Initialize timers
    resetInactivityTimer();
    checkMaxSessionDuration();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [isSignedIn]);

  // Handle page visibility changes (tab switching, minimizing)
  useEffect(() => {
    if (!isSignedIn) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden - pause timers or be more aggressive
        setIsActive(false);
        
        // Optional: Immediately logout if tab is closed for security
        // Uncomment the line below for stricter security
        // handleSessionExpired('tab-visibility');
      } else {
        // Tab is visible again - reset timers
        setIsActive(true);
        resetInactivityTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isSignedIn]);

  // Countdown timer for warning
  useEffect(() => {
    if (!showWarning) return;

    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showWarning]);

  // Update session start time when user signs in
  useEffect(() => {
    if (isSignedIn) {
      sessionStartTimeRef.current = Date.now();
    }
  }, [isSignedIn]);

  const value = {
    isActive,
    showWarning,
    remainingTime,
    extendSession,
    INACTIVITY_TIMEOUT,
    MAX_SESSION_DURATION,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
      
      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <i className="ri-time-line text-white text-3xl"></i>
              </div>
              
              <h3 className="h3 text-white mb-2">Session Expiring Soon</h3>
              <p className="body text-white/80 mb-6">
                You will be automatically logged out in <span className="font-bold text-yellow-400">{Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}</span> due to inactivity.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={extendSession}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
                >
                  Stay Logged In
                </button>
                <button
                  onClick={() => handleSessionExpired('inactivity')}
                  className="flex-1 px-6 py-3 glass-light text-white rounded-xl font-semibold hover:bg-white/20 transition-all border border-white/20"
                >
                  Logout Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </SessionContext.Provider>
  );
};


