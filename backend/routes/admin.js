const router = require('express').Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

// === СТАТИСТИКА ===
router.get('/stats', async (req, res) => {
    try {
        const u = await pool.query("SELECT count(*) FROM users WHERE role='student'");
        const t = await pool.query("SELECT count(*) FROM tests WHERE published=true");
        const v = await pool.query("SELECT count(*) FROM audit_logs WHERE event='TEST_VIOLATION'");
        res.json({ 
            users: { students: u.rows[0].count }, 
            tests: { active: t.rows[0].count }, 
            violations: { total: v.rows[0].count } 
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// === ПОЛЬЗОВАТЕЛИ ===
router.get('/users', async (req, res) => {
    try { 
        const r = await pool.query(`SELECT * FROM users ORDER BY id DESC`); 
        res.json(r.rows); 
    } catch (e) { res.status(500).json({error:e.message}); }
});

router.post('/users', async (req, res) => {
    const { full_name, email, role, school, className, password, telegram_id } = req.body;
    if (role === 'admin' && !telegram_id) return res.status(400).json({ error: "Ошибка: Админу нужен Telegram ID!" });
    if (!password) return res.status(400).json({ error: "Ошибка: Пароль обязателен!" });

    try {
        const hash = await bcrypt.hash(password, 10);
        const r = await pool.query(
            `INSERT INTO users (full_name, email, role, school, class, password, telegram_id, consent_pdn) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, true) RETURNING *`,
            [full_name, email, role, school, className, hash, telegram_id || null]
        );
        res.json(r.rows[0]);
    } catch (e) { res.status(500).json({ error: "Ошибка: Email уже используется" }); }
});

router.delete('/users/:id', async (req, res) => {
    try { await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]); res.json({success:true}); } 
    catch (e) { res.status(500).json({error:e.message}); }
});

// === ТЕСТЫ ===
router.get('/tests', async (req, res) => {
    try { const r = await pool.query(`SELECT * FROM tests ORDER BY id DESC`); res.json(r.rows); } 
    catch (e) { res.status(500).json({error:e.message}); }
});

router.get('/tests/:id/full', async (req, res) => {
    try {
        const t = await pool.query('SELECT * FROM tests WHERE id=$1', [req.params.id]);
        const q = await pool.query('SELECT * FROM questions WHERE test_id=$1 ORDER BY id ASC', [req.params.id]);
        if(t.rows.length === 0) return res.status(404).json({error:'Тест не найден'});
        res.json({ test: t.rows[0], questions: q.rows });
    } catch(e) { res.status(500).json({error:e.message}); }
});

router.post('/tests', async (req, res) => {
    const { name, type, subject, duration_minutes, published, questions } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const r = await client.query(
            `INSERT INTO tests (name, type, subject, duration_minutes, published, proctoring_settings) 
             VALUES ($1, $2, $3, $4, $5, '{}') RETURNING id`,
            [name, type, subject, duration_minutes, published||false]
        );
        const testId = r.rows[0].id;

        if (questions && questions.length) {
            for (const q of questions) {
                await client.query(
                    `INSERT INTO questions (test_id, type, text, points, options, correct_answers) 
                     VALUES ($1, 'single', $2, $3, $4, $5)`,
                    [testId, q.text, q.points || 1, JSON.stringify(q.options), JSON.stringify(q.correctAnswer)]
                );
            }
        }
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (e) { await client.query('ROLLBACK'); res.status(500).json({error:e.message}); } 
    finally { client.release(); }
});

router.put('/tests/:id', async (req, res) => {
    const { id } = req.params;
    const { name, type, subject, duration_minutes, published, questions } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query(
            `UPDATE tests SET name=$1, type=$2, subject=$3, duration_minutes=$4, published=$5 WHERE id=$6`,
            [name, type, subject, duration_minutes, published, id]
        );
        await client.query(`DELETE FROM questions WHERE test_id=$1`, [id]);

        if (questions && questions.length) {
            for (const q of questions) {
                await client.query(
                    `INSERT INTO questions (test_id, type, text, points, options, correct_answers) 
                     VALUES ($1, 'single', $2, $3, $4, $5)`,
                    [id, q.text, q.points || 1, JSON.stringify(q.options), JSON.stringify(q.correctAnswer)]
                );
            }
        }
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (e) { await client.query('ROLLBACK'); res.status(500).json({error:e.message}); } 
    finally { client.release(); }
});

router.put('/tests/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    const { published } = req.body;
    await pool.query('UPDATE tests SET published = $1 WHERE id = $2', [published, id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/tests/:id', async (req, res) => {
    try { await pool.query('DELETE FROM tests WHERE id=$1', [req.params.id]); res.json({success:true}); } 
    catch (e) { res.status(500).json({error:e.message}); }
});
router.get('/sessions', async (req, res) => {
    try {
        const q = `
            SELECT 
                s.id, 
                s.user_id, 
                u.full_name as user_name, 
                t.name as test_name, 
                s.score, 
                s.start_time, 
                s.end_time,
                s.recording_links, -- 👈 ДОБАВЛЕНО ЭТО ПОЛЕ
                (
                    SELECT count(*) FROM audit_logs a 
                    WHERE a.user_id = s.user_id 
                    AND a.event = 'TEST_VIOLATION'
                    AND (
                        (a.data->>'test_id')::int = s.test_id
                        OR 
                        (
                            a.data->>'test_id' IS NULL 
                            AND a.event_time >= s.start_time - interval '1 hour'
                            AND (s.end_time IS NULL OR a.event_time <= s.end_time + interval '12 hour')
                        )
                    )
                ) as violations_count
            FROM test_sessions s
            JOIN users u ON s.user_id = u.id
            JOIN tests t ON s.test_id = t.id
            ORDER BY s.id DESC LIMIT 50
        `;
        const r = await pool.query(q);
        res.json(r.rows);
    } catch (e) { res.status(500).json({error:e.message}); }
});
router.get('/violations', async (req, res) => {
    try {
        // Мы добавляем возможность фильтрации через ?user_id=...&test_id=...
        const { user_id, test_id } = req.query;
        
        let query = `
            SELECT a.id, u.full_name as user_name, t.name as test_name, a.event, a.event_time, a.data
            FROM audit_logs a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN tests t ON (a.data->>'test_id')::int = t.id
            WHERE a.event = 'TEST_VIOLATION'
        `;

        const params = [];
        if (user_id) {
            params.push(user_id);
            query += ` AND a.user_id = $${params.length}`;
        }
        if (test_id) {
            params.push(test_id);
            query += ` AND (a.data->>'test_id')::int = $${params.length}`;
        }

        query += ` ORDER BY a.event_time DESC LIMIT 50`;

        const r = await pool.query(query, params);
        res.json(r.rows);
    } catch (e) { res.status(500).json({error:e.message}); }
});
router.get('/reports', async (req, res) => {
    // 1. Добавляем type в параметры
    const { dateRange, schoolId, subject, type } = req.query; 

    try {
        let timeFilter = "s.end_time IS NOT NULL";
        const params = [];

        // --- ФИЛЬТР ПО ДАТЕ ---
        if (dateRange === 'week') timeFilter += " AND s.end_time > NOW() - INTERVAL '7 days'";
        if (dateRange === 'month') timeFilter += " AND s.end_time > NOW() - INTERVAL '30 days'";
        if (dateRange === 'quarter') timeFilter += " AND s.end_time > NOW() - INTERVAL '90 days'";
        if (dateRange === 'year') timeFilter += " AND s.end_time > NOW() - INTERVAL '1 year'";

        // --- ФИЛЬТР ПО ШКОЛЕ ---
        let schoolFilter = "";
        if (schoolId && schoolId !== 'all') {
            const schoolNameRes = await pool.query("SELECT name FROM schools WHERE id = $1", [schoolId]);
            if (schoolNameRes.rows.length > 0) {
                params.push(schoolNameRes.rows[0].name);
                schoolFilter = `AND u.school = $${params.length}`;
            }
        }

        // --- ФИЛЬТР ПО ПРЕДМЕТУ ---
        let subjectFilter = "";
        if (subject && subject !== 'all') {
            // Проверка: если пришел массив предметов, используем ANY, иначе обычное равенство
            if (Array.isArray(subject)) {
                params.push(subject);
                subjectFilter = `AND t.subject = ANY($${params.length}::text[])`;
            } else {
                params.push(subject);
                subjectFilter = `AND t.subject = $${params.length}`;
            }
        }

        // --- ФИЛЬТР ПО ТИПУ (ENT, MODO, PISA) ---
        // ВОТ ТУТ БЫЛА ПРОБЛЕМА ИЛИ ЕЕ НЕ БЫЛО ВООБЩЕ
        let typeFilter = "";
        if (type && type !== 'all') {
            // Если фронт шлет массив ?type=ENT&type=MODO или строку ?type=ENT
            const types = Array.isArray(type) ? type : [type];
            params.push(types);
            // Используем ANY для безопасной фильтрации массива
            typeFilter = `AND t.type = ANY($${params.length}::text[])`;
        }

        // Собираем все WHERE условия в одну строку для удобства
        const whereClause = `WHERE ${timeFilter} ${schoolFilter} ${subjectFilter} ${typeFilter}`;

        // --- 1. KPI ЗАПРОС ---
        const kpiQuery = `
            SELECT 
                COUNT(*) as total_exams,
                COALESCE(AVG(s.score), 0) as avg_score,
                COUNT(CASE WHEN s.score >= 50 THEN 1 END) as passed_count
            FROM test_sessions s
            JOIN users u ON s.user_id = u.id
            JOIN tests t ON s.test_id = t.id
            ${whereClause}
        `;
        const kpiRes = await pool.query(kpiQuery, params);
        const kpi = kpiRes.rows[0];

        // --- 2. ИНДЕКС СПИСЫВАНИЯ ---
        const cheatingQuery = `
            SELECT COUNT(DISTINCT s.id) 
            FROM test_sessions s
            JOIN users u ON s.user_id = u.id
            JOIN tests t ON s.test_id = t.id
            JOIN audit_logs a ON a.user_id = s.user_id 
                AND a.event = 'TEST_VIOLATION' 
                AND a.event_time BETWEEN s.start_time AND COALESCE(s.end_time, NOW())
            ${whereClause}
        `;
        const cheatingRes = await pool.query(cheatingQuery, params);
        const cheatingCount = parseInt(cheatingRes.rows[0].count);
        const totalExams = parseInt(kpi.total_exams) || 1;

        // --- 3. РАСПРЕДЕЛЕНИЕ БАЛЛОВ ---
        const distQuery = `
            SELECT 
                CASE 
                    WHEN s.score <= 50 THEN '0-50'
                    WHEN s.score <= 70 THEN '51-70'
                    WHEN s.score <= 85 THEN '71-85'
                    ELSE '86-100'
                END as range,
                COUNT(*) as count
            FROM test_sessions s
            JOIN users u ON s.user_id = u.id
            JOIN tests t ON s.test_id = t.id
            ${whereClause}
            GROUP BY range
        `;
        const distRes = await pool.query(distQuery, params);
        
        const distMap = { '0-50': 0, '51-70': 0, '71-85': 0, '86-100': 0 };
        distRes.rows.forEach(r => distMap[r.range] = parseInt(r.count));
        const distribution = [
            { range: '0-50', count: distMap['0-50'], color: '#ef4444' },
            { range: '51-70', count: distMap['51-70'], color: '#f59e0b' },
            { range: '71-85', count: distMap['71-85'], color: '#6366f1' },
            { range: '86-100', count: distMap['86-100'], color: '#10b981' }
        ];

        // --- 4. СЛОЖНЫЕ ВОПРОСЫ ---
        const diffQuery = `
            SELECT 
                q.id, 
                LEFT(q.text, 50) as text, 
                COUNT(*) as total_attempts,
                SUM(CASE WHEN a.points_awarded > 0 THEN 1 ELSE 0 END) as correct_count
            FROM answers a
            JOIN questions q ON a.question_id = q.id
            JOIN users u ON a.user_id = u.id
            JOIN tests t ON a.test_id = t.id
            JOIN test_sessions s ON s.user_id = a.user_id AND s.test_id = a.test_id
            ${whereClause}
            GROUP BY q.id
            HAVING COUNT(*) > 0
            ORDER BY (SUM(CASE WHEN a.points_awarded > 0 THEN 1 ELSE 0 END)::float / COUNT(*)) ASC
            LIMIT 5
        `;
        const diffRes = await pool.query(diffQuery, params);
        
        const difficultQuestions = diffRes.rows.map(r => ({
            id: r.id,
            text: r.text + '...',
            correctRate: Math.round((r.correct_count / r.total_attempts) * 100)
        }));

        // --- 5. HEATMAP ---
        // Используем тот же whereClause, но без лимита в 5
        // Упростим запрос для heatmap, чтобы не дублировать логику
        const heatmapQuery = `
            SELECT 
                q.id as q, 
                CASE WHEN COUNT(*) = 0 THEN 0 
                     ELSE (SUM(CASE WHEN a.points_awarded > 0 THEN 1 ELSE 0 END)::float / COUNT(*)) * 100 
                END as val
            FROM answers a
            JOIN questions q ON a.question_id = q.id
            JOIN users u ON a.user_id = u.id
            JOIN tests t ON a.test_id = t.id
            JOIN test_sessions s ON s.user_id = a.user_id AND s.test_id = a.test_id
            ${whereClause}
            GROUP BY q.id
            LIMIT 100
        `;
        const heatmapRes = await pool.query(heatmapQuery, params);
        
        const heatmap = heatmapRes.rows.map(r => ({
            q: r.q,
            val: Math.round(r.val)
        }));

        res.json({
            kpi: {
                avgScore: Math.round(kpi.avg_score),
                passRate: totalExams > 0 ? Math.round((kpi.passed_count / totalExams) * 100) : 0,
                cheatingIndex: totalExams > 0 ? Math.round((cheatingCount / totalExams) * 100) : 0,
                totalExams: parseInt(kpi.total_exams)
            },
            distribution,
            difficultQuestions,
            heatmap
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});
router.get('/schools', async (req, res) => {
    try {
        // Если используешь pg/pool
        const result = await pool.query('SELECT * FROM schools ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка получения списка школ' });
    }
});

module.exports = router;