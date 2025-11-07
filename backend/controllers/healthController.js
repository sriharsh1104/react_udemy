const getHealth = (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Chat server is running',
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  getHealth
};
