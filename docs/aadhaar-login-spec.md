# Aadhaar Verification Login Flow Specification

## 1. Aadhaar Login Flow Document

### Overview
This system enables farmers to log in to AgriChain using their Aadhaar number for identity verification without storing any Aadhaar number or PII on-chain. The core principle is **Zero-Data Storage** of PII (Personally Identifiable Information). We leverage UIDAI's OTP authentication to verify identity and issue a cryptographic Verifiable Credential (VC) that is anchored on-chain.

### High-Level Architecture Diagram
```
[Farmer UI] <--> [AgriChain Backend (Sub-KUA)] <--> [UIDAI KUA / ASA]
     |                      |
     v                      v
[Web3 Wallet] ----> [Smart Contract (AadhaarVerifier)]
```

### Aadhaar OTP Authentication Flow

1. **Wallet Connection**: Farmer connects their Web3 wallet (e.g., MetaMask).
2. **Input**: Farmer enters Phone Number and Aadhaar Number (12 digits).
3. **OTP Request**:
   - Frontend sends Aadhaar number to Backend.
   - Backend (as Sub-KUA) requests OTP from UIDAI via KUA/ASA.
   - UIDAI sends OTP to farmer's registered mobile.
4. **OTP Submission**: Farmer enters the 6-digit OTP.
5. **Verification**:
   - Backend sends OTP + Aadhaar to UIDAI for validation.
   - UIDAI responds with AuthResult (Y/N).
6. **VC Issuance**:
   - Backend does NOT save the Aadhaar number.
   - Backend generates a Verifiable Credential (VC) with wallet, aadhaarVerified, aadhaarLast4Digits, nonce, timestamp, expiry, issuerId, signature.
   - Backend computes vcHash = SHA256(canonical JSON of VC).
   - Backend returns VC and vcHash to Frontend.
7. **On-Chain Interaction**:
   - Frontend submits vcHash, issuer, signature to Smart Contract.
   - Smart Contract verifies issuer signature and marks wallet as verified.
   - Smart Contract emits AadhaarVerified event.
8. **Login Success**: UI redirects to Dashboard.

### Inputs Required from Farmer
- Phone Number (for display/reference, OTP sent to registered mobile)
- Aadhaar Number (12 digits)
- OTP (6 digits)
- Wallet Address (connected via Web3)

### UIDAI KUA/Sub-KUA Integration Model
- AgriChain Backend acts as Sub-KUA.
- Integrates with UIDAI KUA/ASA for OTP generation and verification.
- Uses encrypted channels for all communications.
- Complies with UIDAI API specifications for authentication.

### What Data is Allowed & Disallowed to Store
**Allowed to Store:**
- Boolean verification status (on-chain)
- Hashed VC (vcHash on-chain)
- Issuer address (on-chain)
- Last 4 digits of Aadhaar (in VC, off-chain)
- Wallet address
- Timestamps, nonces, expiry

**Disallowed to Store:**
- Full Aadhaar number
- Any PII beyond last 4 digits
- OTP values
- Raw UIDAI responses containing PII

### Zero-Storage Rule for Aadhaar Number
- Aadhaar number is processed only in volatile memory.
- Immediately overwritten/deleted after UIDAI verification.
- No logging of Aadhaar number.
- No database storage of Aadhaar number.

### Privacy Model
- Zero-Knowledge verification: Only boolean proof stored on-chain.
- VC contains minimal identifying information.
- Issuer signs VC using KMS-backed keys.
- On-chain storage limited to hashes and booleans.

### On-Chain Interaction Model
- Store only boolean (verified status) or hashed VC.
- Smart contract verifies issuer signatures.
- No personal data on blockchain.
- Events emitted for verification status.

---

## 2. UI/UX Mockup Description for the Login Page

### Layout Overview
- **Theme**: Clean, accessible design with high-contrast colors (Green/White theme). Simple, large fonts for readability. Mobile-first responsive layout.
- **Language Support**: Text in simple English with optional Tamil labels for key elements.
- **Accessibility**: Screen reader compatible, keyboard navigation, large touch targets for mobile.

### Page Structure
- **Header**: Top bar with AgriChain logo and language toggle [English | தமிழ்]
- **Main Content**: Centered card-based layout with step-by-step flow
- **Footer**: Minimal, with support contact

### Components and User Interactions

1. **Wallet Connection Section**
   - **Display**: Shows current wallet status or connect button
   - **Button**: "Connect Wallet / வாலட் இணைக்கவும்" with MetaMask icon
   - **State**: After connection, displays wallet address (truncated) with green checkmark
   - **Interaction**: Click to trigger Web3 wallet connection

2. **Identity Verification Form**
   - **Phone Input Field**:
     - Label: "Phone Number / தொலைபேசி எண்"
     - Input: Numeric field, 10 digits, with country code (+91) prefix
     - Validation: Basic format check
   - **Aadhaar Input Field**:
     - Label: "Aadhaar Number / ஆதார் எண்"
     - Input: Masked as XXXX XXXX XXXX, 12 digits, numeric keypad on mobile
     - Validation: Verhoeff algorithm check on frontend
   - **Send OTP Button**:
     - Text: "Send OTP / OTP அனுப்பு"
     - State: Disabled until valid inputs, shows spinner during request
     - Interaction: Sends Aadhaar to backend, triggers OTP to registered mobile

3. **OTP Verification Page/Modal**
   - **Transition**: Appears after Send OTP, overlays or replaces form
   - **OTP Input Field**:
     - Label: "Enter 6-digit OTP / 6 இலக்க OTP உள்ளிடவும்"
     - Input: 6 separate boxes (_ _ _ _ _), auto-advances focus
     - Auto-focus on first box
   - **Verify OTP Button**:
     - Text: "Verify OTP / OTP சரிபார்க்கவும்"
     - Interaction: Submits OTP for verification
   - **Resend Option**: "Resend OTP in 30s / 30 வினாடிகளில் OTP மீண்டும் அனுப்பு"
   - **Back Option**: "Change Details / விவரங்களை மாற்று"

4. **Success State**
   - **Animation**: Green checkmark with confetti effect
   - **Message**: "Verification Successful! Redirecting to Dashboard... / சரிபார்த்தல் வெற்றிகரமாக! டாஷ்போர்டுக்கு திருப்பிவிடுகிறது..."
   - **Interaction**: Auto-redirect after 3 seconds, or manual proceed button

5. **Failure States**
   - **Invalid OTP**: Red banner "Incorrect OTP. Please try again. / தவறான OTP. மீண்டும் முயற்சிக்கவும்."
   - **Network Error**: "Connection failed. Please check internet. / இணைப்பு தோல்வியடைந்தது. இணையத்தை சரிபார்க்கவும்."
   - **UIDAI Error**: "Verification failed. Please contact support. / சரிபார்த்தல் தோல்வியடைந்தது. ஆதரவை தொடர்பு கொள்ளவும்."
   - **Interaction**: Retry button, back to form option

### User Flow Interactions
- Step 1: Connect wallet → Enable identity form
- Step 2: Enter phone + Aadhaar → Send OTP → Show OTP page
- Step 3: Enter OTP → Verify → Success or failure
- All states provide clear feedback and next steps
- Loading states with progress indicators
- Error recovery options

---

## 3. Verification Credential (VC) Format

The VC serves as the off-chain proof of authentication, strictly following the **Zero-Knowledge / Privacy-Preserving** principles. The VC must be verifiable by the smart contract and contain no Aadhaar number.

### Canonical JSON Structure
```json
{
  "wallet": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F",
  "aadhaarVerified": true,
  "aadhaarLast4Digits": "1234",
  "nonce": "550e8400-e29b-11d4-a716-446655440000",
  "timestamp": 1702372000,
  "expiry": 1702375600,
  "issuerId": "did:ethr:0xIssuerAddress...",
  "signature": "0xabc123..."
}
```

### Example VC
```json
{
  "wallet": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "aadhaarVerified": true,
  "aadhaarLast4Digits": "5678",
  "nonce": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": 1640995200,
  "expiry": 1640998800,
  "issuerId": "did:ethr:0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  "signature": "0x1b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef01"
}
```

### Example vcHash
```
vcHash: 0xa1b2c3d4e5f6789abcdef0123456789abcdef0123456789abcdef0123456789abc
```

### Field Explanation
*   `wallet`: The Ethereum address of the farmer. Binds the credential to the user.
*   `aadhaarVerified`: Boolean flag confirming successful UIDAI response.
*   `aadhaarLast4Digits`: Only the last 4 digits of Aadhaar for UI reference (minimizes PII risk).
*   `nonce`: A unique UUID to prevent replay attacks.
*   `timestamp`: Unix timestamp when VC was issued.
*   `expiry`: Unix timestamp after which this VC is invalid for submission.
*   `issuerId`: DID of the KUA/Backend signing this VC.
*   `signature`: ECDSA signature from issuer (KMS-backed) of the vcHash.

### Hashing & Signing
*   **vcHash**: `SHA256(CanonicalStringify(JSON))` - computed from the canonical JSON excluding the signature field.
*   **Signature**: `ECDSA_Sign(vcHash, Issuer_Private_Key)` using KMS-backed key.

---

## 4. Smart Contract Specification for Aadhaar Verification

### Contract: `AadhaarVerifier.sol`

**State Variables**:
*   `mapping(address => bool) public verified;` // Wallet Aadhaar verified status
*   `mapping(bytes32 => bool) public usedVCHashes;` // Replay protection for vcHashes
*   `mapping(address => bool) public trustedIssuers;` // Registry of trusted issuer addresses

**Events**:
*   `event AadhaarVerificationSubmitted(address indexed wallet, bytes32 vcHash, address issuer);`
*   `event AadhaarVerified(address indexed wallet, uint256 timestamp);`
*   `event AadhaarVerificationFailed(address indexed wallet, string reason);`

**Functions**:

1.  `submitAadhaarVC(bytes32 vcHash, address issuer, bytes memory signature)`
    *   **Validation**:
        *   Check `!usedVCHashes[vcHash]` (prevent replay).
        *   Check `trustedIssuers[issuer] == true` (verify issuer is trusted).
        *   Verify signature: `ecrecover(vcHash, signature) == issuer`.
    *   **Action**:
        *   Set `usedVCHashes[vcHash] = true`.
        *   Set `verified[msg.sender] = true`.
        *   Emit `AadhaarVerified(msg.sender, block.timestamp)`.
    *   **Failure Handling**:
        *   If validation fails, emit `AadhaarVerificationFailed(msg.sender, reason)` and revert.

2.  `isAadhaarVerified(address wallet) external view returns (bool)`
    *   Returns `verified[wallet]`.

**Contract Responsibilities**:
- Verify issuer signature against vcHash.
- Verify issuer is from trusted registry.
- Mark wallet as Aadhaar-verified upon successful verification.
- Emit appropriate events for verification status.

**Storage Rules**:
- Must NOT store Aadhaar number or any PII.
- Must only store: verified[wallet] = true, vcHash (for replay protection), issuer (for reference).

**Security Rules**:
- Prevent replay attacks by checking usedVCHashes.
- Reject untrusted issuers.
- Hash comparisons only (no raw data storage).
- All validations must pass before marking verified.

---

## 5. Backend Verification Flow (Step-by-Step)

### Step-by-Step Process

1. **Farmer Enters Aadhaar Number**:
   - Frontend collects Aadhaar number (12 digits) and phone number.
   - Validates Aadhaar format using Verhoeff algorithm.

2. **Server Sends OTP via UIDAI KUA**:
   - Backend (as Sub-KUA) sends Aadhaar number to UIDAI KUA/ASA.
   - Requests OTP generation for the Aadhaar.
   - UIDAI sends OTP to farmer's registered mobile number.

3. **Farmer Inputs OTP**:
   - Frontend collects 6-digit OTP from farmer.

4. **Server Validates OTP with UIDAI**:
   - Backend sends OTP + Aadhaar to UIDAI for verification.
   - UIDAI responds with AuthResult (Y/N).

5. **Server Builds VC**:
   - If verification successful, construct VC JSON with wallet, aadhaarVerified=true, aadhaarLast4Digits, nonce, timestamp, expiry, issuerId.
   - Compute vcHash = SHA256(canonical JSON).

6. **Server Signs VC**:
   - Sign vcHash using KMS-backed private key.
   - Add signature to VC JSON.

7. **Server Returns VC + vcHash**:
   - Return complete VC object and vcHash to frontend.

8. **Frontend Sends vcHash to Smart Contract**:
   - Frontend calls submitAadhaarVC(vcHash, issuer, signature).

9. **Smart Contract Verifies Issuer**:
   - Contract verifies signature and issuer trust.

10. **Smart Contract Marks Wallet Verified**:
    - Sets verified[wallet] = true and emits events.

### Error Handling Rules
- **Invalid Aadhaar**: Return 400 Bad Request with "Invalid Aadhaar format".
- **OTP Mismatch**: Return 401 Unauthorized with "Invalid OTP".
- **UIDAI Failure**: Return 500 Internal Server Error with "Verification service unavailable".
- **Expired VC**: Smart contract reverts with "VC expired".
- **Untrusted Issuer**: Smart contract reverts with "Untrusted issuer".
- **Replay Attack**: Smart contract reverts with "VC already used".

### Logging Rules
- Log only non-PII data: "Verification attempt for wallet X - Success/Fail".
- Never log Aadhaar numbers, OTPs, or raw UIDAI responses.
- Log security events: rate limit hits, suspicious patterns.

### Security Best Practices
- **Rate Limiting**: Max 3 OTP requests per hour per IP/wallet.
- **Input Validation**: Sanitize all inputs, prevent injection attacks.
- **Encryption**: Use TLS 1.3 for all communications.
- **Timeout**: Expire OTP after 10 minutes.
- **Audit Trail**: Log verification events without PII.

### KMS Key Handling
- Private keys never stored in application memory or files.
- Use AWS KMS or Google KMS for signing operations.
- Keys rotated regularly, access controlled via IAM.
- Signing operations happen in secure enclave.

### How to Delete Aadhaar Number Immediately After Verification
- After UIDAI response received, immediately overwrite the aadhaarNumber variable with random bytes.
- Use secure memory wiping functions (e.g., in Node.js, use crypto.randomBytes to overwrite).
- Do not store in any temporary files or logs.
- Ensure garbage collection clears memory promptly.

