# Farcaster Frame Integration

## Overview

SusuFlow now supports **Farcaster Frames**, allowing users to discover, view, and interact with Susu pools directly from their Farcaster feed!

## What are Farcaster Frames?

Farcaster Frames are interactive mini-apps embedded in social posts. They allow users to:
- View pool information without leaving Farcaster
- See live stats (members, contribution amount, round)
- Click through to join pools directly

## Features Implemented

### 1. **Dynamic Pool Images**
Each pool generates a beautiful, dynamic OG image showing:
- Pool round number
- Contribution amount and token (CELO or cUSD)
- Number of members
- Pool address
- SusuFlow branding

**Endpoint**: `/api/frames/pool-image`

### 2. **Frame Metadata**
Pool pages now include Farcaster Frame metadata for social sharing:
- Automatically detects pool status (active/completed)
- Shows appropriate action buttons
- Seamless integration with Farcaster clients

### 3. **Share-Ready URLs**
Every pool page is now shareable on Farcaster:
```
https://susuflow.netlify.app/pools/{pool-address}
```

## How to Use

### Sharing a Pool on Farcaster

1. **Copy the Pool URL**
   - Go to any pool: `https://susuflow.netlify.app/pools/0x...`
   - Copy the URL

2. **Create a Cast**
   - Open Warpcast or your Farcaster client
   - Paste the pool URL
   - The Frame will automatically load showing pool stats

3. **Users Can Interact**
   - View pool details directly in the frame
   - Click "View Pool" to open the full page
   - Click "Join Pool" (if available) to participate

### Example Frame Display

When someone shares a pool on Farcaster, recipients will see:

```
┌─────────────────────────────────┐
│        💰 SusuFlow              │
│      Pool Round 1               │
│                                 │
│  Contribution: 10 cUSD          │
│  Members: 3/10                  │
│                                 │
│  [🔍 View Pool] [🤝 Join Pool] │
└─────────────────────────────────┘
```

## Technical Details

### Files Added

```
frontend/
├── lib/
│   └── frames.ts                    # Frame utilities and types
├── app/
│   ├── api/
│   │   └── frames/
│   │       ├── pool-image/
│   │       │   └── route.tsx        # Dynamic image generation
│   │       ├── pool/
│   │       │   └── route.ts         # Pool frame handler
│   │       └── join/
│   │           └── route.ts         # Join action handler
│   └── pools/
│       └── [id]/
│           └── page.tsx             # Updated with frame metadata
```

### Environment Variables

Add to your `.env.local` (already configured):
```
NEXT_PUBLIC_BASE_URL=https://susuflow.netlify.app
```

## Frame Specification

Our frames follow the Farcaster Frame specification:
- **Version**: vNext
- **Image**: Dynamic OG images at 1200x630
- **Buttons**: Context-aware (view, join, etc.)
- **Actions**: Post and link actions supported

## Next Steps (Future Enhancements)

- ✅ Basic frame display and sharing
- 🔄 Wallet connection via frames
- 🔄 Direct pool joining from frame
- 🔄 Contribution status updates
- 🔄 Frame analytics

## Testing

1. Deploy to production (already done ✅)
2. Share a pool URL on Warpcast
3. Verify frame renders correctly
4. Test button interactions

## Resources

- [Farcaster Frames Documentation](https://docs.farcaster.xyz/reference/frames/spec)
- [Warpcast](https://warpcast.com) - Test your frames here
- [Frame Validator](https://warpcast.com/~/developers/frames) - Debug tool

---

**Status**: ✅ Farcaster Frame integration complete and ready for production!
