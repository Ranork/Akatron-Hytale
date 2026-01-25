const axios = require('axios');

async function getLatestClientVersion(branch = 'release') {
  try {
    console.log(`Fetching latest client version from API (branch: ${branch})...`);
    const response = await axios.get('https://files.hytalef2p.com/api/version_client', {
      params: { branch },
      timeout: 5000,
      headers: {
        'User-Agent': 'Hytale-F2P-Launcher'
      }
    });

    if (response.data && response.data.client_version) {
      const version = response.data.client_version;
      console.log(`Latest client version for ${branch}: ${version}`);
      return version;
    } else {
      console.log('Warning: Invalid API response, falling back to default version');
      return '4.pwr';
    }
  } catch (error) {
    console.error('Error fetching client version:', error.message);
    console.log('Warning: API unavailable, falling back to default version');
    return '4.pwr';
  }
}

module.exports = {
  getLatestClientVersion
};
