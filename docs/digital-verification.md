
# Digital Land Verification Module

This document describes the **Digital Land Verification Module** for the AgroGuard on-chain parametric crop insurance system. It is a complete, developer- and operator-ready specification you can implement and attach to your repository. It assumes the on-chain smart contracts exist (Registry, VerificationManager / PolicyManager, LandSBT, OracleAggregator, PayoutEngine). The module produces cryptographic artifacts (VCs, hashes, proofs) that the contracts verify.

---

## 1. Goal / Summary

Enable **fully-digital, automated verification** of a farmer's land ownership and field boundaries with no physical visit, and produce **on-chain-verifiable artifacts** (signed Verifiable Credentials or mintable Land SBTs) after checks pass. The module combines 4 independent digital checks and issues a signed VC when confidence threshold is reached.

Checks used (combine for high confidence):

1. State Land Records (Bhoomi / Dharani / Bhulekh PDF or API lookup)
2. Geo-boundary polygon capture (farmer app) matched to official boundaries
3. Satellite analysis (NDVI / crop presence + boundary overlap)
4. Document OCR + automated validation (extract survey no, owner name)

The module is designed to minimize human interventions but allows manual review fallback for low-confidence cases.

---

## 2. High-level Architecture

```
Farmer App / FPO Kiosk  --> Verification Backend --> Crypto Signer --> Blockchain (VerificationManager / LandSBT)
                             ^                         |
                             |                         v
                       Satellite Providers           Registry (trusted issuers)
                       State Land Portals
```

Components:

* Frontend (Farmer app, FPO portal)
* Verification Backend (microservices)

  * Ingest service
  * Polygon/GIS matcher
  * Satellite analysis service
  * OCR & Document validator
  * Confidence engine
  * VC signer / SBT minter service
* Secure Key Store (KMS) for issuer private keys
* Audit & Storage (encrypted off-chain storage for raw docs)

---

## 3. Data model (key objects)

### LandClaim

* `claimId` (UUID)
* `wallet` (0x...)
* `farmerPhone` (masked)
* `surveyNo` (string | optional)
* `parcelPolygon` (GeoJSON polygon)
* `area` (sq.m)
* `docHash` (sha256) // hash of uploaded deed image/PDF
* `docCID` (optional) // ipfs or encrypted storage pointer
* `status` (`pending | auto-verified | manual-review | rejected`)
* `confidenceScore` (0-100)
* `evidence[]` (list of evidence items with type, score, timestamp)

### EvidenceItem

* `type` ("stateRecord"|"polygonMatch"|"satelliteNDVI"|"ocrMatch")
* `source` (string)
* `score` (0-100)
* `raw` (reference pointer; encrypted)
* `timestamp`

### VerifiableCredential (VC)

* `vcHash` = sha256( JSON({wallet, landId, parcelHash, issuer, issuedAt, expiry, nonce}) )
* `signature` = Sign(vcHash, issuerKey)

---

## 4. Verification Flow (step-by-step)

1. **Farmer starts claim** in App: submits survey number (if available) + draws polygon or uses GPS walkaround + uploads deed photo (optional). App records phone & wallet.

2. **Create claim record** on backend with `status = pending` and compute `docHash`.

3. **Parallel checks (async)**:

   * **State Record Lookup:** fetch from state portal (if available) by surveyNo or village/owner; if portal provides PDF/JSON, compute match between supplied owner name and portal owner; set `score_state`.
   * **Polygon Match:** compare farmer polygon vs official cadastral polygon (if cadastral layer available) using intersection-over-union (IoU). Compute `score_polygon`.
   * **Satellite NDVI Check:** request Sentinel-2 or MODIS tiles for the polygon dates; compute NDVI presence and cropping pattern; compute `score_ndvi`.
   * **OCR & Document Validator:** OCR deed image -> extract owner name, survey no, area; cross-check extracted fields against farmer input or state record; compute `score_ocr`.

4. **Confidence Engine** computes a weighted confidence score:

```
confidence = w1*score_state + w2*score_polygon + w3*score_ndvi + w4*score_ocr
```

Default weights (configurable): w1=0.35, w2=0.30, w3=0.25, w4=0.10.

5. **Decision rules**:

* If `confidence >= 85` -> `auto-verified` (issue VC or mint Land SBT)
* If `confidence >= 60 and <85` -> `manual-review` (show human verifier dashboard)
* Else -> `rejected`

6. **Issue on-chain artifact**:

* For auto-verified claims, backend constructs VC payload, signs it, and returns `vcHash` + `signature` to the farmer app. The app (or backend) submits `submitVC(vcHash, issuer, signature)` to `VerificationManager` smart contract. Optionally, call `mintSBT(wallet, tokenUri)` via issuer (if SBT workflow used).

7. **On-chain confirmation**: smart contract emits `LandVerified(wallet, vcHash, issuer)` and sets mapping accordingly.

8. **Audit & Storage**: store encrypted raw evidence and proof-of-hash on S3/IPFS. Log all actions and signatures for regulator audit.

---

## 5. Algorithms & Implementation Details

### 5.1 State Record Matcher

* If API available: call portal API, fetch owner and parcel polygon.
* If only PDF available: download PDF, compute hash, OCR key fields, compare.
* Scoring:

  * exact owner name + exact surveyNo: 100
  * owner name fuzzy match + surveyNo match: 90
  * surveyNo match only: 80
  * no match: 0

### 5.2 Polygon Matching (GIS)

* Compute Intersection-over-Union (IoU) between claimed polygon and cadastral polygon.
* Score = 100 * IoU. If IoU >= 0.9 -> 100. If IoU between 0.7-0.9 -> 80. etc.

### 5.3 Satellite NDVI

* Pull Sentinel-2 images for the polygon for the last two seasons.
* Compute NDVI series; detect cropping pattern vs fallow.
* Score logic:

  * Consistent cultivated NDVI matching crop season → 100
  * Partial/seasonal match → 60–80
  * No vegetation → 0–30

### 5.4 OCR & Field Extraction

* Use Tesseract or cloud OCR with heuristics for Indian land docs.
* Extract owner name, survey number, area; compare with farmer input and state record.
* Compute fuzzy string match (Levenshtein) with thresholds.

### 5.5 Confidence Weighting

* Weights are configurable per region depending on data availability.
* Example default: state=0.35, polygon=0.30, NDVI=0.25, OCR=0.10.

---

## 6. VC / SBT issuance formats (examples)

### Verifiable Credential JSON (canonicalized before hashing)

```
{
  "wallet": "0xabc...",
  "landId": "LAND-<UUID>",
  "parcelHash": "sha256-of-geojson",
  "issuer": "FPO-ORG-ID",
  "issuedAt": 1700000000,
  "expiry": 1731536000,
  "nonce": "random-uuid",
  "confidence": 92
}
```

* `vcHash` = sha256(canonicalizedJSON)
* `signature` = Sign(vcHash, issuerPrivateKey) (ECDSA secp256k1)

### LandSBT metadata

* tokenUri points to encrypted JSON with minimal public fields (tokenId, parcelHash, area, issueTs).

---

## 7. Smart Contract interactions (what to call)

* `VerificationManager.submitVC(bytes32 vcHash, address issuer, bytes signature)`

  * Verifies issuer is in Registry and signature valid.
  * Sets `landVerified[wallet] = true` or maps `landId -> wallet`.

* `LandSBT.mintSBT(to, tokenURI)`

  * Called by issuer to mint non-transferable token.

* `PolicyManager.createPolicy(...)`

  * Check `landId` is owned/verified.

All events must be emitted: `VCSubmitted`, `LandSBTMinted`, `LandVerified`.

---

## 8. Security & Privacy

* NEVER store raw Aadhaar or PAN in chain.
* Raw docs stored encrypted using KMS-managed keys; store only `docHash` on-chain or in audit logs.
* Issuer private keys stored in KMS (Google KMS / AWS KMS); use signing-as-a-service endpoints.
* All signed VC payloads include nonce & expiry to prevent replay.
* Access logs + audit trail kept immutable by storing proof-hashes on chain where required.

---

## 9. Manual Review Dashboard

When confidence is in fallback zone (60-85):

* Expose a reviewer view with stacked evidence: state doc, OCR extract, satellite overlay, polygon overlay.
* Reviewer can accept/reject; reviewer action is signed and recorded in backend; final acceptance triggers VC issuance.

---

## 10. Testing Plan (verification module tests)

* Unit tests for scoring functions (polygon IoU, NDVI scoring, OCR matching)
* Integration tests with sample state PDFs and sample polygons
* E2E test: upload sample deed + polygon -> simulate oracles -> auto-verify -> issue VC -> on-chain verification
* Negative tests: mismatched owner name, polygon mismatch, stale docs

---

## 11. Edge Cases & Handling

* **No state portal available**: increase polygon & satellite weight; require manual review.
* **Smallholdings with ambiguous polygons**: require FPO confirmation and two-factor verification.
* **Disputed ownership**: mark `manual-review`, do not mint SBT until resolved.
* **Stale documents**: require updated (last 6 months) or reject.

---

## 12. Operational checklist for deploy

* Setup KMS for issuer keys
* Setup satellite data access (Copernicus / AWS Sentinel / Google Earth Engine credentials)
* Setup state portal integrations (APIs or scraping + caching) with legal checks
* Build reviewer dashboard for FPOs
* Implement monitoring for data freshness & failed pipeline alerts

