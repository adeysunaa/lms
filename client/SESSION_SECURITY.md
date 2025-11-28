# Session Security & Timeout Configuration

## Overview
The application now includes automatic session management and security features to protect user accounts from unauthorized access.

## Features

### 1. **Inactivity Timeout**
- Users are automatically logged out after **15 minutes** of no activity
- A warning appears **2 minutes** before logout
- Activity is detected through: mouse movement, clicks, keyboard input, scrolling, and touch events

### 2. **Maximum Session Duration**
- Sessions automatically expire after **8 hours**, regardless of activity
- Prevents indefinite sessions for enhanced security
- User must log in again after expiration

### 3. **Tab Visibility Detection**
- Detects when users switch tabs or minimize the browser
- Resets timers when user returns to the tab
- Optional: Can be configured to immediately logout when tab is hidden

### 4. **Warning Modal**
- Beautiful glass-styled warning modal appears before timeout
- Shows countdown timer
- Allows user to extend session or logout immediately
- Non-intrusive but clear messaging

### 5. **Visual Session Indicator**
- Small green dot in navbar shows active session
- Changes to yellow when inactive
- Subtle pulse animation for active state

## Configuration

You can customize the timeouts in `client/src/context/SessionContext.jsx`:

```javascript
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes (default)
const MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours (default)
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes warning (default)
```

### Recommended Settings by Use Case

#### High Security (Banking, Healthcare)
```javascript
const INACTIVITY_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MAX_SESSION_DURATION = 2 * 60 * 60 * 1000; // 2 hours
const WARNING_TIME = 1 * 60 * 1000; // 1 minute warning
```

#### Standard Security (E-commerce, LMS)
```javascript
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const MAX_SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes warning
```

#### Relaxed Security (Content sites)
```javascript
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const WARNING_TIME = 5 * 60 * 1000; // 5 minutes warning
```

## Stricter Security Options

### Immediate Logout on Tab Close
To enable immediate logout when tab is hidden, uncomment this line in `SessionContext.jsx`:

```javascript
// In handleVisibilityChange function
if (document.hidden) {
  handleSessionExpired('tab-visibility'); // Uncomment this line
}
```

### Detect Multiple Tabs
Add this to prevent multiple simultaneous sessions:

```javascript
// Add to SessionContext.jsx useEffect
const channel = new BroadcastChannel('session_channel');
channel.postMessage({ type: 'session_active', userId: user.id });

channel.onmessage = (event) => {
  if (event.data.type === 'session_active' && event.data.userId === user.id) {
    toast.warning('You are logged in from another tab. This session will be terminated.');
    setTimeout(() => handleSessionExpired('multiple-tabs'), 3000);
  }
};
```

## User Experience

### What Users See:
1. **Normal Operation**: Small green indicator in navbar
2. **After 13 minutes inactive**: Indicator turns yellow
3. **At 13 minutes**: Warning modal appears with countdown
4. **User can**: 
   - Move mouse/type to dismiss warning automatically
   - Click "Stay Logged In" button
   - Click "Logout Now" to logout immediately
5. **At 15 minutes**: Automatic logout with toast notification

### Toast Messages:
- "You will be logged out due to inactivity in 2 minutes..."
- "You have been logged out due to inactivity for security reasons."
- "Your session has expired. Please log in again."

## Benefits

✅ **Enhanced Security**: Prevents unauthorized access to abandoned sessions
✅ **Compliance**: Meets security requirements for many industries
✅ **User Control**: Clear warnings and ability to extend session
✅ **Flexible**: Easy to configure for different security needs
✅ **Modern UX**: Beautiful glass-styled modals with smooth animations
✅ **Automatic**: Works seamlessly in the background

## Browser Compatibility

- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers

Uses standard APIs:
- `setTimeout` for timers
- `document.visibilitychange` for tab detection
- Event listeners for activity detection

## Testing

To test the session timeout:

1. Set shorter timeouts for testing:
```javascript
const INACTIVITY_TIMEOUT = 2 * 60 * 1000; // 2 minutes for testing
const WARNING_TIME = 30 * 1000; // 30 seconds warning
```

2. Login and wait without interaction
3. Warning should appear at 1:30
4. Logout should occur at 2:00

## Security Best Practices

1. ✅ **Always use HTTPS** in production
2. ✅ **Enable secure cookies** in Clerk settings
3. ✅ **Set appropriate timeout values** for your use case
4. ✅ **Test thoroughly** with different scenarios
5. ✅ **Monitor user feedback** and adjust if needed
6. ✅ **Keep Clerk SDK updated** for latest security patches

## Troubleshooting

### Session not timing out?
- Check browser console for errors
- Verify SessionProvider is wrapping the app
- Check that user is actually signed in

### Warning modal not appearing?
- Check that toast notifications are working
- Verify SessionContext is properly imported
- Check browser console for React errors

### Multiple logout toasts?
- Ensure SessionProvider is only used once
- Check for duplicate event listeners
- Verify cleanup functions are working

## Future Enhancements

Potential additions:
- Backend session validation
- Session persistence across page refreshes
- Activity history tracking
- Customizable per-user timeout settings
- Admin dashboard for session monitoring



