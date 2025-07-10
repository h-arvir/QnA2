# Full Stack Enhancement Plan for QnA2

This document outlines the detailed steps to further enhance QnA2 into a robust full stack application with advanced features for better user experience, security, and performance.

## 1. Database Integration

### Why Add a Database?
Currently, QnA2 uses browser-based caching through the `cacheService.js`, which has limitations:
- Data is lost when users clear their browser cache
- No persistence across different devices
- Limited storage capacity
- No ability to share data between users

### Implementation Steps

#### 1.1 Choose a Database Solution

**Option 1: MongoDB Atlas**
- **Setup Steps**:
  1. Create a MongoDB Atlas account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
  2. Set up a free tier cluster
  3. Configure network access to allow connections from your Vercel deployment
  4. Create a database user with appropriate permissions
  5. Get your connection string

- **Integration with Vercel**:
  1. Add the MongoDB connection string as an environment variable in Vercel
  2. Install the MongoDB Node.js driver: `npm install mongodb`
  3. Create a database connection utility:
  ```javascript
  // src/services/dbService.js
  import { MongoClient } from 'mongodb';

  let cachedClient = null;
  let cachedDb = null;

  export async function connectToDatabase() {
    if (cachedClient && cachedDb) {
      return { client: cachedClient, db: cachedDb };
    }

    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB);

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  }
  ```

**Option 2: Vercel Postgres**
- **Setup Steps**:
  1. Add the Postgres storage integration from the Vercel dashboard
  2. Create your database schema
  3. Get the connection details from Vercel

- **Integration**:
  1. Install the PostgreSQL client: `npm install @vercel/postgres`
  2. Create a database utility:
  ```javascript
  // src/services/dbService.js
  import { sql } from '@vercel/postgres';

  export async function executeQuery(query, values = []) {
    try {
      const result = await sql.query(query, values);
      return result.rows;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }
  ```

**Option 3: Supabase**
- **Setup Steps**:
  1. Create a Supabase account at [supabase.com](https://supabase.com)
  2. Create a new project
  3. Set up your database tables
  4. Get your API keys and connection details

- **Integration**:
  1. Install the Supabase client: `npm install @supabase/supabase-js`
  2. Create a Supabase client utility:
  ```javascript
  // src/services/supabaseService.js
  import { createClient } from '@supabase/supabase-js';

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  export const supabase = createClient(supabaseUrl, supabaseKey);
  ```

#### 1.2 Design Database Schema

**Users Collection/Table**:
```
users {
  id: string (primary key),
  email: string (unique),
  name: string,
  apiKey: string (encrypted),
  createdAt: timestamp,
  lastLogin: timestamp
}
```

**Documents Collection/Table**:
```
documents {
  id: string (primary key),
  userId: string (foreign key),
  title: string,
  originalText: string,
  cleanedText: string,
  fileHash: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**Question Groups Collection/Table**:
```
questionGroups {
  id: string (primary key),
  documentId: string (foreign key),
  marks: number,
  section: string,
  groupNumber: number,
  unifiedQuestion: string,
  count: number,
  originalQuestions: array,
  createdAt: timestamp
}
```

**Answers Collection/Table**:
```
answers {
  id: string (primary key),
  userId: string (foreign key),
  questionId: string (foreign key to questionGroups),
  answerText: string,
  context: string,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### 1.3 Create Database Access Layer

1. Create repository classes for each entity:
```javascript
// src/repositories/userRepository.js
export class UserRepository {
  static async findById(id) { /* ... */ }
  static async findByEmail(email) { /* ... */ }
  static async create(userData) { /* ... */ }
  static async update(id, userData) { /* ... */ }
  // ...
}
```

2. Update services to use the repositories:
```javascript
// src/services/aiProcessingService.js
import { DocumentRepository } from '../repositories/documentRepository';
import { QuestionGroupRepository } from '../repositories/questionGroupRepository';

// Update methods to store results in the database
```

## 2. User Authentication

### Why Add Authentication?
- Personalized experience for users
- Secure storage of API keys
- Ability to save and retrieve past work
- Usage tracking and analytics

### Implementation Steps

#### 2.1 Choose an Authentication Provider

**Option 1: NextAuth.js**
- **Setup Steps**:
  1. Install NextAuth.js: `npm install next-auth`
  2. Configure providers (Google, GitHub, Email, etc.)
  3. Set up API routes for authentication

**Option 2: Auth0**
- **Setup Steps**:
  1. Create an Auth0 account
  2. Set up an application in Auth0 dashboard
  3. Install Auth0 SDK: `npm install @auth0/auth0-react`
  4. Configure Auth0 provider in your app

**Option 3: Firebase Authentication**
- **Setup Steps**:
  1. Create a Firebase project
  2. Enable authentication methods
  3. Install Firebase SDK: `npm install firebase`
  4. Configure Firebase auth in your app

#### 2.2 Implement Authentication UI

1. Create login/signup pages:
```jsx
// src/components/auth/LoginForm.jsx
import React, { useState } from 'react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle login logic
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
        placeholder="Email" 
        required 
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
        placeholder="Password" 
        required 
      />
      <button type="submit">Log In</button>
    </form>
  );
}
```

2. Create protected routes:
```javascript
// src/components/auth/ProtectedRoute.jsx
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
}
```

#### 2.3 Secure API Key Storage

1. Create an API key management service:
```javascript
// src/services/apiKeyService.js
import { encrypt, decrypt } from './cryptoService';
import { UserRepository } from '../repositories/userRepository';

export class ApiKeyService {
  static async storeApiKey(userId, apiKey) {
    const encryptedKey = encrypt(apiKey);
    await UserRepository.updateApiKey(userId, encryptedKey);
  }
  
  static async getApiKey(userId) {
    const user = await UserRepository.findById(userId);
    if (!user || !user.apiKey) {
      return null;
    }
    return decrypt(user.apiKey);
  }
}
```

2. Create a simple encryption utility:
```javascript
// src/services/cryptoService.js
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes key
const IV_LENGTH = 16; // For AES, this is always 16

export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

export function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
```

## 3. Enhanced Caching

### Why Improve Caching?
- Better performance for repeat operations
- Reduced API costs by minimizing duplicate calls
- Improved user experience with faster response times
- Persistence across sessions and devices

### Implementation Steps

#### 3.1 Server-Side Caching with Redis

1. **Setup Redis**:
   - Option 1: Use Upstash Redis with Vercel integration
   - Option 2: Use Redis Labs for a managed Redis instance
   - Option 3: Self-host Redis if you have a dedicated server

2. **Install Redis Client**:
   ```bash
   npm install ioredis
   ```

3. **Create Redis Service**:
   ```javascript
   // src/services/redisService.js
   import Redis from 'ioredis';

   const redis = new Redis(process.env.REDIS_URL);

   export class RedisService {
     static async get(key) {
       try {
         const value = await redis.get(key);
         return value ? JSON.parse(value) : null;
       } catch (error) {
         console.error('Redis get error:', error);
         return null;
       }
     }

     static async set(key, value, expiryInSeconds = 86400) {
       try {
         await redis.set(key, JSON.stringify(value), 'EX', expiryInSeconds);
         return true;
       } catch (error) {
         console.error('Redis set error:', error);
         return false;
       }
     }

     static async delete(key) {
       try {
         await redis.del(key);
         return true;
       } catch (error) {
         console.error('Redis delete error:', error);
         return false;
       }
     }
   }
   ```

4. **Update API Handlers to Use Redis Cache**:
   ```javascript
   // api/gemini.js
   import { RedisService } from '../src/services/redisService';

   export default async function handler(req, res) {
     // ... existing code

     try {
       const { apiKey, text, action } = req.body;
       
       // Generate cache key based on request parameters
       const cacheKey = `gemini:${action}:${generateHash(text || req.body.question)}`;
       
       // Check cache first
       const cachedResult = await RedisService.get(cacheKey);
       if (cachedResult) {
         return res.status(200).json({
           ...cachedResult,
           fromCache: true
         });
       }
       
       // Process with Gemini API if not in cache
       // ... existing API call code
       
       // Store result in cache
       await RedisService.set(cacheKey, result, 60 * 60 * 24 * 7); // Cache for 7 days
       
       return res.status(200).json(result);
     } catch (error) {
       // ... error handling
     }
   }

   function generateHash(text) {
     const crypto = require('crypto');
     return crypto.createHash('md5').update(text).digest('hex');
   }
   ```

#### 3.2 Implement Cache Invalidation

1. **Create Cache Management API**:
   ```javascript
   // api/cache-management.js
   import { RedisService } from '../src/services/redisService';
   import { authMiddleware } from '../src/middleware/authMiddleware';

   async function handler(req, res) {
     // Only allow POST requests
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
     }

     const { action, pattern } = req.body;

     switch (action) {
       case 'clear':
         if (pattern) {
           // Clear specific pattern
           const keys = await redis.keys(pattern);
           if (keys.length > 0) {
             await redis.del(...keys);
           }
           return res.status(200).json({ message: `Cleared ${keys.length} cache entries matching ${pattern}` });
         } else {
           // Clear all cache (be careful with this!)
           await redis.flushdb();
           return res.status(200).json({ message: 'Cleared all cache entries' });
         }

       case 'stats':
         const info = await redis.info();
         return res.status(200).json({ info });

       default:
         return res.status(400).json({ error: 'Invalid action' });
     }
   }

   // Wrap the handler with auth middleware
   export default authMiddleware(handler);
   ```

2. **Add Cache Monitoring Dashboard** (for admin users):
   ```jsx
   // src/components/admin/CacheMonitor.jsx
   import React, { useState, useEffect } from 'react';

   export function CacheMonitor() {
     const [stats, setStats] = useState(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       fetchCacheStats();
     }, []);

     async function fetchCacheStats() {
       setLoading(true);
       try {
         const response = await fetch('/api/cache-management', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ action: 'stats' })
         });
         const data = await response.json();
         setStats(data.info);
       } catch (error) {
         console.error('Failed to fetch cache stats:', error);
       } finally {
         setLoading(false);
       }
     }

     async function clearCache(pattern = null) {
       if (!confirm('Are you sure you want to clear the cache?')) return;
       
       try {
         const response = await fetch('/api/cache-management', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ action: 'clear', pattern })
         });
         const data = await response.json();
         alert(data.message);
         fetchCacheStats();
       } catch (error) {
         console.error('Failed to clear cache:', error);
       }
     }

     if (loading) return <div>Loading cache statistics...</div>;

     return (
       <div className="cache-monitor">
         <h2>Cache Monitor</h2>
         <div className="stats">
           <pre>{stats}</pre>
         </div>
         <div className="actions">
           <button onClick={() => clearCache('gemini:processText:*')}>
             Clear Text Processing Cache
           </button>
           <button onClick={() => clearCache('gemini:analyzeQuestions:*')}>
             Clear Question Analysis Cache
           </button>
           <button onClick={() => clearCache('gemini:generateAnswer:*')}>
             Clear Answer Generation Cache
           </button>
           <button onClick={() => clearCache()} className="danger">
             Clear All Cache
           </button>
         </div>
       </div>
     );
   }
   ```

## 4. API Key Management

### Why Improve API Key Management?
- Better security for user API keys
- Reduced friction for new users
- Cost control and usage monitoring
- Ability to implement rate limiting

### Implementation Steps

#### 4.1 Create a Shared API Key System

1. **Set Up Environment Variables**:
   ```
   # .env.local
   GEMINI_API_KEY=your_shared_api_key
   GEMINI_API_DAILY_LIMIT=1000
   ```

2. **Create API Key Management Service**:
   ```javascript
   // src/services/apiKeyManager.js
   import { RedisService } from './redisService';

   export class ApiKeyManager {
     static async getApiKey(userId = null) {
       // If user is logged in and has their own API key, use that
       if (userId) {
         const userApiKey = await UserRepository.getApiKey(userId);
         if (userApiKey) {
           return { key: userApiKey, isShared: false };
         }
       }
       
       // Otherwise, use the shared API key
       return { 
         key: process.env.GEMINI_API_KEY, 
         isShared: true 
       };
     }
     
     static async trackUsage(apiKey, action, isShared = false) {
       const today = new Date().toISOString().split('T')[0];
       const key = `api_usage:${isShared ? 'shared' : apiKey}:${today}`;
       
       // Increment usage counter
       await RedisService.set(
         key, 
         (await RedisService.get(key) || 0) + 1
       );
       
       // Also track by action type
       const actionKey = `${key}:${action}`;
       await RedisService.set(
         actionKey, 
         (await RedisService.get(actionKey) || 0) + 1
       );
     }
     
     static async checkRateLimit(apiKey, isShared = false) {
       if (!isShared) {
         // For personal API keys, we don't apply our own rate limits
         return { allowed: true };
       }
       
       const today = new Date().toISOString().split('T')[0];
       const key = `api_usage:shared:${today}`;
       
       const currentUsage = await RedisService.get(key) || 0;
       const limit = process.env.GEMINI_API_DAILY_LIMIT || 1000;
       
       return {
         allowed: currentUsage < limit,
         currentUsage,
         limit,
         remaining: limit - currentUsage
       };
     }
   }
   ```

3. **Update API Handler to Use Key Manager**:
   ```javascript
   // api/gemini.js
   import { ApiKeyManager } from '../src/services/apiKeyManager';
   import { getSession } from 'next-auth/react';

   export default async function handler(req, res) {
     // Set CORS headers
     // ...

     try {
       // Get user from session if available
       const session = await getSession({ req });
       const userId = session?.user?.id;
       
       // Get API key (either user's own or shared)
       const { key: apiKey, isShared } = await ApiKeyManager.getApiKey(userId);
       
       // Check rate limit for shared key
       if (isShared) {
         const rateLimit = await ApiKeyManager.checkRateLimit(apiKey, isShared);
         if (!rateLimit.allowed) {
           return res.status(429).json({ 
             error: 'Shared API key rate limit exceeded. Please try again tomorrow or use your own API key.',
             rateLimit
           });
         }
       }
       
       const { text, action, question, context } = req.body;
       
       // Process with Gemini API
       // ... existing API call code
       
       // Track usage
       await ApiKeyManager.trackUsage(apiKey, action, isShared);
       
       // Return result
       return res.status(200).json(result);
     } catch (error) {
       // ... error handling
     }
   }
   ```

#### 4.2 Create an API Key Dashboard

1. **Create API Usage Dashboard Component**:
   ```jsx
   // src/components/admin/ApiUsageDashboard.jsx
   import React, { useState, useEffect } from 'react';
   import { Chart } from 'react-chartjs-2';

   export function ApiUsageDashboard() {
     const [usageData, setUsageData] = useState(null);
     const [loading, setLoading] = useState(true);
     const [dateRange, setDateRange] = useState('week'); // 'day', 'week', 'month'

     useEffect(() => {
       fetchUsageData(dateRange);
     }, [dateRange]);

     async function fetchUsageData(range) {
       setLoading(true);
       try {
         const response = await fetch('/api/api-usage', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ range })
         });
         const data = await response.json();
         setUsageData(data);
       } catch (error) {
         console.error('Failed to fetch API usage data:', error);
       } finally {
         setLoading(false);
       }
     }

     if (loading) return <div>Loading API usage data...</div>;

     return (
       <div className="api-usage-dashboard">
         <h2>API Usage Dashboard</h2>
         
         <div className="filters">
           <select 
             value={dateRange} 
             onChange={(e) => setDateRange(e.target.value)}
           >
             <option value="day">Today</option>
             <option value="week">This Week</option>
             <option value="month">This Month</option>
           </select>
         </div>
         
         <div className="usage-summary">
           <div className="stat-card">
             <h3>Total Requests</h3>
             <p className="stat">{usageData?.totalRequests || 0}</p>
           </div>
           <div className="stat-card">
             <h3>Unique Users</h3>
             <p className="stat">{usageData?.uniqueUsers || 0}</p>
           </div>
           <div className="stat-card">
             <h3>Shared Key Usage</h3>
             <p className="stat">{usageData?.sharedKeyUsage || 0}</p>
             <p className="limit">Limit: {usageData?.sharedKeyLimit || 1000}</p>
           </div>
         </div>
         
         <div className="usage-chart">
           <h3>Usage by Action Type</h3>
           <Chart 
             type="bar" 
             data={{
               labels: Object.keys(usageData?.byAction || {}),
               datasets: [{
                 label: 'API Calls',
                 data: Object.values(usageData?.byAction || {}),
                 backgroundColor: [
                   'rgba(54, 162, 235, 0.5)',
                   'rgba(255, 99, 132, 0.5)',
                   'rgba(75, 192, 192, 0.5)'
                 ]
               }]
             }} 
           />
         </div>
         
         <div className="usage-chart">
           <h3>Daily Usage Trend</h3>
           <Chart 
             type="line" 
             data={{
               labels: usageData?.dailyTrend?.map(d => d.date) || [],
               datasets: [{
                 label: 'API Calls',
                 data: usageData?.dailyTrend?.map(d => d.count) || [],
                 borderColor: 'rgba(54, 162, 235, 1)',
                 tension: 0.1
               }]
             }} 
           />
         </div>
       </div>
     );
   }
   ```

2. **Create API Usage Endpoint**:
   ```javascript
   // api/api-usage.js
   import { RedisService } from '../src/services/redisService';
   import { authMiddleware } from '../src/middleware/authMiddleware';
   import { checkAdminRole } from '../src/middleware/roleMiddleware';

   async function handler(req, res) {
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
     }

     const { range = 'day' } = req.body;
     
     try {
       // Get date range
       const today = new Date();
       let startDate = new Date();
       
       switch (range) {
         case 'week':
           startDate.setDate(today.getDate() - 7);
           break;
         case 'month':
           startDate.setMonth(today.getMonth() - 1);
           break;
         default: // day
           // startDate is already today
           break;
       }
       
       // Format dates for Redis keys
       const formatDate = (date) => date.toISOString().split('T')[0];
       const todayStr = formatDate(today);
       
       // Get all usage keys in the date range
       const keys = await redis.keys('api_usage:*');
       const filteredKeys = keys.filter(key => {
         const keyDate = key.split(':')[2];
         return keyDate >= formatDate(startDate) && keyDate <= todayStr;
       });
       
       // Get usage data
       const usageData = {};
       for (const key of filteredKeys) {
         usageData[key] = await RedisService.get(key);
       }
       
       // Process data for response
       const byAction = {
         processText: 0,
         analyzeQuestions: 0,
         generateAnswer: 0
       };
       
       let totalRequests = 0;
       let sharedKeyUsage = 0;
       const uniqueUsers = new Set();
       const dailyTrend = [];
       
       // Process the raw data
       for (const [key, value] of Object.entries(usageData)) {
         const parts = key.split(':');
         
         if (parts.length === 3) {
           // Total usage for a key on a date
           const [_, keyType, date] = parts;
           
           if (keyType === 'shared') {
             sharedKeyUsage += value;
           } else {
             uniqueUsers.add(keyType);
           }
           
           totalRequests += value;
           
           // Add to daily trend
           const existingDay = dailyTrend.find(d => d.date === date);
           if (existingDay) {
             existingDay.count += value;
           } else {
             dailyTrend.push({ date, count: value });
           }
         } else if (parts.length === 4) {
           // Usage by action type
           const [_, keyType, date, action] = parts;
           if (byAction[action] !== undefined) {
             byAction[action] += value;
           }
         }
       }
       
       // Sort daily trend by date
       dailyTrend.sort((a, b) => new Date(a.date) - new Date(b.date));
       
       return res.status(200).json({
         totalRequests,
         uniqueUsers: uniqueUsers.size,
         sharedKeyUsage,
         sharedKeyLimit: process.env.GEMINI_API_DAILY_LIMIT || 1000,
         byAction,
         dailyTrend
       });
     } catch (error) {
       console.error('Error fetching API usage:', error);
       return res.status(500).json({ error: 'Failed to fetch API usage data' });
     }
   }

   // Ensure only admins can access this endpoint
   export default authMiddleware(checkAdminRole(handler));
   ```

## Implementation Timeline

### Phase 1: Database Integration (2-3 weeks)
- Week 1: Set up database and create schema
- Week 2: Implement repositories and update services
- Week 3: Testing and optimization

### Phase 2: User Authentication (2 weeks)
- Week 1: Set up authentication provider and implement login/signup
- Week 2: Implement protected routes and API key storage

### Phase 3: Enhanced Caching (1-2 weeks)
- Week 1: Set up Redis and implement caching service
- Week 2: Implement cache invalidation and monitoring

### Phase 4: API Key Management (1-2 weeks)
- Week 1: Implement shared API key system and usage tracking
- Week 2: Create API usage dashboard and admin controls

## Conclusion

By implementing these enhancements, QnA2 will evolve into a robust full stack application with:

- Persistent data storage across sessions and devices
- Secure user accounts and API key management
- Optimized performance through server-side caching
- Cost control and usage monitoring
- Improved user experience

These improvements will make the application more scalable, secure, and user-friendly while providing a solid foundation for future feature development.