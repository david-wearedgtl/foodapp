/**
 * Utility function to strip HTML tags from a string.
 * @param htmlString The string containing HTML.
 * @returns The string with all HTML tags removed.
 */
export const stripHtml = (htmlString: string) => {
  // Regex to match anything between < and > (including the brackets themselves)
  return htmlString.replace(/<[^>]*>/g, '').trim();
};

/**
 * Utility to clean up HTML product descriptions for safe display in React Native Text.
 * This function performs two main steps:
 * 1. Decodes common HTML entities (&amp; -> &).
 * 2. Strips all HTML tags (<p>text</p> -> text).
 * * @param htmlString The raw product description string from the API.
 * @returns A clean, plain text string ready for display.
 */
export const cleanHtml = (htmlString: string | null | undefined): string => {
  if (!htmlString) {
    return '';
  }

  let cleanedString = htmlString;

  // --- Step 1: Decode HTML Entities ---
  // Decode common named entities first
  const entitiesMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#039;': "'",
    '&apos;': "'",
  };

  for (const [entity, character] of Object.entries(entitiesMap)) {
    cleanedString = cleanedString.replace(new RegExp(entity, 'g'), character);
  }

  // Handle numerical entities (e.g., &#39; or &#x27;)
  cleanedString = cleanedString.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });
  cleanedString = cleanedString.replace(/&#x([a-fA-F0-9]+);/g, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  // --- Step 2: Strip HTML Tags ---
  // Regex to match anything between < and > (including the brackets themselves)
  cleanedString = cleanedString.replace(/<[^>]*>/g, '');

  // --- Step 3: Clean up whitespace (optional but recommended) ---
  // Replace multiple newlines with single spaces and trim whitespace
  return cleanedString.replace(/\s+/g, ' ').trim();
};