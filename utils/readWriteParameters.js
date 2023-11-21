const fs = require('fs').promises;
const { chainId } = require('./config');

async function readJsonFile(filePath) {
  try {
    filePath = filePath + chainId() + '.json';

    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    throw err;
  }
}

// const fs = require('fs/promises'); // Use the Promise-based version of fs

async function updateAndSaveFile(filePath, newParams) {
  try {
    filePath = filePath + chainId() + '.json';

    let fileData;

    // Check if the file exists
    try {
      const data = await fs.readFile(filePath, 'utf8');
      fileData = JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log('File does not exist, creating new file.');
        fileData = {}; // Initialize an empty object if file doesn't exist
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Add new parameters to the object
    Object.assign(fileData, newParams);

    // Write the updated object back to the file
    try {
      await fs.writeFile(filePath, JSON.stringify(fileData, null, 2), 'utf8');
      console.log('File updated successfully.');
    } catch (writeError) {
      console.error('Error writing file:', writeError);
    }
  } catch (err) {
    console.error('An error occurred:', err);
  }
}

module.exports = {
  readJsonFile,
  updateAndSaveFile,
};

// Example usage (in an async context)
// async function run() {
//   try {
//     const data = await readJsonFile('atonAddress.json');
//     console.log('File content:', data);

//     await updateAndSaveFile('parameters', { newParameter: 'newValue' });
//   } catch (err) {
//     console.error('An error occurred:', err);
//   }
// }
// run();
