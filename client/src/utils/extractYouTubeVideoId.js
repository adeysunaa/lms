// Utility function to extract YouTube video ID from various URL formats
export const extractYouTubeVideoId = (url) => {
  if (!url) return null;

  // Remove any whitespace
  url = url.trim();

  // Pattern to match YouTube video IDs
  const patterns = [
    // Standard YouTube URLs
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    // YouTube short URLs
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    // Direct video ID (11 characters)
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

