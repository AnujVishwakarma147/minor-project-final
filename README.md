# SecureVault

SecureVault is a browser-based encrypted file vault with email/password login, JWT-protected APIs, and hybrid encryption. File contents use a random AES-256-GCM key per upload. The browser wraps each file key and encrypts filenames and MIME types with the account's RSA-OAEP public key. The RSA private key is generated in the browser and stored only as a PBKDF2-SHA256 (310,000 rounds) + AES-GCM encrypted value. The server stores ciphertext and authentication records, but not the file decryption key.

## Run locally

1. Install Node.js 20.19+ (Vite 8 requirement) and run MongoDB locally or use a MongoDB connection string.
2. Copy `backend/.env.example` to `backend/.env`, set `MONGODB_URI` and a long random `JWT_SECRET`.
3. In `backend`, run `npm install` and `npm run dev`.
4. In `frontend`, run `npm install` and `npm run dev`.
5. Open `http://localhost:5173`, create an account, sign in, and upload a file. Existing accounts made before browser key generation was added do not have an encryption key; register a new account for encrypted storage.

Set `VITE_API_URL` in the frontend environment when the API is not at `http://localhost:5000`.

## Storage

The default `STORAGE_DRIVER=local` keeps encrypted blobs under `backend/uploads`. To use private AWS S3, set `STORAGE_DRIVER=s3`, `AWS_REGION`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` in `backend/.env`. Attach the policy in `aws/securevault-s3-policy.json` to the IAM identity, adjusting the bucket ARN if you use a different bucket. It grants only `s3:PutObject`, `s3:GetObject`, and `s3:DeleteObject` on objects in this bucket. Keep S3 Block Public Access enabled and enable bucket versioning/encryption according to your deployment policy. The app uploads ciphertext only; S3 does not need the user's keys. Do not commit `.env`; for deployment, use narrowly scoped credentials provided by your hosting platform's secret manager.

## Security boundaries

This is a learning project, not a reviewed security product. Use HTTPS in deployment. The API can see account email, ciphertext size, and activity timing; filenames and MIME types are encrypted. A compromised account password or malicious JavaScript delivered by the web server can expose files, so zero-knowledge is conditional on trusting the frontend code delivered to the browser. Password recovery cannot restore the RSA private key; losing the password means the encrypted files cannot be decrypted. The current upload limit is 20 MiB.
