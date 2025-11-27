// Fetch transcript from YouTube subtitles
export const getTranscript = async (req, res) => {
  try {
    const { videoId } = req.body;

    if (!videoId) {
      return res.json({
        success: false,
        message: 'Video ID is required'
      });
    }

    // Get subtitles directly from YouTube - optimized for speed
    // Try English first (most common), then fallback
    const languages = ['en', 'en-US'];
    
    for (const lang of languages) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500); // 1.5 second timeout
        
        // Use YouTube's subtitle API - srv1 format is fastest
        const response = await fetch(
          `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${lang}&fmt=srv1`,
          {
            headers: {
              'Accept': 'text/xml',
            },
            signal: controller.signal
          }
        );
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const xmlText = await response.text();
          
          // Quick validation
          if (!xmlText || xmlText.includes('<parsererror>') || xmlText.length < 50) {
            continue;
          }
          
          // Fast regex parsing - extract all text segments at once
          const textRegex = /<text start="([\d.]+)"[^>]*(?:dur="([\d.]+)")?[^>]*>([^<]*)<\/text>/g;
          const matches = [...xmlText.matchAll(textRegex)];
          
          if (matches && matches.length > 0) {
            const transcriptData = matches.map((match, index) => {
              const start = parseFloat(match[1] || 0);
              const duration = parseFloat(match[2] || 2.5);
              let text = (match[3] || '').trim();
              
              // Quick HTML entity decode (only if needed)
              if (text.includes('&')) {
                text = text
                  .replace(/&quot;/g, '"')
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&#39;|&apos;/g, "'");
              }
              
              return {
                id: index,
                start: start,
                end: start + duration,
                text: text
              };
            }).filter(segment => segment.text && segment.text.length > 0);

            if (transcriptData.length > 0) {
              return res.json({
                success: true,
                transcript: transcriptData
              });
            }
          }
        }
      } catch (err) {
        // Try next language or return empty
        continue;
      }
    }

    // If no transcript found
    res.json({
      success: false,
      message: 'Subtitles not available for this video',
      transcript: []
    });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    res.json({
      success: false,
      message: error.message || 'Failed to fetch transcript',
      transcript: []
    });
  }
};

