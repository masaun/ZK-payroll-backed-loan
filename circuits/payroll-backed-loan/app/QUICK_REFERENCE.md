# 🚀 zkTLS Integration - Quick Reference

## 📋 Setup Checklist

- [x] Install `@reclaimprotocol/js-sdk`
- [ ] Copy `.env.local.example` to `.env.local`
- [ ] Add RECLAIM_APP_ID to `.env.local`
- [ ] Add RECLAIM_APP_SECRET to `.env.local`
- [ ] Add RECLAIM_PROVIDER_ID to `.env.local`
- [ ] Run `npm run dev`
- [ ] Test zkTLS proof generation

## 🔑 Required Environment Variables

```bash
RECLAIM_APP_ID=your_app_id_here
RECLAIM_APP_SECRET=your_app_secret_here
RECLAIM_PROVIDER_ID=payroll-provider
```

**Get credentials:** https://dev.reclaimprotocol.org/

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `src/lib/zktls/zktls-operation.ts` | Core SDK integration |
| `src/hooks/useZkTlsProof.ts` | React hook for proof generation |
| `src/components/ZkTlsButton.tsx` | UI component with button |
| `src/app/api/reclaim/create-proof-request/route.ts` | Backend: Create proof |
| `src/app/api/reclaim/verify-proof/route.ts` | Backend: Verify proof |

## 🔄 API Endpoints

### Create Proof Request
```
POST /api/reclaim/create-proof-request

Body: {
  "userAddress": "solana_wallet_address",
  "message": "optional_context"
}

Response: {
  "success": true,
  "proofRequest": "json_string"
}
```

### Verify Proof
```
POST /api/reclaim/verify-proof

Body: {
  "proofs": <proof_object>
}

Response: {
  "success": true,
  "isValid": true,
  "data": {
    "contextAddress": "...",
    "extractedParameters": {...}
  }
}
```

## 💻 Usage Examples

### Using the Button Component
```tsx
import { ZkTlsButton } from '@/components/ZkTlsButton';

export default function Page() {
  return <ZkTlsButton />;
}
```

### Using the Hook
```tsx
import { useZkTlsProof } from '@/hooks/useZkTlsProof';

function MyComponent() {
  const { isGenerating, error, proofData, requestProof } = useZkTlsProof();
  
  return (
    <button onClick={() => requestProof(address)}>
      Verify Payroll
    </button>
  );
}
```

### Direct SDK Usage
```tsx
import { createProofRequest, generateProof, verifyProofData } from '@/lib/zktls/zktls-operation';

// Backend: Create request
const proofRequest = await createProofRequest({
  appId: process.env.RECLAIM_APP_ID!,
  appSecret: process.env.RECLAIM_APP_SECRET!,
  providerId: 'payroll-provider'
});

// Frontend: Generate proof
await generateProof(proofRequest, {
  onSuccess: (proofs) => console.log(proofs),
  onError: (err) => console.error(err)
});

// Backend: Verify proof
const result = await verifyProofData(proofs);
```

## 🎨 UI States

| State | Button Text | Visual |
|-------|-------------|--------|
| Initial | "🔐 Request zkTLS Proof Generation" | Green |
| Loading | "🔄 Generating zkTLS Proof..." | Gray |
| Error | Shows error message | Red alert |
| Success | Shows verified data | Green card |

## 🐛 Common Issues

### "Reclaim credentials not configured"
**Solution:** Add credentials to `.env.local` and restart dev server

### "Failed to create proof request"
**Solution:** Check APP_ID and APP_SECRET are correct

### "Proof verification failed"
**Solution:** Ensure proof was generated successfully, check backend logs

## 📚 Resources

- **Reclaim Docs:** https://docs.reclaimprotocol.org/
- **Get Credentials:** https://dev.reclaimprotocol.org/
- **Browse Providers:** https://dev.reclaimprotocol.org/explore
- **Support:** https://t.me/protocolreclaim

## 🔒 Security Best Practices

✅ Never expose `RECLAIM_APP_SECRET` in frontend code
✅ Always verify proofs on the backend
✅ Store credentials in `.env.local` (not committed to git)
✅ Use HTTPS in production
✅ Validate user input before proof requests

## 📊 Integration Flow

```
1. User connects Solana wallet
   ↓
2. User clicks "Request zkTLS Proof Generation"
   ↓
3. Frontend → Backend: Create proof request
   ↓
4. Backend → Reclaim: Initialize request
   ↓
5. Frontend: Display QR code modal
   ↓
6. User: Scan & authenticate
   ↓
7. Reclaim → Frontend: Return proof
   ↓
8. Frontend → Backend: Verify proof
   ↓
9. Backend: Validate & extract data
   ↓
10. Frontend: Display verified data
```

## ✨ Features

- 🔐 Privacy-preserving verification
- 📱 QR code, browser extension, or mobile app
- 🎨 Beautiful dark theme UI
- ⚡ Real-time progress feedback
- 🛡️ Backend proof verification
- 💎 Full TypeScript support
- 🔗 Solana wallet integration

---

**Ready to test?** Run `npm run dev` and click the zkTLS button!
