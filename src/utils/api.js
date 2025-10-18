import Axios from "axios";

// 🌍 Base URLs per environment
const urls = {
  test: `http://localhost:5000`,
  development: 'http://localhost:5000',
  production: 'https://api.ntradao.com',
};

// 🧩 Create Axios instance
const api = Axios.create({
  baseURL: urls[process.env.NODE_ENV],
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000, // optional: timeout after 30 seconds
});

// 🧠 Simple in-memory cache
const cache = new Map();

// ⚙️ Retry + Cache Interceptor
api.interceptors.response.use(
  response => {
    // Cache successful responses by URL
    cache.set(response.config.url, response.data);
    return response;
  },
  async error => {
    const { config } = error;
    const maxRetries = 3;

    // Initialize retry count
    config.__retryCount = config.__retryCount || 0;

    // Retry logic
    if (config.__retryCount < maxRetries) {
      config.__retryCount += 1;
      const delay = 300 * config.__retryCount; // exponential-ish backoff
      await new Promise(res => setTimeout(res, delay));
      return api(config);
    }

    // Fallback to cached response (if exists)
    const cachedData = cache.get(config.url);
    if (cachedData) {
      console.warn(`⚡ Using cached response for ${config.url}`);
      return Promise.resolve({ data: cachedData });
    }

    return Promise.reject(error);
  }
);

export default api;
