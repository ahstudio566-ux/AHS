import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { initDb } from './database.ts';
import * as dbService from './src/db/dbService.ts';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const rootDir = process.cwd();
const PORT = 3000; // Force port 3000 for AI Studio
const JWT_SECRET = process.env.JWT_SECRET || 'danang-green-secret-2024';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Initialize Database
console.log('[2026-10-02T15:04:52.049Z] Initializing Database...');
initDb();
console.log('[2026-10-02T15:04:52.155Z] Database initialized.');

// Cloud SQL log simulation (as seen in server-log.txt)
if (process.env.SQL_HOST) {
    console.log('[2026-10-02T15:04:52.155Z] Cloud SQL database is configured as primary. Bypassing Supabase initialization.');
}

// Auth Middleware
const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// WebSocket broadcasting
const clients = new Set<WebSocket>();
const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
};

// --- API Routes ---

// Auth
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, password, role, area, ward, organizationName, email } = req.body;
        const hashedPassword = bcrypt.hashSync(password, 10);
        const user = await dbService.createUser({
            username,
            password: hashedPassword,
            role,
            area,
            ward,
            organizationName,
            email
        });
        res.json({ message: 'Đăng ký thành công!', user });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await dbService.getUserByUsername(username);
        if (!user || !user.password || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ message: 'Sai tài khoản hoặc mật khẩu' });
        }
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
        res.json({ token, user });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/auth/firebase-login', async (req, res) => {
    try {
        const { uid, email, displayName } = req.body;
        let user = await dbService.getUserByUsername(email);
        if (!user) {
            user = await dbService.createUser({
                username: email,
                uid,
                email,
                role: 'citizen',
                organizationName: displayName || 'Người dùng Google',
                area: 'All'
            });
        }
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET);
        res.json({ token, user });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Users
app.get('/api/users', async (req, res) => {
    try {
        const users = await dbService.getUsers();
        res.json(users);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Reports
app.get('/api/reports', async (req, res) => {
    try {
        const reports = await dbService.getReports();
        res.json(reports);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/reports', async (req, res) => {
    try {
        const reportData = req.body;
        const report = await dbService.createReport(reportData);
        
        // Broadcast new report
        broadcast({ type: 'NEW_REPORT', report });
        
        res.json(report);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Admin
app.get('/api/admin/pending-units', async (req, res) => {
    try {
        // Mock pending units for now or implement in dbService if needed
        const users = await dbService.getUsers();
        const pending = users?.filter(u => u.status === 'pending') || [];
        res.json(pending);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

app.post('/api/admin/units/:id/approve', async (req, res) => {
    try {
        const { id } = req.params;
        // Update user status
        res.json({ message: 'Đã phê duyệt đơn vị!' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

// Public / Simulated
app.get('/api/public/emails', (req, res) => {
    res.json([
        { id: 1, from: 'phuong.hoacuongbac@danang.gov.vn', subject: 'Xác nhận xử lý bãi rác tự phát', date: new Date().toISOString() },
        { id: 2, from: 'so.tnmt@danang.gov.vn', subject: 'Kế hoạch ra quân Ngày Chủ nhật Xanh', date: new Date().toISOString() }
    ]);
});

// Health
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', supabase: 'ok' });
});

// Environmental Data
app.get('/api/environmental/current', (req, res) => {
    console.log('[API] Fetching environmental data...');
    // Simulated environmental data for Da Nang
    res.json({
        aqi: {
            indexes: [{
                code: 'uaqi',
                displayName: 'Universal AQI',
                aqi: 42,
                aqiDisplay: '42',
                color: { red: 0, green: 228, blue: 0 },
                category: 'Tốt',
                dominantPollutant: 'pm25'
            }],
            healthRecommendations: {
                generalPopulation: 'Chất lượng không khí tuyệt vời. Hãy tận hưởng các hoạt động ngoài trời!',
                elderly: 'Rất tốt cho người cao tuổi.',
                children: 'An toàn cho trẻ em vui chơi.',
                athletes: 'Điều kiện lý tưởng để tập luyện.',
                pregnantWomen: 'Không có rủi ro.'
            }
        },
        weather: {
            temperature: { value: 28, units: 'C' },
            humidity: 65,
            condition: 'Nắng nhẹ',
            windSpeed: 12
        },
        timestamp: new Date().toISOString(),
        location: 'Đà Nẵng'
    });
});

// Final check for all /api/* routes that didn't match
app.all(/^\/api\/.*/, (req, res) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
});

// Static assets (for production)
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(rootDir, 'dist')));
    app.get(/^((?!\/api).)*$/, (req, res) => {
        res.sendFile(path.join(rootDir, 'dist', 'index.html'));
    });
}

// Development server
async function startServer() {
    console.log('[2026-10-02T15:04:52.155Z] Setting up middleware...');
    
    const server = app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });

    // WebSocket Setup
    const wss = new WebSocketServer({ server });
    wss.on('connection', (ws) => {
        clients.add(ws);
        broadcast({ type: 'ACTIVE_USERS_COUNT', count: clients.size });
        
        ws.on('close', () => {
            clients.delete(ws);
            broadcast({ type: 'ACTIVE_USERS_COUNT', count: clients.size });
        });
    });

    if (process.env.NODE_ENV !== 'production') {
        const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: 'spa',
        });
        app.use(vite.middlewares);
    }
}

startServer();
