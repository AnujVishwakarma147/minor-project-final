
// ============================================
// SecureVault - Cryptography Utilities
// AES-256-GCM + RSA-OAEP + PBKDF2
// ============================================

const PBKDF2_ITERATIONS = 310000;

// Convert ArrayBuffer / Uint8Array to Base64
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

// Convert Base64 to Uint8Array
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

// ============================================
// 1. Generate RSA Key Pair
// ============================================

export async function generateRSAKeyPair() {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["wrapKey", "unwrapKey"]
  );

  return keyPair;
}

// ============================================
// 2. Generate AES-256 Key from Password
// Using PBKDF2
// ============================================

async function derivePasswordKey(password, salt) {
  if (!password || typeof password !== "string") {
    throw new Error("A valid password is required.");
  }

  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const derivedKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    passwordKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );

  return derivedKey;
}

// ============================================
// 3. Encrypt RSA Private Key
// Using Password + PBKDF2 + AES-GCM
// ============================================

export async function encryptPrivateKey(privateKey, password) {
  // Generate random salt
  const salt = window.crypto.getRandomValues(
    new Uint8Array(16)
  );

  // Generate random IV
  const iv = window.crypto.getRandomValues(
    new Uint8Array(12)
  );

  // Derive AES key from password
  const aesKey = await derivePasswordKey(password, salt);

  // Export RSA Private Key
  const privateKeyData = await window.crypto.subtle.exportKey(
    "pkcs8",
    privateKey
  );

  // Encrypt Private Key
  const encryptedPrivateKey = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    aesKey,
    privateKeyData
  );

  // Return database-friendly encrypted data
  return {
    encryptedPrivateKey: arrayBufferToBase64(encryptedPrivateKey),
    salt: arrayBufferToBase64(salt),
    iv: arrayBufferToBase64(iv),
    iterations: PBKDF2_ITERATIONS,
    algorithm: "AES-256-GCM",
    keyDerivation: "PBKDF2-SHA256",
  };
}

// ============================================
// 4. Decrypt RSA Private Key
// Using User Password
// ============================================

export async function decryptPrivateKey(encryptedData, password) {
  try {
    if (!encryptedData || !encryptedData.encryptedPrivateKey ||
        !encryptedData.salt || !encryptedData.iv) {
      throw new Error("Invalid encrypted private key data.");
    }

    // Convert Base64 data back to bytes
    const salt = base64ToArrayBuffer(encryptedData.salt);
    const iv = base64ToArrayBuffer(encryptedData.iv);

    const encryptedPrivateKey = base64ToArrayBuffer(
      encryptedData.encryptedPrivateKey
    );

    // Derive AES key using the same password and salt
    const passwordKey = await window.crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );

    const iterations = encryptedData.iterations || PBKDF2_ITERATIONS;

    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: iterations,
        hash: "SHA-256",
      },
      passwordKey,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["decrypt"]
    );

    // Decrypt Private Key
    const decryptedPrivateKey = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      encryptedPrivateKey
    );

    // Import RSA Private Key
    const privateKey = await window.crypto.subtle.importKey(
      "pkcs8",
      decryptedPrivateKey,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      false,
      ["unwrapKey"]
    );

    return privateKey;

  } catch (error) {
    console.error("Private key decryption failed:", error);

    throw new Error(
      "Unable to decrypt private key. Check your password."
    );
  }
}

// ============================================
// 5. Export RSA Public Key
// Public key can be stored on the server
// ============================================

export async function exportPublicKey(publicKey) {
  const publicKeyData = await window.crypto.subtle.exportKey(
    "spki",
    publicKey
  );

  return arrayBufferToBase64(publicKeyData);
}

// ============================================
// 6. Import RSA Public Key
// ============================================

export async function importPublicKey(publicKeyBase64) {
  const publicKeyData = base64ToArrayBuffer(publicKeyBase64);

  return await window.crypto.subtle.importKey(
    "spki",
    publicKeyData,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["wrapKey"]
  );
}

// ============================================
// 7. Encrypt File Using AES-256-GCM
// Protect AES Key Using RSA Public Key
// ============================================

export async function encryptFile(file, publicKey) {
  // Generate AES-256 key
  const aesKey = await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );

  // Generate random IV
  const iv = window.crypto.getRandomValues(
    new Uint8Array(12)
  );

  // Read file
  const fileData = await file.arrayBuffer();

  // Encrypt file
  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    aesKey,
    fileData
  );

  // Wrap AES key using RSA public key
  const wrappedKey = await window.crypto.subtle.wrapKey(
    "raw",
    aesKey,
    publicKey,
    {
      name: "RSA-OAEP",
    }
  );

  // Store IV with encrypted file
  const encryptedBlob = new Blob(
    [iv, encryptedData],
    {
      type: "application/octet-stream",
    }
  );

  return {
    encryptedBlob,
    wrappedKey,
  };
}

// ============================================
// 8. Decrypt File Using RSA Private Key
// ============================================

export async function decryptFile(
  encryptedBlob,
  wrappedKey,
  privateKey,
  mimeType
) {
  // Recover AES key using RSA private key
  const aesKey = await window.crypto.subtle.unwrapKey(
    "raw",
    wrappedKey,
    privateKey,
    {
      name: "RSA-OAEP",
    },
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["decrypt"]
  );

  // Read encrypted file
  const encryptedBuffer = await encryptedBlob.arrayBuffer();

  // Extract IV (first 12 bytes)
  const iv = encryptedBuffer.slice(0, 12);

  // Extract ciphertext
  const encryptedData = encryptedBuffer.slice(12);

  // Decrypt original file
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    aesKey,
    encryptedData
  );

  return new Blob(
    [decryptedData],
    {
      type: mimeType || "application/octet-stream",
    }
  );
}
