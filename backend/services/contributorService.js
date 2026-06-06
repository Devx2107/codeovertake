const axios = require('axios');

let cachedContributors = null;
let lastFetchTime = 0;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours

// duplicate ids & bot regex
const IGNORED_USERS = ['sujal-ai1'];
const BOT_PATTERN = /copilot/i;

const getContributors = async () => {
  const currentTime = Date.now();

  if (cachedContributors && (currentTime - lastFetchTime < CACHE_DURATION)) {
    // console.log("Serving contributors from cache!");
    return cachedContributors;
  }

  const githubUrl = 'https://api.github.com/repos/sujallchaudhary/codeovertake/contributors';
  
  try {
    const headers = { Accept: 'application/vnd.github.v3+json' };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }

    const response = await axios.get(githubUrl, { headers, timeout: 10000 });
    
    const formattedData = response.data
      .filter(user => {
        const isBot = BOT_PATTERN.test(user.login);
        const isIgnored = IGNORED_USERS.includes(user.login);
        return !isBot && !isIgnored;
      })
      .map(user => ({
        id: user.id,
        login: user.login,
        avatar_url: user.avatar_url,
        html_url: user.html_url,
        contributions: user.contributions
      }));

    cachedContributors = formattedData;
    lastFetchTime = currentTime;

    return cachedContributors;

  } catch (error) {
    if (cachedContributors) {
      return cachedContributors;
    }
    console.error("GitHub fetch error for contributors:", error.message);
    throw new Error("Failed to fetch contributors");
  }
};

module.exports = {
  getContributors
};