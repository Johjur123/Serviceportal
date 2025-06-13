// Enhanced API request with retry logic and error handling
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const isRetryableError = (error: any): boolean => {
  return error.name === 'NetworkError' || 
         error.name === 'TypeError' ||
         (error.message && (
           error.message.includes('fetch') ||
           error.message.includes('network') ||
           error.message.includes('timeout')
         ));
};

export const apiRequest = async (
  url: string, 
  options: RequestInit = {}, 
  retries = 3
): Promise<any> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && isRetryableError(error)) {
      console.log(`Request failed, retrying... (${3 - retries + 1}/3)`);
      await delay(Math.pow(2, 3 - retries) * 1000); // Exponential backoff
      return apiRequest(url, options, retries - 1);
    }
    
    throw error;
  }
};