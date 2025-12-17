import React from 'react';
import { useSession } from '../context/SessionContext';
import { useAuth } from '@clerk/clerk-react';

const SessionIndicator = () => {
  const { isActive, showWarning } = useSession();
  const { isSignedIn } = useAuth();

  if (!isSignedIn || showWarning) return null;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-2 h-2 rounded-full transition-colors ${
          isActive ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
        }`}
        title={isActive ? 'Session active' : 'Session inactive'}
      ></div>
    </div>
  );
};

export default SessionIndicator;






