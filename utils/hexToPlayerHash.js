const crypto = require("crypto");

function hexToPlayerHash(hexString) {
  // Remove the "0x" prefix
  hexString = hexString.replace(/^0x/i, "");

  // Create a hash using SHA-256
  const hash = crypto.createHash("sha256");
  hash.update(Buffer.from(hexString, "hex"));

  // Convert the hash to a base64 representation
  const base64String = hash.digest("base64");

  // Take the first 8 characters of the base64 string
  const truncatedBase64 = base64String.substring(0, 8);

  // Format as "playerHash: 'ABCDFG16'"
  const playerHash = `playerHash: '${truncatedBase64}'`;

  return playerHash;
}

// Example usage:
const hexString = "0x35BB6B2757C004A1662e83FdA9a034f4aFbBEdb3";
const result = hexToPlayerHash(hexString);
console.log(result); // Output: "playerHash: 'GK3a9r13'"

module.exports = hexToPlayerHash;
