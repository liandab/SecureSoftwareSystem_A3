# Software update signature verification (SR-10)

`verify-update.js` validates ECDSA P-256 detached signatures. `approve-update.js` refuses to stage an archive unless the signature is valid for the pinned public key.

Use a **trusted key provisioned separately by the administrator**. Do not let an upload request choose its own trusted key.

Run from `backend/` after setting `TRUSTED_UPDATE_PUBLIC_KEY_FILE` to the path of the administrator's public key:

```sh
node scripts/approve-update.js /path/update.zip /path/update.sig /path/staging
```

Only staged bytes with a valid detached signature can pass this entry point. This is **not yet connected to an automated software installer**, so the complete install-before-verification guarantee still needs a deployment pipeline/enforcement step. Do not claim SR-10 fully implemented.
