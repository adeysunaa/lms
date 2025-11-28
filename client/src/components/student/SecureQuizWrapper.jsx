import React, { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';

const SecureQuizWrapper = ({ children, isActive = true }) => {
  const containerRef = useRef(null);
  const tabSwitchCountRef = useRef(0);

  useEffect(() => {
    if (!isActive) return;

    // Disable text selection
    const disableSelection = (e) => {
      e.preventDefault();
      return false;
    };

    // Disable right-click context menu
    const disableContextMenu = (e) => {
      e.preventDefault();
      toast.warning('Right-click is disabled during the exam');
      return false;
    };

    // Block keyboard shortcuts
    const blockShortcuts = (e) => {
      // Block Ctrl+C, Ctrl+V, Ctrl+A, Ctrl+X, Ctrl+S, Ctrl+P, F12, Print Screen
      if (
        (e.ctrlKey && ['c', 'v', 'a', 'x', 's', 'p'].includes(e.key.toLowerCase())) ||
        e.key === 'F12' ||
        e.key === 'PrintScreen' ||
        (e.shiftKey && e.key === 'F12')
      ) {
        e.preventDefault();
        toast.warning('This action is not allowed during the exam');
        return false;
      }
      
      // Block Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        toast.warning('Developer tools are disabled during the exam');
        return false;
      }
    };

    // Detect tab/window switching
    const handleVisibilityChange = () => {
      if (document.hidden) {
        tabSwitchCountRef.current += 1;
        if (tabSwitchCountRef.current === 1) {
          toast.warning('Please stay on this page during the exam');
        } else if (tabSwitchCountRef.current >= 3) {
          toast.error('Multiple tab switches detected. Your exam may be flagged.');
        }
      }
    };

    // Block drag and drop
    const blockDragDrop = (e) => {
      e.preventDefault();
      return false;
    };

    // Block copy event
    const blockCopy = (e) => {
      e.preventDefault();
      toast.warning('Copying is not allowed during the exam');
      return false;
    };

    // Block print
    const blockPrint = (e) => {
      if (e.key === 'p' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toast.warning('Printing is not allowed during the exam');
        return false;
      }
    };

    // Detect window blur (might indicate screenshot tool opening)
    let blurCount = 0;
    const handleBlur = () => {
      blurCount++;
      if (blurCount > 2) {
        toast.error('Multiple window focus losses detected. This may indicate screenshot activity.');
      } else if (blurCount === 1) {
        toast.warning('Window focus lost. Please stay focused on the exam.');
      }
    };

    const handleFocus = () => {
      // Reset blur count after a delay
      setTimeout(() => {
        blurCount = Math.max(0, blurCount - 1);
      }, 5000);
    };

    // Detect if DevTools is opened (common before screenshots)
    let devtools = { open: false, orientation: null };
    const detectDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      
      if (widthThreshold || heightThreshold) {
        if (!devtools.open) {
          devtools.open = true;
          toast.error('Developer tools detected. This is not allowed during the exam.');
        }
      } else {
        devtools.open = false;
      }
    };

    const devToolsInterval = setInterval(detectDevTools, 500);

    // Add event listeners
    document.addEventListener('selectstart', disableSelection);
    document.addEventListener('contextmenu', disableContextMenu);
    document.addEventListener('keydown', blockShortcuts);
    document.addEventListener('keydown', blockPrint);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('dragstart', blockDragDrop);
    document.addEventListener('drop', blockDragDrop);
    document.addEventListener('copy', blockCopy);
    document.addEventListener('cut', blockCopy);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    // Add CSS to disable text selection
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
        -webkit-tap-highlight-color: transparent !important;
      }
      input[type="radio"], input[type="checkbox"] {
        -webkit-user-select: auto !important;
        -moz-user-select: auto !important;
        -ms-user-select: auto !important;
        user-select: auto !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      document.removeEventListener('selectstart', disableSelection);
      document.removeEventListener('contextmenu', disableContextMenu);
      document.removeEventListener('keydown', blockShortcuts);
      document.removeEventListener('keydown', blockPrint);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('dragstart', blockDragDrop);
      document.removeEventListener('drop', blockDragDrop);
      document.removeEventListener('copy', blockCopy);
      document.removeEventListener('cut', blockCopy);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      clearInterval(devToolsInterval);
      document.head.removeChild(style);
    };
  }, [isActive]);

  return (
    <div
      ref={containerRef}
      className="secure-quiz-container"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        position: 'relative',
      }}
      onContextMenu={(e) => {
        if (isActive) {
          e.preventDefault();
          toast.warning('Right-click is disabled during the exam');
        }
      }}
      onCopy={(e) => {
        if (isActive) {
          e.preventDefault();
          toast.warning('Copying is not allowed during the exam');
        }
      }}
      onCut={(e) => {
        if (isActive) {
          e.preventDefault();
          toast.warning('Cutting is not allowed during the exam');
        }
      }}
    >
      {children}
    </div>
  );
};

export default SecureQuizWrapper;

