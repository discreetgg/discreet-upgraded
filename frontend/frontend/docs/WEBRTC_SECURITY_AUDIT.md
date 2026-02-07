# 🔒 WebRTC Security Audit & Vulnerabilities

## ⚠️ CRITICAL Security Issues Found

### 1. **NO AUTHORIZATION** - CRITICAL
**Vulnerability**: Anyone can call anyone without permission checks
```typescript
// Current backend (INSECURE):
socket.on('webrtc:offer', (data) => {
  io.to(data.to).emit('webrtc:offer', { from: userId, ...data });
  // ❌ No check if user is allowed to call this person!
});
```

**Attack**: Malicious user can spam anyone with calls
**Impact**: Harassment, service abuse
**Fix**: Add authorization check

---

### 2. **SIGNAL INJECTION** - HIGH
**Vulnerability**: No validation of signaling messages
```typescript
// Attacker can inject malicious SDP/ICE candidates
socket.on('webrtc:ice-candidate', (data) => {
  io.to(data.to).emit('webrtc:ice-candidate', {
    from: userId,
    candidate: data.candidate, // ❌ Not validated!
  });
});
```

**Attack**: Send crafted SDP to exploit codec vulnerabilities
**Impact**: Potential browser exploits, DoS
**Fix**: Validate SDP and ICE candidate format

---

### 3. **USER ID SPOOFING** - HIGH
**Vulnerability**: Backend trusts client-provided user IDs
```typescript
// Attacker could claim to be someone else
const userId = socket.handshake.query.discordId; // ❌ Not verified!
```

**Attack**: Impersonate other users in calls
**Impact**: Privacy breach, phishing
**Fix**: Use authenticated session user ID

---

### 4. **NO RATE LIMITING** - MEDIUM
**Vulnerability**: No limits on call attempts
**Attack**: Flood target with call offers
**Impact**: DoS, harassment
**Fix**: Implement rate limiting

---

### 5. **NO CALL SESSION VALIDATION** - MEDIUM
**Vulnerability**: No tracking of active call sessions
```typescript
// Anyone can send answer/ICE candidates at any time
socket.on('webrtc:answer', (data) => {
  // ❌ No check if there's an active call!
});
```

**Attack**: Send fake answers to disrupt calls
**Impact**: Call hijacking, confusion
**Fix**: Track active call sessions

---

### 6. **STUN/TURN SECURITY** - LOW
**Current**: Using public Google STUN servers (OK for testing)
**Issues**: 
- TURN credentials exposed in frontend code
- No credential rotation
- Static configuration

**Fix**: Generate temporary TURN credentials server-side

---

### 7. **NO ENCRYPTION VALIDATION** - INFO
**Status**: WebRTC uses DTLS-SRTP by default (good!)
**Risk**: If DTLS fails, connection might fallback to unencrypted
**Fix**: Enforce encryption, reject unencrypted connections

---

## 🛡️ Security Fixes Required

### Priority 1: Authorization & Authentication

```typescript
// Backend: Verify call permission
interface CallPermissionCheck {
  callerId: string;
  calleeId: string;
}

async function canUserCall(caller: string, callee: string): Promise<boolean> {
  // Check if users are:
  // 1. Following each other
  // 2. Have an existing conversation
  // 3. Callee has enabled calls from this user
  // 4. Not blocked
  
  const [isFollowing, hasConversation, isBlocked] = await Promise.all([
    checkFollowStatus(caller, callee),
    checkConversationExists(caller, callee),
    checkBlockStatus(caller, callee),
  ]);
  
  return (isFollowing || hasConversation) && !isBlocked;
}

// Apply to handlers:
socket.on('webrtc:offer', async (data) => {
  const userId = socket.data.userId; // From authenticated session!
  
  // ✅ Authorization check
  const canCall = await canUserCall(userId, data.to);
  if (!canCall) {
    socket.emit('webrtc:error', { 
      code: 'UNAUTHORIZED',
      message: 'You are not authorized to call this user' 
    });
    return;
  }
  
  // ✅ Validate target user exists and is online
  const targetSocket = await findUserSocket(data.to);
  if (!targetSocket) {
    socket.emit('webrtc:error', { 
      code: 'USER_OFFLINE',
      message: 'User is not available' 
    });
    return;
  }
  
  io.to(data.to).emit('webrtc:offer', {
    from: userId, // Use authenticated ID, not client-provided!
    offer: data.offer,
    callType: data.callType,
  });
});
```

### Priority 2: Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// In-memory store for call attempts
const callAttempts = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const attempts = callAttempts.get(userId) || [];
  
  // Keep only attempts from last minute
  const recentAttempts = attempts.filter(time => now - time < 60000);
  
  // Max 5 calls per minute
  if (recentAttempts.length >= 5) {
    return false;
  }
  
  recentAttempts.push(now);
  callAttempts.set(userId, recentAttempts);
  return true;
}

socket.on('webrtc:offer', async (data) => {
  const userId = socket.data.userId;
  
  // ✅ Rate limiting
  if (!checkRateLimit(userId)) {
    socket.emit('webrtc:error', {
      code: 'RATE_LIMIT',
      message: 'Too many call attempts. Please wait.'
    });
    return;
  }
  
  // ... rest of handler
});
```

### Priority 3: Session Management

```typescript
// Track active call sessions
interface CallSession {
  caller: string;
  callee: string;
  startTime: number;
  status: 'ringing' | 'connected' | 'ended';
}

const activeCalls = new Map<string, CallSession>();

function createCallSession(caller: string, callee: string): string {
  const sessionId = `${caller}_${callee}_${Date.now()}`;
  activeCalls.set(sessionId, {
    caller,
    callee,
    startTime: Date.now(),
    status: 'ringing',
  });
  return sessionId;
}

socket.on('webrtc:offer', async (data) => {
  const userId = socket.data.userId;
  
  // ✅ Check if user is already in a call
  const existingCall = Array.from(activeCalls.values()).find(
    call => call.caller === userId || call.callee === userId
  );
  
  if (existingCall && existingCall.status !== 'ended') {
    socket.emit('webrtc:error', {
      code: 'CALL_IN_PROGRESS',
      message: 'You are already in a call'
    });
    return;
  }
  
  // ✅ Create new session
  const sessionId = createCallSession(userId, data.to);
  
  io.to(data.to).emit('webrtc:offer', {
    from: userId,
    offer: data.offer,
    callType: data.callType,
    sessionId, // Include session ID for validation
  });
});

socket.on('webrtc:answer', async (data) => {
  const userId = socket.data.userId;
  const session = activeCalls.get(data.sessionId);
  
  // ✅ Validate session exists and user is participant
  if (!session || session.callee !== userId) {
    socket.emit('webrtc:error', {
      code: 'INVALID_SESSION',
      message: 'Invalid call session'
    });
    return;
  }
  
  // ✅ Update session status
  session.status = 'connected';
  
  io.to(session.caller).emit('webrtc:answer', {
    from: userId,
    answer: data.answer,
    sessionId: data.sessionId,
  });
});
```

### Priority 4: Input Validation

```typescript
import Joi from 'joi';

// Validate SDP offer/answer
const sdpSchema = Joi.object({
  type: Joi.string().valid('offer', 'answer').required(),
  sdp: Joi.string().required().max(100000), // Limit size
});

// Validate ICE candidate
const iceCandidateSchema = Joi.object({
  candidate: Joi.string().required().max(1000),
  sdpMid: Joi.string().allow(null, ''),
  sdpMLineIndex: Joi.number().allow(null),
});

socket.on('webrtc:offer', async (data) => {
  // ✅ Validate input
  const { error } = sdpSchema.validate(data.offer);
  if (error) {
    socket.emit('webrtc:error', {
      code: 'INVALID_OFFER',
      message: 'Invalid SDP offer format'
    });
    return;
  }
  
  // ... rest of handler
});

socket.on('webrtc:ice-candidate', async (data) => {
  // ✅ Validate ICE candidate
  const { error } = iceCandidateSchema.validate(data.candidate);
  if (error) {
    socket.emit('webrtc:error', {
      code: 'INVALID_CANDIDATE',
      message: 'Invalid ICE candidate format'
    });
    return;
  }
  
  // ... rest of handler
});
```

### Priority 5: Temporary TURN Credentials

```typescript
import crypto from 'crypto';

// Generate temporary TURN credentials (valid for 1 hour)
function generateTurnCredentials(username: string): {
  urls: string[];
  username: string;
  credential: string;
} {
  const ttl = 3600; // 1 hour
  const timestamp = Math.floor(Date.now() / 1000) + ttl;
  const turnUsername = `${timestamp}:${username}`;
  
  // Generate credential using HMAC-SHA1
  const hmac = crypto.createHmac('sha1', process.env.TURN_SECRET!);
  hmac.update(turnUsername);
  const credential = hmac.digest('base64');
  
  return {
    urls: [
      'turn:your-turn-server.com:3478',
      'turns:your-turn-server.com:5349', // TLS for extra security
    ],
    username: turnUsername,
    credential,
  };
}

// API endpoint to get TURN credentials
app.post('/api/webrtc/turn-credentials', authenticate, (req, res) => {
  const credentials = generateTurnCredentials(req.user.id);
  res.json(credentials);
});
```

---

## 📋 Security Checklist

- [ ] **Authorization**: Check if users can call each other
- [ ] **Authentication**: Use session user ID, not client-provided
- [ ] **Rate Limiting**: Max 5 calls/minute per user
- [ ] **Session Management**: Track active calls
- [ ] **Input Validation**: Validate all SDP/ICE messages
- [ ] **TURN Security**: Generate temporary credentials
- [ ] **Encryption**: Enforce DTLS-SRTP
- [ ] **Logging**: Log all call attempts for audit
- [ ] **Privacy**: No call recording without consent
- [ ] **Blocking**: Respect user block lists

---

## 🚨 Additional Recommendations

### 1. Content Security Policy
```typescript
// Add CSP headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; connect-src 'self' wss://api.discreet.fans"
  );
  next();
});
```

### 2. Call Logging
```typescript
// Log all calls for security audit
interface CallLog {
  sessionId: string;
  caller: string;
  callee: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'completed' | 'rejected' | 'failed';
}

async function logCall(log: CallLog) {
  await db.callLogs.insert(log);
}
```

### 3. Emergency Kill Switch
```typescript
// Admin endpoint to kill all active calls
app.post('/api/admin/kill-all-calls', adminAuth, (req, res) => {
  activeCalls.clear();
  io.emit('webrtc:force-disconnect');
  res.json({ message: 'All calls terminated' });
});
```

### 4. Privacy Mode
```typescript
// Users can set who can call them
enum CallPrivacy {
  EVERYONE = 'everyone',
  FOLLOWING = 'following',
  MUTUAL_FOLLOWING = 'mutual_following',
  NO_ONE = 'no_one',
}

async function canUserCall(caller: string, callee: string): Promise<boolean> {
  const calleeSettings = await getUserCallSettings(callee);
  
  switch (calleeSettings.privacy) {
    case CallPrivacy.NO_ONE:
      return false;
    case CallPrivacy.MUTUAL_FOLLOWING:
      return await areMutualFollowing(caller, callee);
    case CallPrivacy.FOLLOWING:
      return await isFollowing(callee, caller);
    case CallPrivacy.EVERYONE:
      return true;
  }
}
```

---

## 🎯 Implementation Priority

1. **Week 1**: Authorization + Authentication (CRITICAL)
2. **Week 1**: Rate Limiting (HIGH)
3. **Week 2**: Session Management (HIGH)
4. **Week 2**: Input Validation (MEDIUM)
5. **Week 3**: TURN Security (MEDIUM)
6. **Week 3**: Logging & Monitoring (LOW)

---

## ⚡ Quick Security Wins (Do Now)

```typescript
// 1. Use authenticated user ID
const userId = socket.data.userId; // NOT socket.handshake.query.discordId

// 2. Add basic authorization check
if (!await canUserCall(userId, data.to)) {
  return socket.emit('error', 'Unauthorized');
}

// 3. Validate recipient exists
if (!await userExists(data.to)) {
  return socket.emit('error', 'User not found');
}

// 4. Add rate limiting
if (!checkRateLimit(userId)) {
  return socket.emit('error', 'Too many requests');
}

// 5. Log all attempts
await logCallAttempt(userId, data.to);
```

These 5 lines will fix 80% of security issues!
