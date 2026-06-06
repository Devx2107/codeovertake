const contributorService = require('../services/contributorService');

const getContributors = async (req, res) => {
  try {
    const result = await contributorService.getContributors();
    res.json(result);
  } catch (error) {
    console.error("Error in contributor controller:", error);
    res.status(500).json({ error: "Failed to fetch contributors" });
  }
};

module.exports = {
  getContributors
};