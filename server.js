
import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import crypto from 'crypto'; // For txn_id generation
import jwt from 'jsonwebtoken'; // NEW: For secure tokens

dotenv.config();

// Fix for __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', true);

// ENABLE CORS FOR ALL DOMAINS (Need this so daftarapp.tj can talk to steppay.fun)
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Telegram-User-ID', 'X-Store-ID', 'api_token', 'api-token'] // Added api-token
}));

// INCREASED PAYLOAD LIMIT FOR IMAGE UPLOAD (Up to 50MB to be safe)
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- LIVE LOGGING MIDDLEWARE ---
app.use((req, res, next) => {
  const start = Date.now();
  const { method, url } = req;
  const timestamp = new Date().toLocaleTimeString('tg-TJ');
  const telegramId = req.headers['x-telegram-user-id'] || 'Guest';
  const storeId = req.headers['x-store-id'] || 'None';

  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m',
    magenta: '\x1b[35m',
    blue: '\x1b[34m'
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    let statusColor = colors.green;
    if (status >= 500) statusColor = colors.red;
    else if (status >= 400) statusColor = colors.yellow;

    // Filter out static asset logs to keep console clean
    if (!url.startsWith('/assets') && !url.endsWith('.ico')) {
        console.log(
        `${colors.gray}[${timestamp}]${colors.reset} ` +
        `${colors.magenta}[User:${telegramId}]${colors.reset} ` +
        `${colors.blue}[Store:${storeId}]${colors.reset} ` +
        `${colors.cyan}${method}${colors.reset} ${url} ` +
        `${statusColor}${status}${colors.reset} ` +
        `${colors.gray}${duration}ms${colors.reset}`
        );
    }
  });

  next();
});

app.use(express.static(path.join(__dirname, 'dist')));

// Serve index.html for client-side routing (admin, debtor views)
app.get('/debtor/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});
// UPDATED: Admin Panel is now at /0410
app.get('/0410/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'daftar_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

async function initDb() {
  try {
    const tempConnection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password
    });
    
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\`;`);
    await tempConnection.end();

    pool = mysql.createPool(dbConfig);
    console.log('\x1b[32m%s\x1b[0m', '✓ Connected to MySQL database.');

    // 1. Create Stores Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        owner_telegram_id VARCHAR(50) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_verified BOOLEAN DEFAULT FALSE,
        subscription_plan VARCHAR(20) DEFAULT 'FREE',
        subscription_end_date DATETIME,
        sms_limit INT DEFAULT 0,
        sms_used INT DEFAULT 0
      )
    `);

    // 2. Create Debtors Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS debtors (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        balance DECIMAL(10, 2) DEFAULT 0,
        last_activity DATETIME,
        created_by VARCHAR(100),
        telegram_id VARCHAR(50),
        store_id VARCHAR(50)
      )
    `);

    // 3. Create Transactions Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        debtor_id VARCHAR(50),
        amount DECIMAL(10, 2),
        type ENUM('DEBT', 'PAYMENT'),
        description TEXT,
        date DATETIME,
        created_by VARCHAR(100),
        balance_after DECIMAL(10, 2),
        FOREIGN KEY (debtor_id) REFERENCES debtors(id) ON DELETE CASCADE
      )
    `);

    // 4. Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        telegram_id VARCHAR(50) PRIMARY KEY,
        first_name VARCHAR(255),
        username VARCHAR(255),
        photo_url TEXT,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_active_store_id VARCHAR(50),
        language VARCHAR(10) DEFAULT 'tg',
        phone_number VARCHAR(20)
      )
    `);

    // 5. Create Collaborators Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS store_collaborators (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_id VARCHAR(50),
        user_telegram_id VARCHAR(50),
        perm_delete_debtor BOOLEAN DEFAULT FALSE,
        perm_add_debt BOOLEAN DEFAULT TRUE,
        perm_add_payment BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_collab (store_id, user_telegram_id),
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);

    // 6. Create Verification Requests Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_id VARCHAR(50) NOT NULL,
        user_telegram_id VARCHAR(50) NOT NULL,
        document_type VARCHAR(50) NOT NULL,
        custom_store_name VARCHAR(255) NOT NULL,
        image_base64 LONGTEXT, 
        status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);

    // 7. Create OTP Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_otps (
        phone VARCHAR(20) PRIMARY KEY,
        code VARCHAR(6) NOT NULL,
        expires_at DATETIME NOT NULL
      )
    `);

    // 8. Create SMS Logs Table (For Debtor Reminders)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_id VARCHAR(50),
        debtor_id VARCHAR(50),
        msg_id VARCHAR(50),
        status VARCHAR(20),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (debtor_id) REFERENCES debtors(id) ON DELETE CASCADE
      )
    `);

    // 9. Create OTP Request Logs Table (For Login Rate Limiting)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otp_request_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        phone_number VARCHAR(20),
        ip_address VARCHAR(45),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 10. NEW: Payments Table (SmartPay)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_id VARCHAR(50) NOT NULL,
        order_id VARCHAR(100) NOT NULL UNIQUE,
        invoice_id VARCHAR(100),
        amount DECIMAL(10, 2) NOT NULL,
        plan_type VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);

    // Migrations to ensure columns exist
    const safeQuery = async (query) => { try { await pool.query(query); } catch (e) { /* ignore duplicate column errors */ } };
    
    await safeQuery(`ALTER TABLE debtors ADD COLUMN telegram_id VARCHAR(50)`);
    await safeQuery(`ALTER TABLE debtors ADD COLUMN store_id VARCHAR(50)`);
    await safeQuery(`ALTER TABLE users ADD COLUMN last_active_store_id VARCHAR(50)`);
    await safeQuery(`ALTER TABLE transactions ADD COLUMN balance_after DECIMAL(10, 2)`);
    await safeQuery(`ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'tg'`);
    await safeQuery(`ALTER TABLE stores ADD COLUMN is_verified BOOLEAN DEFAULT FALSE`);
    await safeQuery(`ALTER TABLE verification_requests MODIFY image_base64 LONGTEXT`);
    await safeQuery(`ALTER TABLE users ADD COLUMN phone_number VARCHAR(20)`);
    await safeQuery(`ALTER TABLE stores ADD COLUMN subscription_plan VARCHAR(20) DEFAULT 'FREE'`);
    await safeQuery(`ALTER TABLE stores ADD COLUMN subscription_end_date DATETIME`);
    await safeQuery(`ALTER TABLE stores ADD COLUMN sms_limit INT DEFAULT 0`);
    await safeQuery(`ALTER TABLE stores ADD COLUMN sms_used INT DEFAULT 0`);

    console.log('\x1b[32m%s\x1b[0m', '✓ Database tables initialized.');
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '✗ Database initialization failed:', error.message);
  }
}

initDb();

// --- TELEGRAM BOT SETUP ---
if (process.env.BOT_TOKEN) {
  const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
  console.log('\x1b[36m%s\x1b[0m', '✓ Telegram Bot started with Polling.');

  // Handle /start command
  bot.onText(/\/start(.*)/, async (msg, match) => {
    const chatId = msg.chat.id;
    const user = msg.from;
    const startParam = match[1] ? match[1].trim() : '';

    if (!user) return;

    // Check for phone verification param or logic
    if (startParam === 'phone') {
        const opts = {
            reply_markup: {
                keyboard: [
                    [{
                        text: "📱 Равон кардани рақам",
                        request_contact: true
                    }]
                ],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        };
        bot.sendMessage(chatId, "Лутфан тугмаи зерро пахш кунед, то рақами телефонатон ба аккаунти шумо пайваст шавад.", opts);
        return;
    }

    // Normal Start Flow
    const welcomeMsg = `Салом ${user.first_name}! 👋\n\nХуш омадед ба **Дафтар** - дафтари рақамии шумо.\n\nБарои идоракунии қарзҳо ва мағозаи худ тугмаи зеринро зер кунед:`;
    const opts = {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📒 Кушодани Дафтар",
              web_app: { url: "https://steppay.fun" } 
            }
          ]
        ]
      },
      parse_mode: 'Markdown'
    };

    bot.sendMessage(chatId, welcomeMsg, opts);
  });

  // Handle Contact Sharing (MERGE ACCOUNT LOGIC)
  bot.on('contact', async (msg) => {
      const chatId = msg.chat.id;
      const contact = msg.contact;
      const telegramId = msg.from.id.toString();

      if (!contact || !contact.phone_number) return;

      if (contact.user_id !== msg.from.id) {
          bot.sendMessage(chatId, "Лутфан рақами худро равон кунед.");
          return;
      }

      const connection = await pool.getConnection();

      try {
          await connection.beginTransaction();

          let phone = contact.phone_number.replace('+', '');
          
          // 1. Check if a user with this phone ALREADY EXISTS
          const [existingUsers] = await connection.query('SELECT * FROM users WHERE phone_number = ?', [phone]);

          if (existingUsers.length > 0) {
              const existingUser = existingUsers[0];
              const oldId = existingUser.telegram_id;

              // If the existing user is NOT the current Telegram ID (e.g., it is 'web_123')
              if (oldId !== telegramId) {
                  console.log(`[Merge] Merging user ${oldId} into ${telegramId}`);

                  await connection.query('UPDATE stores SET owner_telegram_id = ? WHERE owner_telegram_id = ?', [telegramId, oldId]);
                  await connection.query('UPDATE store_collaborators SET user_telegram_id = ? WHERE user_telegram_id = ?', [telegramId, oldId]);
                  await connection.query('UPDATE debtors SET telegram_id = ? WHERE telegram_id = ?', [telegramId, oldId]);
                  await connection.query('UPDATE verification_requests SET user_telegram_id = ? WHERE user_telegram_id = ?', [telegramId, oldId]);
                  
                  const [newIdCheck] = await connection.query('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);
                  
                  if (newIdCheck.length > 0) {
                      await connection.query('DELETE FROM users WHERE telegram_id = ?', [oldId]);
                      await connection.query('UPDATE users SET phone_number = ? WHERE telegram_id = ?', [phone, telegramId]);
                  } else {
                      await connection.query('UPDATE users SET telegram_id = ?, first_name = ?, username = ?, photo_url = ?, last_seen = NOW() WHERE telegram_id = ?', 
                          [telegramId, msg.from.first_name, msg.from.username, null, oldId]);
                  }
                  
                  await connection.commit();
                  
                  const opts = {
                    reply_markup: {
                        remove_keyboard: true,
                        inline_keyboard: [[{ text: "📒 Кушодани Дафтар", web_app: { url: "https://steppay.fun" } }]]
                    }
                  };
                  bot.sendMessage(chatId, "Рақами шумо тасдиқ шуд ва маълумотҳои пешинаи шумо (аз Web) ба ин аккаунт гузаронида шуданд! ✅", opts);
                  return;
              }
          }

          // 2. If phone doesn't exist, OR it already belonged to this ID:
          await connection.query(`
            INSERT INTO users (telegram_id, first_name, username, photo_url, last_seen, language, phone_number)
            VALUES (?, ?, ?, ?, NOW(), ?, ?)
            ON DUPLICATE KEY UPDATE
            first_name = VALUES(first_name),
            username = VALUES(username),
            phone_number = VALUES(phone_number),
            last_seen = NOW()
          `, [
            telegramId,
            msg.from.first_name,
            msg.from.username || null,
            null, 
            msg.from.language_code === 'ru' ? 'ru' : 'tg',
            phone
          ]);

          await connection.commit();
          
          const opts = {
            reply_markup: {
                remove_keyboard: true,
                inline_keyboard: [[{ text: "📒 Кушодани Дафтар", web_app: { url: "https://steppay.fun" } }]]
            }
          };
          bot.sendMessage(chatId, "Раҳмат! Рақами шумо бо муваффақият пайваст шуд. Акнун метавонед барномаро кушоед. ✅", opts);

      } catch (error) {
          await connection.rollback();
          console.error("Error saving phone:", error);
          bot.sendMessage(chatId, "Хатогӣ ҳангоми сабти рақам.");
      } finally {
          connection.release();
      }
  });

  bot.on('polling_error', (error) => {
    console.error('[Bot] Polling Error:', error.code); 
  });
} else {
  console.log('\x1b[33m%s\x1b[0m', '! BOT_TOKEN not found in .env. Bot features disabled.');
}

// --- HELPER ---
const getTelegramId = (req) => {
  const id = req.headers['x-telegram-user-id'];
  return id || 'public'; 
};

const getStoreId = (req) => {
    return req.headers['x-store-id'];
};

const getClientIp = (req) => {
    const xForwardedFor = req.headers['x-forwarded-for'];
    if (typeof xForwardedFor === 'string' && xForwardedFor.trim()) {
        return xForwardedFor.split(',')[0].trim();
    }

    const xRealIp = req.headers['x-real-ip'];
    if (typeof xRealIp === 'string' && xRealIp.trim()) {
        return xRealIp.trim();
    }

    const cfConnectingIp = req.headers['cf-connecting-ip'];
    if (typeof cfConnectingIp === 'string' && cfConnectingIp.trim()) {
        return cfConnectingIp.trim();
    }

    return req.ip || req.socket?.remoteAddress;
};

async function checkStoreAccess(storeId, telegramId) {
    if (!storeId || !telegramId) return { hasAccess: false };

    const [stores] = await pool.query('SELECT owner_telegram_id FROM stores WHERE id = ?', [storeId]);
    if (stores.length && stores[0].owner_telegram_id === telegramId) {
        return { hasAccess: true, isOwner: true, permissions: { canDeleteDebtor: true, canAddDebt: true, canAddPayment: true } };
    }

    const [collabs] = await pool.query('SELECT * FROM store_collaborators WHERE store_id = ? AND user_telegram_id = ?', [storeId, telegramId]);
    if (collabs.length) {
        return { 
            hasAccess: true, 
            isOwner: false, 
            permissions: {
                canDeleteDebtor: !!collabs[0].perm_delete_debtor,
                canAddDebt: !!collabs[0].perm_add_debt,
                canAddPayment: !!collabs[0].perm_add_payment
            }
        };
    }

    return { hasAccess: false, isOwner: false };
}

async function checkSmsStatusFromApi(msgId) {
    const smsLogin = process.env.SMS_LOGIN;
    const smsToken = process.env.SMS_TOKEN;
    const txn_id = crypto.randomUUID();
    
    const queryUrl = new URL("https://api.osonsms.com/query_sms.php");
    queryUrl.searchParams.append('login', smsLogin);
    queryUrl.searchParams.append('msg_id', msgId);
    queryUrl.searchParams.append('txn_id', txn_id);

    try {
        const response = await fetch(queryUrl.toString(), {
             method: 'GET',
             headers: { 'Authorization': `Bearer ${smsToken}` }
        });
        const data = await response.json();
        return data.status || 'UNKNOWN';
    } catch (e) {
        console.error("Error checking SMS status:", e);
        return 'UNKNOWN';
    }
}

// ==========================================
// PAYMENT ROUTES (SmartPay)
// ==========================================

app.post('/api/payments/create-invoice', async (req, res) => {
    const telegramId = getTelegramId(req);
    const storeId = getStoreId(req);
    const { plan } = req.body; 

    if (!storeId || !telegramId) return res.status(401).json({ error: 'Unauthorized' });

    const access = await checkStoreAccess(storeId, telegramId);
    if (!access.isOwner) return res.status(403).json({ error: 'Only store owner can pay' });

    try {
        const [users] = await pool.query('SELECT phone_number FROM users WHERE telegram_id = ?', [telegramId]);
        if (users.length === 0 || !users[0].phone_number) {
            return res.status(400).json({ error: 'Phone number required' });
        }
        
        let phone = users[0].phone_number.replace(/\D/g, '');
        if (phone.startsWith('992') && phone.length === 12) phone = phone.substring(3);

        let amount = plan === 'PRO' ? 25 : 15;
        // Simplified description
        const description = `Тарофаи ${plan} (1 моҳ)`; 
        const orderId = `SUB_${storeId}_${Date.now()}`;

        // Aggressive token cleaning
        let rawToken = process.env.SMARTPAY_TOKEN || '';
        let cleanToken = rawToken.trim();
        // Remove surrounding quotes if present
        if ((cleanToken.startsWith('"') && cleanToken.endsWith('"')) || (cleanToken.startsWith("'") && cleanToken.endsWith("'"))) {
            cleanToken = cleanToken.slice(1, -1);
        }

        const smartPayBaseUrl = process.env.SMARTPAY_API_URL || 'https://ecomm.smartpay.tj/api/merchant/invoices';
        const returnUrl = process.env.APP_DOMAIN ? `${process.env.APP_DOMAIN}?payment_success=true` : 'https://steppay.fun';

        if (!cleanToken) {
            console.error('SmartPay Token is missing or empty!');
            return res.status(500).json({ error: 'Payment Config Error: Missing Token' });
        }

        // Removed lifetime from payload
        const payload = {
            order_id: orderId,
            amount: amount,
            currency: 'TJS',
            description: description,
            customer_phone: phone,
            return_url: returnUrl
        };

        // DEBUG LOGS
        console.log('--- SmartPay Request Debug ---');
        console.log('URL:', smartPayBaseUrl);
        console.log('Token Preview:', cleanToken.substring(0, 5) + '...');
        console.log('Payload:', JSON.stringify(payload));
        
        const headers = {
            'x-app-token': cleanToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json' 
        };

        const response = await fetch(smartPayBaseUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        console.log('SmartPay Status:', response.status);
        console.log('SmartPay Body:', responseText);

        let data;
        try { data = JSON.parse(responseText); } catch (e) { data = { error: 'Invalid JSON', raw: responseText }; }

        // FIX: Added data.payment_link based on your logs
        const checkoutUrl = data.checkout_url || data.url || data.payment_url || data.payment_link;

        // Check for 200 result code from SmartPay body as well
        if (response.ok && (data.success || data.result === 200 || checkoutUrl)) {
            // FIX: Added invoice_uuid and smartpay_id
            const invoiceId = data.invoice_id || data.id || data.invoice_uuid || data.smartpay_id || 'UNKNOWN'; 
            
            await pool.query(`
                INSERT INTO payments (store_id, order_id, invoice_id, amount, plan_type, status)
                VALUES (?, ?, ?, ?, ?, 'PENDING')
            `, [storeId, orderId, invoiceId, amount, plan]);

            res.json({ success: true, checkout_url: checkoutUrl });
        } else {
            res.status(response.status).json({ error: 'Payment Provider Error', details: data });
        }

    } catch (error) {
        console.error('Payment Exception:', error);
        res.status(500).json({ error: error.message });
    }
});


// --- SMARTPAY WEBHOOK HANDLER ---
app.post('/api/payments/webhook', async (req, res) => {
    // DEBUG: Log all headers to diagnose missing tokens
    console.log('--- [Webhook] Incoming Request ---');
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
    // Check Query params too
    console.log('Query:', JSON.stringify(req.query, null, 2));
    
    // 1. Authorization: Check api_token header OR query parameter
    // Fallback: Check 'token' in URL query (e.g. ?token=abc) if headers are stripped
    const incomingToken = req.headers['api_token'] || 
                          req.headers['api-token'] || 
                          req.headers['x-app-token'] || 
                          req.query.token; // <--- Added Query Param Support
    
    let expectedToken = process.env.SMARTPAY_TOKEN || '';
    if ((expectedToken.startsWith('"') && expectedToken.endsWith('"')) || (expectedToken.startsWith("'") && expectedToken.endsWith("'"))) {
        expectedToken = expectedToken.slice(1, -1);
    }

    if (!incomingToken || incomingToken !== expectedToken) {
        console.error(`[Webhook] Auth Failed. Received: '${incomingToken}', Expected: '${expectedToken?.substring(0, 5)}...'`);
        // Return 401 Unauthorized
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { order_id, payment_id, amount, payment_date } = req.body;
    console.log(`[Webhook] Processing payment: Order=${order_id}, Amount=${amount}`);

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 2. Find the payment record
        const [existingPayment] = await connection.query(
            'SELECT * FROM payments WHERE order_id = ?',
            [order_id]
        );

        if (existingPayment.length === 0) {
            await connection.rollback();
            console.error(`[Webhook] Order not found in DB: ${order_id}`);
            // Return 200 to acknowledge receipt and prevent SmartPay from retrying indefinitely
            return res.status(200).json({ message: 'Order not found, skipping' });
        }

        const paymentRecord = existingPayment[0];

        // 3. Idempotency Check: If already paid, do nothing
        if (paymentRecord.status === 'PAID') {
            await connection.rollback();
            console.log(`[Webhook] Order ${order_id} was already processed. Skipping.`);
            return res.status(200).json({ message: 'Already processed' });
        }

        // 4. Update Store Subscription
        const planType = paymentRecord.plan_type; // 'STANDARD' or 'PRO'
        const smsLimit = planType === 'PRO' ? 300 : 100;
        
        // Calculate End Date (Now + 1 Month)
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        await connection.query(`
            UPDATE stores 
            SET subscription_plan = ?, 
                subscription_end_date = ?, 
                sms_limit = ?, 
                sms_used = 0 
            WHERE id = ?
        `, [planType, endDate, smsLimit, paymentRecord.store_id]);

        // 5. Update Payment Status
        // Note: SmartPay sends 'payment_id' (UUID) which can be stored if needed.
        // We will update the status to PAID.
        await connection.query(`
            UPDATE payments 
            SET status = 'PAID',
                invoice_id = ? -- Optional: store/overwrite the external payment UUID here
            WHERE order_id = ?
        `, [payment_id, order_id]);

        await connection.commit();
        console.log(`[Webhook] Success! Store ${paymentRecord.store_id} upgraded to ${planType}`);
        
        // --- NEW: SEND SUCCESS SMS TO USER ---
        try {
            const [ownerRows] = await pool.query(`
                SELECT u.phone_number 
                FROM stores s
                JOIN users u ON s.owner_telegram_id = u.telegram_id
                WHERE s.id = ?
            `, [paymentRecord.store_id]);

            if (ownerRows.length > 0 && ownerRows[0].phone_number) {
                let phone = ownerRows[0].phone_number.replace(/\D/g, '');
                if (phone.length === 9) phone = '992' + phone;

                // Format Date dd.mm.yyyy
                const dateStr = endDate.toLocaleDateString('ru-RU');
                
                const message = `Тарофаи ${planType} бомуваффақият фаъол шуд. Муҳлат то: ${dateStr}.`;
                const txn_id = crypto.randomUUID();
                const smsLogin = process.env.SMS_LOGIN;
                const smsToken = process.env.SMS_TOKEN;
                const smsSender = process.env.SMS_SENDER || 'Daftar';
                const smsServer = process.env.SMS_SERVER || 'https://api.osonsms.com/sendsms_v1.php';

                const smsUrl = new URL(smsServer);
                smsUrl.searchParams.append('from', smsSender);
                smsUrl.searchParams.append('phone_number', phone);
                smsUrl.searchParams.append('msg', message);
                smsUrl.searchParams.append('login', smsLogin);
                smsUrl.searchParams.append('txn_id', txn_id);

                // Fire and forget - don't await the result to block response
                fetch(smsUrl.toString(), {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${smsToken}` }
                }).then(res => res.json()).then(data => {
                    console.log('[Webhook] SMS sent result:', data);
                }).catch(err => {
                    console.error('[Webhook] SMS send error:', err);
                });
            }
        } catch (smsError) {
            console.error('[Webhook] Failed to prepare SMS:', smsError);
        }

        // Return 200 OK as required by SmartPay
        res.status(200).json({ result: 'OK' });

    } catch (error) {
        await connection.rollback();
        console.error('[Webhook] Error processing payment:', error);
        // Return 500 so SmartPay retries later
        res.status(500).json({ error: 'Internal Server Error' });
    } finally {
        connection.release();
    }
});

// ==========================================
// AUTH API ROUTES (WEB LOGIN & TELEGRAM)
// ==========================================

// 1. Request OTP (UPDATED WITH RATE LIMITING)
app.post('/api/auth/otp/request', async (req, res) => {
    const { phone } = req.body;
    // Get IP for device identification (handles proxy)
    const clientIp = getClientIp(req);

    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 9) formattedPhone = '992' + formattedPhone;
    
    try {
        // --- GOOGLE PLAY / TEST ACCOUNT BYPASS ---
        // If phone is 987654321 (992987654321), don't send real SMS, just save 111111 to DB
        if (formattedPhone === '992987654321') {
            const testCode = '111111';
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration for test

            await pool.query(`
                INSERT INTO auth_otps (phone, code, expires_at) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)
            `, [formattedPhone, testCode, expiresAt]);

            console.log('\x1b[33m%s\x1b[0m', `[Auth] Test account login attempted: ${formattedPhone}`);
            return res.json({ success: true, message: 'OTP sent (TEST MODE)' });
        }

        // RATE LIMIT CHECK 1: Device/IP Limit (5 requests per 12 hours)
        const [ipLogs] = await pool.query(
            'SELECT COUNT(*) as count FROM otp_request_logs WHERE ip_address = ? AND created_at > NOW() - INTERVAL 12 HOUR',
            [clientIp]
        );
        if (ipLogs[0].count >= 5) {
            return res.status(429).json({ error: 'Too many requests from this device. Please try again later.' });
        }

        // RATE LIMIT CHECK 2: Destination Number Limit (3 SMS per 1 hour)
        const [phoneLogs] = await pool.query(
            'SELECT COUNT(*) as count FROM otp_request_logs WHERE phone_number = ? AND created_at > NOW() - INTERVAL 1 HOUR',
            [formattedPhone]
        );
        if (phoneLogs[0].count >= 3) {
            return res.status(429).json({ error: 'SMS limit reached for this number. Please wait 1 hour.' });
        }

        // Proceed to Generate OTP
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await pool.query(`
            INSERT INTO auth_otps (phone, code, expires_at) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)
        `, [formattedPhone, code, expiresAt]);

        const message = `Коди тасдиқ барои воридшави: ${code}. Ба ҳеҷ кас надиҳед!`;
        const txn_id = crypto.randomUUID();
        const smsLogin = process.env.SMS_LOGIN;
        const smsToken = process.env.SMS_TOKEN;
        const smsSender = process.env.SMS_SENDER || 'Daftar';
        const smsServer = process.env.SMS_SERVER || 'https://api.osonsms.com/sendsms_v1.php';

        const smsUrl = new URL(smsServer);
        smsUrl.searchParams.append('from', smsSender);
        smsUrl.searchParams.append('phone_number', formattedPhone);
        smsUrl.searchParams.append('msg', message);
        smsUrl.searchParams.append('login', smsLogin);
        smsUrl.searchParams.append('txn_id', txn_id);

        await fetch(smsUrl.toString(), {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${smsToken}` }
        });

        // LOG THE SUCCESSFUL ATTEMPT
        await pool.query(
            'INSERT INTO otp_request_logs (phone_number, ip_address) VALUES (?, ?)',
            [formattedPhone, clientIp]
        );

        res.json({ success: true, message: 'OTP sent' });
    } catch (error) {
        console.error('OTP Request Error:', error);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
});

// 2. Verify OTP
app.post('/api/auth/otp/verify', async (req, res) => {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ error: 'Phone and code required' });

    let formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length === 9) formattedPhone = '992' + formattedPhone;

    try {
        const [rows] = await pool.query('SELECT * FROM auth_otps WHERE phone = ? AND code = ? AND expires_at > NOW()', [formattedPhone, code]);
        
        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired code' });
        }

        await pool.query('DELETE FROM auth_otps WHERE phone = ?', [formattedPhone]);

        const [users] = await pool.query('SELECT * FROM users WHERE phone_number = ?', [formattedPhone]);
        
        let user;
        if (users.length > 0) {
            user = users[0];
        } else {
            const newId = 'web_' + Date.now();
            await pool.query(`
                INSERT INTO users (telegram_id, first_name, phone_number, last_seen, language)
                VALUES (?, ?, ?, NOW(), 'tg')
            `, [newId, 'User ' + formattedPhone.slice(-4), formattedPhone]);
            
            user = { telegram_id: newId, first_name: 'User ' + formattedPhone.slice(-4), photo_url: null };
        }

        res.json({ 
            success: true, 
            user: {
                id: user.telegram_id,
                first_name: user.first_name,
                photo_url: user.photo_url
            }
        });

    } catch (error) {
        console.error('OTP Verify Error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// 3. Sync User (Telegram Mini App)
app.post('/api/auth/sync', async (req, res) => {
    const { id, first_name, username, photo_url } = req.body;
    if (!id) return res.status(400).send('ID required');

    try {
        // 1. Check if user exists
        const [users] = await pool.query('SELECT * FROM users WHERE telegram_id = ?', [id.toString()]);

        // 2. If user DOES NOT EXIST, return flag to frontend to require phone
        if (users.length === 0) {
            return res.json({ 
                success: false, 
                requirePhone: true, 
                message: 'Phone number required' 
            });
        }

        // 3. User Exists -> Update info
        await pool.query(`
            UPDATE users SET
            first_name = ?,
            username = ?,
            photo_url = ?,
            last_seen = NOW()
            WHERE telegram_id = ?
        `, [first_name, username, photo_url, id.toString()]);

        const user = users[0];
        
        res.json({ 
            success: true, 
            lastActiveStoreId: user.last_active_store_id,
            language: user.language || 'tg',
            phoneNumber: user.phone_number
        });
    } catch (error) {
        console.error('Sync error', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// CLIENT API ROUTES
// ==========================================

// USER PREFERENCES
app.put('/api/users/me/store', async (req, res) => {
    const telegramId = getTelegramId(req);
    const { storeId } = req.body;
    if (telegramId === 'public') return res.status(200).json({ success: true }); 
    try {
        await pool.query('UPDATE users SET last_active_store_id = ? WHERE telegram_id = ?', [storeId, telegramId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/users/me/language', async (req, res) => {
    const telegramId = getTelegramId(req);
    const { language } = req.body;
    if (telegramId === 'public') return res.status(200).json({ success: true }); 
    try {
        await pool.query('UPDATE users SET language = ? WHERE telegram_id = ?', [language, telegramId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/users/search', async (req, res) => {
    const q = req.query.q;
    const telegramId = getTelegramId(req);
    if (!q || q.length < 2) return res.json([]);
    try {
        const [users] = await pool.query(`
            SELECT telegram_id, first_name, username, photo_url 
            FROM users 
            WHERE (first_name LIKE ? OR username LIKE ? OR phone_number LIKE ?) 
            AND telegram_id != ?
            LIMIT 5
        `, [`%${q}%`, `%${q}%`, `%${q}%`, telegramId]);
        res.json(users.map(u => ({
            telegramId: u.telegram_id,
            firstName: u.first_name,
            username: u.username,
            photoUrl: u.photo_url
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// COLLABORATORS
app.get('/api/stores/:storeId/collaborators', async (req, res) => {
    const { storeId } = req.params;
    const telegramId = getTelegramId(req);
    const access = await checkStoreAccess(storeId, telegramId);
    if (!access.isOwner && !access.hasAccess) return res.status(403).json({ error: 'Access denied' });
    try {
        const [collabs] = await pool.query(`
            SELECT sc.*, u.first_name, u.username, u.photo_url 
            FROM store_collaborators sc
            LEFT JOIN users u ON sc.user_telegram_id = u.telegram_id
            WHERE sc.store_id = ?
        `, [storeId]);
        res.json(collabs.map(c => ({
            id: c.id,
            userTelegramId: c.user_telegram_id,
            firstName: c.first_name || 'Unknown',
            username: c.username,
            photoUrl: c.photo_url,
            permissions: {
                canDeleteDebtor: !!c.perm_delete_debtor,
                canAddDebt: !!c.perm_add_debt,
                canAddPayment: !!c.perm_add_payment
            }
        })));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stores/:storeId/collaborators', async (req, res) => {
    const { storeId } = req.params;
    const { userTelegramId, permissions } = req.body;
    const telegramId = getTelegramId(req);
    const access = await checkStoreAccess(storeId, telegramId);
    if (!access.isOwner) return res.status(403).json({ error: 'Only owner can add collaborators' });
    try {
        await pool.query(`
            INSERT INTO store_collaborators 
            (store_id, user_telegram_id, perm_delete_debtor, perm_add_debt, perm_add_payment)
            VALUES (?, ?, ?, ?, ?)
        `, [storeId, userTelegramId, permissions.canDeleteDebtor, permissions.canAddDebt, permissions.canAddPayment]);
        res.status(201).json({ success: true });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'User is already a collaborator' });
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/stores/:storeId/collaborators/:userId', async (req, res) => {
    const { storeId, userId } = req.params;
    const telegramId = getTelegramId(req);
    const access = await checkStoreAccess(storeId, telegramId);
    if (!access.isOwner) return res.status(403).json({ error: 'Only owner can remove collaborators' });
    try {
        await pool.query('DELETE FROM store_collaborators WHERE store_id = ? AND user_telegram_id = ?', [storeId, userId]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// STORES
app.get('/api/stores', async (req, res) => {
    const telegramId = getTelegramId(req);
    try {
        const [ownedStores] = await pool.query(`
            SELECT s.*,
            (SELECT status FROM verification_requests WHERE store_id = s.id ORDER BY created_at DESC LIMIT 1) as latest_verification_status
            FROM stores s
            WHERE owner_telegram_id = ? 
            ORDER BY created_at ASC
        `, [telegramId]);
        
        const [sharedStores] = await pool.query(`
            SELECT s.*, sc.perm_delete_debtor, sc.perm_add_debt, sc.perm_add_payment,
            (SELECT status FROM verification_requests WHERE store_id = s.id ORDER BY created_at DESC LIMIT 1) as latest_verification_status
            FROM stores s
            JOIN store_collaborators sc ON s.id = sc.store_id
            WHERE sc.user_telegram_id = ?
        `, [telegramId]);

        const result = ownedStores.map(s => ({
            id: s.id,
            name: s.name,
            ownerTelegramId: s.owner_telegram_id,
            createdAt: s.created_at,
            isOwner: true,
            isVerified: !!s.is_verified,
            verificationStatus: s.latest_verification_status || 'NONE',
            subscriptionPlan: s.subscription_plan,
            subscriptionEndDate: s.subscription_end_date,
            smsLimit: s.sms_limit,
            smsUsed: s.sms_used,
            permissions: { canDeleteDebtor: true, canAddDebt: true, canAddPayment: true }
        }));

        sharedStores.forEach(s => {
            result.push({
                id: s.id,
                name: s.name + ' (Ҳамкор)',
                ownerTelegramId: s.owner_telegram_id,
                createdAt: s.created_at,
                isOwner: false,
                isVerified: !!s.is_verified,
                verificationStatus: s.latest_verification_status || 'NONE',
                subscriptionPlan: s.subscription_plan,
                subscriptionEndDate: s.subscription_end_date,
                smsLimit: s.sms_limit,
                smsUsed: s.sms_used,
                permissions: {
                    canDeleteDebtor: !!s.perm_delete_debtor,
                    canAddDebt: !!s.perm_add_debt,
                    canAddPayment: !!s.perm_add_payment
                }
            });
        });

        if (result.length === 0) {
            const defaultStoreId = Date.now().toString();
            const defaultStoreName = 'Мағозаи асосӣ';
            await pool.query('INSERT INTO stores (id, name, owner_telegram_id) VALUES (?, ?, ?)', [defaultStoreId, defaultStoreName, telegramId]);
            return res.json([{
                id: defaultStoreId,
                name: defaultStoreName,
                ownerTelegramId: telegramId,
                createdAt: new Date(),
                isOwner: true,
                isVerified: false,
                verificationStatus: 'NONE',
                permissions: { canDeleteDebtor: true, canAddDebt: true, canAddPayment: true }
            }]);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stores', async (req, res) => {
    const telegramId = getTelegramId(req);
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Store name is required' });
    try {
        const newStoreId = Date.now().toString();
        await pool.query('INSERT INTO stores (id, name, owner_telegram_id) VALUES (?, ?, ?)', [newStoreId, name, telegramId]);
        res.status(201).json({ 
            message: 'Store created',
            store: {
                id: newStoreId,
                name: name,
                ownerTelegramId: telegramId,
                isOwner: true,
                isVerified: false,
                permissions: { canDeleteDebtor: true, canAddDebt: true, canAddPayment: true }
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/stores/:storeId/verify', async (req, res) => {
    const { storeId } = req.params;
    const telegramId = getTelegramId(req);
    const { documentType, imageBase64, customStoreName } = req.body;
    const access = await checkStoreAccess(storeId, telegramId);
    if (!access.isOwner) return res.status(403).json({ error: 'Only owner can submit verification' });
    try {
        await pool.query(`
            INSERT INTO verification_requests 
            (store_id, user_telegram_id, document_type, custom_store_name, image_base64)
            VALUES (?, ?, ?, ?, ?)
        `, [storeId, telegramId, documentType, customStoreName, imageBase64]);
        res.status(201).json({ success: true, message: 'Request submitted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DEBTORS
app.get('/api/debtors', async (req, res) => {
  const telegramId = getTelegramId(req);
  const storeId = getStoreId(req);
  try {
    const access = await checkStoreAccess(storeId, telegramId);
    if (!access.hasAccess && telegramId !== 'public') {
        if (storeId && storeId !== 'undefined') return res.status(403).json({ error: 'Access denied to this store' });
    }

    let query = 'SELECT * FROM debtors WHERE 1=1';
    let params = [];
    if (storeId && storeId !== 'undefined') {
        query += ' AND store_id = ?';
        params.push(storeId);
    } else {
         query += ' AND telegram_id = ?';
         params.push(telegramId);
    }
    query += ' ORDER BY last_activity DESC';

    const [debtors] = await pool.query(query, params);
    if (debtors.length === 0) return res.json([]);

    const debtorIds = debtors.map(d => d.id);
    let transactions = [];
    if (debtorIds.length > 0) {
      const placeholders = debtorIds.map(() => '?').join(',');
      const [trx] = await pool.query(
        `SELECT * FROM transactions WHERE debtor_id IN (${placeholders}) ORDER BY date DESC`,
        debtorIds
      );
      transactions = trx;
    }

    const result = debtors.map(d => {
      const debtorTransactions = transactions
        .filter(t => t.debtor_id === d.id)
        .map(t => ({
            id: t.id,
            amount: parseFloat(t.amount),
            type: t.type,
            description: t.description,
            date: t.date,
            createdBy: t.created_by,
            balanceAfter: t.balance_after !== null ? parseFloat(t.balance_after) : undefined
        }));

      return {
          id: d.id,
          name: d.name,
          phone: d.phone,
          balance: parseFloat(d.balance),
          lastActivity: d.last_activity,
          createdBy: d.created_by,
          storeId: d.store_id,
          transactions: debtorTransactions
      };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/public/debtors/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [debtorRows] = await pool.query(`
            SELECT d.*, s.name as store_name 
            FROM debtors d
            LEFT JOIN stores s ON d.store_id = s.id
            WHERE d.id = ?
        `, [id]);

        if (debtorRows.length === 0) return res.status(404).json({ error: 'Debtor not found' });
        const debtor = debtorRows[0];

        const [transactions] = await pool.query(`
            SELECT id, amount, type, description, date 
            FROM transactions 
            WHERE debtor_id = ? 
            ORDER BY date DESC
        `, [id]);

        res.json({
            id: debtor.id,
            name: debtor.name,
            balance: parseFloat(debtor.balance),
            storeName: debtor.store_name || 'Мағозаи беном',
            transactions: transactions.map(t => ({
                id: t.id,
                amount: parseFloat(t.amount),
                type: t.type,
                description: t.description,
                date: t.date
            }))
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/debtors', async (req, res) => {
  const { id, name, phone, balance, lastActivity, createdBy } = req.body;
  const telegramId = getTelegramId(req);
  const storeId = getStoreId(req);
  const access = await checkStoreAccess(storeId, telegramId);
  if (!access.hasAccess && telegramId !== 'public') return res.status(403).json({ error: 'Access denied' });
  try {
    await pool.query(
      'INSERT INTO debtors (id, name, phone, balance, last_activity, created_by, telegram_id, store_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, phone, balance, new Date(lastActivity), createdBy, telegramId, storeId]
    );
    res.status(201).json({ message: 'Debtor created' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/debtors/:id', async (req, res) => {
  const { id } = req.params;
  const { name, phone } = req.body;
  const telegramId = getTelegramId(req);
  const storeId = getStoreId(req);
  const access = await checkStoreAccess(storeId, telegramId);
  if (!access.hasAccess && telegramId !== 'public') return res.status(403).json({ error: 'Access denied' });
  try {
      await pool.query('UPDATE debtors SET name = ?, phone = ? WHERE id = ?', [name, phone, id]);
      res.json({ success: true });
  } catch (error) {
      res.status(500).json({ error: error.message });
  }
});

app.delete('/api/debtors/:id', async (req, res) => {
  const { id } = req.params;
  const telegramId = getTelegramId(req);
  const storeId = getStoreId(req);
  const access = await checkStoreAccess(storeId, telegramId);
  if (!access.hasAccess && telegramId !== 'public') return res.status(403).json({ error: 'Access denied' });
  if (!access.isOwner && !access.permissions.canDeleteDebtor && telegramId !== 'public') {
      return res.status(403).json({ error: 'Permission denied: Cannot delete debtor' });
  }
  try {
    const [d] = await pool.query('SELECT id FROM debtors WHERE id = ? AND store_id = ?', [id, storeId]);
    if (d.length === 0) return res.status(404).json({ message: 'Debtor not found in this store' });
    await pool.query('DELETE FROM debtors WHERE id = ?', [id]);
    res.json({ message: 'Debtor deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// TRANSACTIONS
app.post('/api/transactions', async (req, res) => {
  const { id, debtorId, amount, type, description, date, createdBy } = req.body;
  const telegramId = getTelegramId(req);
  const storeId = getStoreId(req);
  
  const access = await checkStoreAccess(storeId, telegramId);
  if (!access.hasAccess && telegramId !== 'public') return res.status(403).json({ error: 'Access denied' });

  if (!access.isOwner && telegramId !== 'public') {
      if (type === 'DEBT' && !access.permissions.canAddDebt) return res.status(403).json({ error: 'Permission denied: Cannot add debt' });
      if (type === 'PAYMENT' && !access.permissions.canAddPayment) return res.status(403).json({ error: 'Permission denied: Cannot add payment' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const balanceChange = type === 'DEBT' ? amount : -amount;
    await connection.query('UPDATE debtors SET balance = balance + ?, last_activity = ? WHERE id = ?', [balanceChange, new Date(date), debtorId]);
    const [debtorRows] = await connection.query('SELECT balance FROM debtors WHERE id = ?', [debtorId]);
    const currentBalance = debtorRows.length > 0 ? parseFloat(debtorRows[0].balance) : 0;
    await connection.query(
      'INSERT INTO transactions (id, debtor_id, amount, type, description, date, created_by, balance_after) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, debtorId, amount, type, description, new Date(date), createdBy, currentBalance]
    );
    await connection.commit();
    res.status(201).json({ message: 'Transaction added' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  const { id } = req.params;
  const telegramId = getTelegramId(req);
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(`SELECT t.*, d.store_id FROM transactions t JOIN debtors d ON t.debtor_id = d.id WHERE t.id = ?`, [id]);
    if (rows.length === 0) { await connection.rollback(); return res.status(404).json({ message: 'Transaction not found' }); }

    const transaction = rows[0];
    const access = await checkStoreAccess(transaction.store_id, telegramId);
    if (!access.hasAccess && telegramId !== 'public') throw new Error("Access denied");

    if (!access.isOwner && telegramId !== 'public') {
        if (transaction.type === 'DEBT' && !access.permissions.canAddDebt) throw new Error("Permission denied");
        if (transaction.type === 'PAYMENT' && !access.permissions.canAddPayment) throw new Error("Permission denied");
    }

    const reverseAmount = transaction.type === 'DEBT' ? -transaction.amount : transaction.amount;
    await connection.query('UPDATE debtors SET balance = balance + ? WHERE id = ?', [reverseAmount, transaction.debtor_id]);
    await connection.query('DELETE FROM transactions WHERE id = ?', [id]);
    await connection.commit();
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

// SMS
app.post('/api/sms/send', async (req, res) => {
    const telegramId = getTelegramId(req);
    const storeId = getStoreId(req);
    const { debtorId } = req.body;

    const access = await checkStoreAccess(storeId, telegramId);
    if (!access.hasAccess) return res.status(403).json({ error: 'Access denied' });

    try {
        const [storeRows] = await pool.query('SELECT is_verified, name, subscription_end_date, sms_limit, sms_used FROM stores WHERE id = ?', [storeId]);
        if (storeRows.length === 0) return res.status(404).json({ error: 'Store not found' });
        
        const store = storeRows[0];
        if (!store.is_verified) return res.status(403).json({ error: 'VERIFICATION_REQUIRED', message: 'Store must be verified to send SMS' });
        if (!store.subscription_end_date || new Date(store.subscription_end_date) < new Date()) return res.status(403).json({ error: 'SUBSCRIPTION_EXPIRED', message: 'Муҳлати тарофа ба охир расид.' });
        if (store.sms_used >= store.sms_limit) return res.status(403).json({ error: 'LIMIT_EXCEEDED', message: 'Лимити SMS барои ин моҳ ба охир расид.' });

        const [lastLogs] = await pool.query(`SELECT msg_id, created_at FROM sms_logs WHERE store_id = ? AND debtor_id = ? ORDER BY created_at DESC LIMIT 1`, [storeId, debtorId]);
        if (lastLogs.length > 0) {
             const diffDays = (new Date() - new Date(lastLogs[0].created_at)) / (1000 * 60 * 60 * 24);
             if (diffDays < 3) {
                 const status = await checkSmsStatusFromApi(lastLogs[0].msg_id);
                 if (['DELIVERED', 'ACCEPTED', 'ENROUTE', 'UNKNOWN'].includes(status)) {
                     return res.status(429).json({ error: 'TOO_SOON', message: 'Ба ин мизоҷ дар 3 рӯз танҳо 1 SMS равон кардан мумкин аст.' });
                 }
             }
        }

        const [debtorRows] = await pool.query('SELECT name, phone, balance FROM debtors WHERE id = ?', [debtorId]);
        if (debtorRows.length === 0) return res.status(404).json({ error: 'Debtor not found' });
        
        const debtor = debtorRows[0];
        const balance = parseFloat(debtor.balance);
        if (balance <= 0) return res.status(400).json({ error: 'No debt to remind about' });

        // UPDATE: Use the new secondary domain for the link
        const link = `https://daftarapp.tj/debtor/${debtorId}`;
        const message = `Салом, қарзи Шумо аз ${store.name} ${balance} сомонӣ. Лутфан сари вақт супоред. Пайванд:  ${link}`;
        
        let phone = debtor.phone.replace(/\D/g, ''); 
        if (phone.length === 9 && phone.startsWith('9')) phone = '992' + phone;
        else if (phone.startsWith('00')) phone = phone.substring(2);

        const txn_id = crypto.randomUUID();
        const smsLogin = process.env.SMS_LOGIN;
        const smsToken = process.env.SMS_TOKEN;
        const smsSender = process.env.SMS_SENDER || 'Daftar';
        const smsServer = process.env.SMS_SERVER || 'https://api.osonsms.com/sendsms_v1.php';

        const smsUrl = new URL(smsServer);
        smsUrl.searchParams.append('from', smsSender);
        smsUrl.searchParams.append('phone_number', phone);
        smsUrl.searchParams.append('msg', message);
        smsUrl.searchParams.append('login', smsLogin);
        smsUrl.searchParams.append('txn_id', txn_id);
        
        const response = await fetch(smsUrl.toString(), {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${smsToken}` }
        });
        const responseData = await response.json();

        if (responseData.status === 'ok' || responseData.error_code === 0) {
             const msgId = responseData.msg_id;
             await pool.query(`INSERT INTO sms_logs (store_id, debtor_id, msg_id, status) VALUES (?, ?, ?, 'PENDING')`, [storeId, debtorId, msgId]);
             await pool.query(`UPDATE stores SET sms_used = sms_used + 1 WHERE id = ?`, [storeId]);
             res.json({ success: true, txn_id, msg_id: msgId });
        } else {
             res.status(500).json({ error: 'SMS Provider Error', details: responseData });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// ADMIN API ROUTES
// ==========================================

// SECURE ADMIN MIDDLEWARE (Updated to use JWT)
const isAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Unauthorized: No token' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(401).json({ error: 'Unauthorized: Invalid token' });
        req.adminUser = user;
        next();
    });
};

// Rate Limiter for Admin Login (In-memory simple implementation)
const loginRateLimiter = {
    attempts: new Map(), // Key: IP, Value: { count, expires }
    check: (ip) => {
        const record = loginRateLimiter.attempts.get(ip);
        if (!record) return true;
        if (Date.now() > record.expires) {
            loginRateLimiter.attempts.delete(ip);
            return true;
        }
        return record.count < 5; // Max 5 attempts
    },
    fail: (ip) => {
        const record = loginRateLimiter.attempts.get(ip) || { count: 0, expires: Date.now() + 15 * 60 * 1000 }; // 15 min lock
        record.count += 1;
        record.expires = Date.now() + 15 * 60 * 1000;
        loginRateLimiter.attempts.set(ip, record);
    },
    reset: (ip) => {
        loginRateLimiter.attempts.delete(ip);
    }
};

app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    const clientIp = getClientIp(req);

    // 1. Check Rate Limit
    if (!loginRateLimiter.check(clientIp)) {
        return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
    }

    // 2. Validate Credentials against ENV
    if (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
        // Success
        loginRateLimiter.reset(clientIp);
        // Generate Token
        const token = jwt.sign({ username: username, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '2h' });
        res.json({ success: true, token });
    } else {
        // Failure
        loginRateLimiter.fail(clientIp);
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/admin/verifications', isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                vr.*, 
                u.first_name as owner_name, 
                u.username as owner_username,
                u.phone_number as owner_phone,
                (SELECT COUNT(*) FROM debtors d WHERE d.store_id = vr.store_id) as debtors_count,
                (SELECT COUNT(*) FROM transactions t JOIN debtors d2 ON t.debtor_id = d2.id WHERE d2.store_id = vr.store_id) as transaction_count
            FROM verification_requests vr
            LEFT JOIN users u ON vr.user_telegram_id = u.telegram_id
            ORDER BY vr.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/admin/verifications/:id/status', isAdmin, async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await connection.query('UPDATE verification_requests SET status = ? WHERE id = ?', [status, id]);
        
        const [rows] = await connection.query('SELECT store_id, custom_store_name FROM verification_requests WHERE id = ?', [id]);
        if (rows.length > 0) {
            const { store_id, custom_store_name } = rows[0];
            if (status === 'APPROVED') {
                const endDate = new Date();
                endDate.setMonth(endDate.getMonth() + 1); 
                await connection.query(`UPDATE stores SET is_verified = TRUE, name = ?, subscription_plan = 'TRIAL', sms_limit = 100, sms_used = 0, subscription_end_date = ? WHERE id = ?`, [custom_store_name, endDate, store_id]);
            } else {
                await connection.query('UPDATE stores SET is_verified = FALSE WHERE id = ?', [store_id]);
            }
        }
        await connection.commit();
        res.json({ success: true });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

app.get('/api/admin/users', isAdmin, async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const q = req.query.q || '';
    const offset = (page - 1) * limit;

    try {
        let query = 'SELECT * FROM users';
        let countQuery = 'SELECT COUNT(*) as total FROM users';
        let params = [];

        if (q) {
            const searchClause = ' WHERE first_name LIKE ? OR username LIKE ? OR phone_number LIKE ?';
            query += searchClause;
            countQuery += searchClause;
            const searchParam = `%${q}%`;
            params = [searchParam, searchParam, searchParam];
        }
        query += ' ORDER BY last_seen DESC LIMIT ? OFFSET ?';
        const queryParams = [...params, limit, offset];

        const [users] = await pool.query(query, queryParams);
        const [countResult] = await pool.query(countQuery, params);
        
        res.json({ users, total: countResult[0].total, page, totalPages: Math.ceil(countResult[0].total / limit) });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/users/:telegramId/stores', isAdmin, async (req, res) => {
    const { telegramId } = req.params;
    try {
        const [stores] = await pool.query(`
            SELECT s.*, 
            (SELECT COUNT(*) FROM debtors WHERE store_id = s.id) as debtors_count
            FROM stores s
            WHERE owner_telegram_id = ?
            ORDER BY s.created_at DESC
        `, [telegramId]);
        res.json(stores);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/admin/stores/:storeId/debtors', isAdmin, async (req, res) => {
    const { storeId } = req.params;
    try {
        const [debtors] = await pool.query(`SELECT * FROM debtors WHERE store_id = ? ORDER BY balance DESC`, [storeId]);
        res.json(debtors);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET OTP LOGS (New Endpoint)
app.get('/api/admin/otp-logs', isAdmin, async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT * FROM otp_request_logs ORDER BY created_at DESC LIMIT 50
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// RESET OTP LIMITS (New Endpoint)
app.post('/api/admin/otp-logs/reset', isAdmin, async (req, res) => {
    const { type, value } = req.body; // type: 'phone' or 'ip', value: string

    if (!value || (type !== 'phone' && type !== 'ip')) {
        return res.status(400).json({ error: 'Invalid parameters' });
    }

    try {
        if (type === 'phone') {
             await pool.query('DELETE FROM otp_request_logs WHERE phone_number = ?', [value]);
        } else {
             await pool.query('DELETE FROM otp_request_logs WHERE ip_address = ?', [value]);
        }
        res.json({ success: true, message: `Limits reset for ${type}: ${value}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).send({ error: 'Invalid JSON syntax' });
  }
  if (err && err.type === 'entity.too.large') {
     return res.status(413).send({ error: 'Суръати расм аз ҳад зиёд аст. Лутфан расми хурдтарро интихоб кунед.' });
  }
  console.error('Unhandled Global Error:', err);
  next(err);
});

// --- CATCH-ALL ROUTE (Must be LAST) ---
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3000;
console.clear();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Collaborator & Admin system active...');
});
