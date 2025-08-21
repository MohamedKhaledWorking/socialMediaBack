
const blacklistedTokens = new Set();

export const addToBlacklist = (token) => {
  blacklistedTokens.add(token);
  console.log(`Token added to blacklist. Total blacklisted: ${blacklistedTokens.size}`);
};

export const isTokenBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

// Remove token from blacklist (optional - for cleanup)
export const removeFromBlacklist = (token) => {
  blacklistedTokens.delete(token);
  console.log(`Token removed from blacklist. Total blacklisted: ${blacklistedTokens.size}`);
};

// Get blacklist size (for debugging)
export const getBlacklistSize = () => {
  return blacklistedTokens.size;
};

export const logoutController = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (token) {
      addToBlacklist(token); // ONLY THIS IS NECESSARY
    }
    
    res.status(200).json({ 
      message: "Logout successful",
      success: true
    });
  } catch (error) {
    res.status(500).json({ message: "Logout failed", error: error.message });
  }
}; 