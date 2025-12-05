# Sure Predict - Production Deployment Guide

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure API Keys
Copy `.env.example` to `.env` and add your API keys:
```bash
cp .env.example .env
```

Get API keys from:
- **API-FOOTBALL**: https://rapidapi.com/api-sports/api/api-football (Recommended)
- **Football-Data.org**: https://www.football-data.org/ (Backup)

### 3. Run Server
```bash
npm start
```

Visit: http://localhost:3000

---

## ☁️ Deploy to Cloud (Production)

### Option 1: Railway (Easiest - Recommended)

1. **Sign up**: https://railway.app/
2. **Click**: "New Project" → "Deploy from GitHub"
3. **Connect**: Your GitHub repository
4. **Add Environment Variables**:
   - `API_FOOTBALL_KEY`
   - `PORT` (Railway auto-assigns)
5. **Deploy**: Automatic!

**Cost**: 
- Free tier: 500 hours/month
- Pro: $5/month for unlimited

---

### Option 2: Vercel (Fast & Free)

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Deploy**:
```bash
vercel --prod
```

3. **Add Environment Variables** in Vercel Dashboard

**Cost**: Free for hobby projects

---

### Option 3: Heroku (Traditional)

1. **Install Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli

2. **Login**:
```bash
heroku login
```

3. **Create App**:
```bash
heroku create sure-predict-app
```

4. **Set Environment Variables**:
```bash
heroku config:set API_FOOTBALL_KEY=your_key_here
```

5. **Deploy**:
```bash
git push heroku main
```

**Cost**: 
- Free tier available
- Hobby: $7/month

---

### Option 4: AWS (Enterprise Scale)

**For Millions of Users:**

1. **EC2 + Load Balancer**:
   - t3.medium instances ($30/month each)
   - Auto-scaling group (2-10 instances)
   - Application Load Balancer ($16/month)

2. **ElastiCache (Redis)**:
   - cache.t3.micro ($12/month)
   - Stores cached match data

3. **CloudFront CDN**:
   - $0.085 per GB transfer
   - Caches static files worldwide

4. **RDS (PostgreSQL)**:
   - db.t3.micro ($15/month)
   - Stores historical data

**Estimated Cost**: $150-500/month for 1M+ users

---

### Option 5: DigitalOcean (Balanced)

1. **Create Droplet**: $12/month (2GB RAM)
2. **Add Load Balancer**: $12/month
3. **Add Redis**: $15/month
4. **Setup Auto-scaling**: Scale to 5+ droplets

**Cost**: $40-150/month for moderate traffic

---

## 📊 Scaling for Millions

### Architecture:

```
Users → CDN (Cloudflare)
         ↓
    Load Balancer
         ↓
    Backend Servers (3-10 instances)
         ↓
    Redis Cache (shared)
         ↓
    PostgreSQL Database
         ↓
    API Service (single instance)
```

### Performance Optimization:

1. **Caching Strategy**:
   - Live scores: 30 seconds cache
   - Team data: 5 minutes cache
   - Static data: 1 hour cache

2. **Database Indexing**:
   - Index on match_id, team_id, date
   - Materialized views for standings

3. **CDN Configuration**:
   - Cache HTML/CSS/JS for 24 hours
   - Serve from edge locations worldwide

4. **Rate Limiting**:
   - 100 requests/minute per IP
   - 1000 requests/minute per API key

---

## 💰 Cost Breakdown (1 Million Users/Month)

### Minimum Setup:
- **API**: API-FOOTBALL Pro ($35/month)
- **Hosting**: Railway Pro ($20/month)
- **CDN**: Cloudflare Free
- **Total**: $55/month

### Recommended Setup:
- **API**: API-FOOTBALL Premium ($150/month)
- **Servers**: AWS EC2 x3 ($90/month)
- **Cache**: Redis ($15/month)
- **Database**: RDS ($25/month)
- **CDN**: CloudFront ($50/month)
- **Load Balancer**: ($20/month)
- **Total**: $350/month

### Enterprise Setup (10M+ users):
- **API**: Sportradar ($2000/month)
- **Infrastructure**: AWS Auto-scaling ($1500/month)
- **CDN**: CloudFront ($300/month)
- **Monitoring**: DataDog ($100/month)
- **Total**: $3900/month

---

## 🔧 Environment Variables Needed:

```env
API_FOOTBALL_KEY=your_rapidapi_key
PORT=3000
NODE_ENV=production
CACHE_TTL=60
```

---

## 📈 Monitoring Setup:

1. **Add Logging** (Winston/Morgan)
2. **Error Tracking** (Sentry)
3. **Performance Monitoring** (New Relic/DataDog)
4. **Uptime Monitoring** (Uptime Robot)

---

## 🔒 Security:

1. **API Key Protection**: Use environment variables
2. **Rate Limiting**: Implement per-IP limits
3. **CORS**: Configure allowed origins
4. **HTTPS**: Enable SSL certificates (free with Let's Encrypt)

---

## 📞 Support & Next Steps:

1. Start with **Railway** (easiest for beginners)
2. Monitor traffic and costs
3. Scale up as you grow
4. Consider CDN when you hit 100k users
5. Move to AWS/Google Cloud at 1M+ users

Ready to deploy! 🚀
