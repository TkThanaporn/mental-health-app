// server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const bcrypt = require('bcryptjs'); // ✅ เปลี่ยนเป็น bcryptjs ให้เหมือน authRoutes
const { authMiddleware, authorizeRole } = require('../middleware/auth');

const defaultDashboardYears = [2025];

const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const gradeLabels = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

const parseDashboardYear = (year) => {
    const currentYear = new Date().getFullYear();
    const requestedYear = parseInt(year, 10);
    return Number.isInteger(requestedYear) ? requestedYear : currentYear;
};

const toBuddhistYear = (year) => Number(year) + 543;

const normalizeDashboardYears = (years, selectedYear) => {
    const currentYear = new Date().getFullYear();
    return [...new Set([
        currentYear,
        selectedYear,
        ...defaultDashboardYears,
        ...years
    ].filter(Boolean).map(Number))].sort((a, b) => b - a);
};

const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getDashboardStats = async (year) => {
    const currentYear = new Date().getFullYear();
    const selectedYear = parseDashboardYear(year);

    const [students] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Student'");
    const [psychologists] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Psychologist'");
    const [admins] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Admin'");
    const [totalUsers] = await db.query("SELECT COUNT(*) as count FROM users WHERE role IN ('Student', 'Psychologist', 'Admin')");
    const [roleRows] = await db.query(`
        SELECT role, COUNT(*) AS count
        FROM users
        WHERE role IN ('Student', 'Psychologist', 'Admin')
        GROUP BY role
    `);

    let confirmedAppointments = 0;
    try {
        const [appt] = await db.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'");
        confirmedAppointments = appt[0].count;
    } catch (e) { console.log("Appointments table not ready"); }

    let pendingAssessments = 0;
    try {
        const [assess] = await db.query("SELECT COUNT(*) as count FROM assessments");
        pendingAssessments = assess[0].count;
    } catch (e) { console.log("Assessments table not ready"); }

    let availableYears = [currentYear];
    let monthlyConsultations = monthLabels.map((label, index) => ({ month: index + 1, label, count: 0 }));
    let dormitoryUsage = [];
    let gradeUsage = gradeLabels.map((grade) => ({ grade, count: 0 }));
    let yearlyAppointments = 0;

    try {
        const [yearRows] = await db.query(`
            SELECT DISTINCT YEAR(booking_date) AS year
            FROM appointments
            WHERE booking_date IS NOT NULL
            ORDER BY year DESC
        `);
        availableYears = normalizeDashboardYears(yearRows.map((row) => row.year), selectedYear);

        const [monthlyRows] = await db.query(`
            SELECT MONTH(booking_date) AS month, COUNT(*) AS count
            FROM appointments
            WHERE YEAR(booking_date) = ?
            GROUP BY MONTH(booking_date)
        `, [selectedYear]);
        monthlyConsultations = monthlyConsultations.map((item) => {
            const found = monthlyRows.find((row) => Number(row.month) === item.month);
            return { ...item, count: found ? Number(found.count) : 0 };
        });
        yearlyAppointments = monthlyConsultations.reduce((sum, item) => sum + item.count, 0);

        const [dormRows] = await db.query(`
            SELECT
                COALESCE(NULLIF(TRIM(u.dormitory), ''), 'ไม่ระบุ') AS dormitory,
                COUNT(DISTINCT a.student_user_id) AS count
            FROM appointments a
            JOIN users u ON a.student_user_id = u.user_id
            WHERE YEAR(a.booking_date) = ? AND u.role = 'Student'
            GROUP BY COALESCE(NULLIF(TRIM(u.dormitory), ''), 'ไม่ระบุ')
            ORDER BY count DESC
            LIMIT 10
        `, [selectedYear]);
        dormitoryUsage = dormRows.map((row) => ({ dormitory: row.dormitory, count: Number(row.count) }));

        const [gradeRows] = await db.query(`
            SELECT u.education_level AS grade, COUNT(DISTINCT a.student_user_id) AS count
            FROM appointments a
            JOIN users u ON a.student_user_id = u.user_id
            WHERE YEAR(a.booking_date) = ? AND u.role = 'Student'
            GROUP BY u.education_level
        `, [selectedYear]);
        const gradeCountMap = gradeRows.reduce((map, row) => {
            const match = String(row.grade || '').match(/[1-6]/);
            if (match) {
                const label = `ม.${match[0]}`;
                map[label] = (map[label] || 0) + Number(row.count);
            }
            return map;
        }, {});
        gradeUsage = gradeUsage.map((item) => ({ ...item, count: gradeCountMap[item.grade] || 0 }));
    } catch (e) {
        console.log("Dashboard chart data not ready:", e.message);
        availableYears = normalizeDashboardYears(availableYears, selectedYear);
    }

    const roleCountMap = roleRows.reduce((map, row) => {
        map[row.role] = Number(row.count);
        return map;
    }, {});

    return {
        selectedYear,
        availableYears,
        total_users: totalUsers[0].count,
        total_students: students[0].count,
        total_admins: admins[0].count,
        pending_assessments: pendingAssessments,
        confirmed_appointments: confirmedAppointments,
        yearly_appointments: yearlyAppointments,
        pending_psychologists: psychologists[0].count,
        roleSummary: [
            { role: 'Student', label: 'นักเรียน', count: roleCountMap.Student || 0 },
            { role: 'Psychologist', label: 'นักจิตวิทยา', count: roleCountMap.Psychologist || 0 },
            { role: 'Admin', label: 'ผู้ดูแลระบบ', count: roleCountMap.Admin || 0 }
        ],
        monthlyConsultations,
        dormitoryUsage,
        gradeUsage
    };
};

const renderRows = (rows, columns) => rows.map((row) => `
    <tr>
        ${columns.map((column) => `<td>${escapeHtml(row[column.key])}</td>`).join('')}
    </tr>
`).join('');

const renderTable = (title, rows, columns) => `
    <h2>${escapeHtml(title)}</h2>
    <table>
        <thead>
            <tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('')}</tr>
        </thead>
        <tbody>${renderRows(rows, columns)}</tbody>
    </table>
`;

const buildReportHtml = (stats, printable = false) => {
    const generatedAt = new Date().toLocaleString('th-TH');
    const displayYear = toBuddhistYear(stats.selectedYear);
    const summaryRows = [
        { label: 'ปีข้อมูล', value: displayYear },
        { label: 'ผู้ใช้ทั้งหมด', value: stats.total_users },
        { label: 'นักเรียนทั้งหมด', value: stats.total_students },
        { label: 'นักจิตวิทยา', value: stats.pending_psychologists },
        { label: 'ผู้ดูแลระบบ', value: stats.total_admins },
        { label: 'คำขอรับคำปรึกษาทั้งปี', value: stats.yearly_appointments },
        { label: 'นัดหมายยืนยันทั้งหมด', value: stats.confirmed_appointments },
        { label: 'แบบประเมินทั้งหมด', value: stats.pending_assessments }
    ];

    return `<!doctype html>
<html lang="th">
<head>
    <meta charset="utf-8" />
    <title>รายงานสถิติระบบให้คำปรึกษา ${escapeHtml(displayYear)}</title>
    <style>
        body { font-family: Tahoma, Arial, sans-serif; color: #1f2937; margin: 32px; }
        h1 { color: #003566; margin-bottom: 4px; }
        h2 { color: #003566; font-size: 18px; margin: 28px 0 10px; }
        .meta { color: #64748b; margin-bottom: 24px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 18px; }
        th { background: #003566; color: #fff; text-align: left; }
        th, td { border: 1px solid #d7dee8; padding: 9px 10px; font-size: 14px; }
        tr:nth-child(even) td { background: #f8fafc; }
        .note { margin-top: 22px; color: #64748b; font-size: 13px; }
        .print-button { background: #F25C05; border: 0; color: #fff; padding: 10px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; }
        @media print { .print-button { display: none; } body { margin: 18mm; } }
    </style>
</head>
<body>
    ${printable ? '<button class="print-button" onclick="window.print()">พิมพ์ / Save as PDF</button>' : ''}
    <h1>รายงานสถิติระบบให้คำปรึกษา</h1>
    <div class="meta">ปีข้อมูล: ${escapeHtml(displayYear)} | สร้างเมื่อ: ${escapeHtml(generatedAt)}</div>
    ${renderTable('ภาพรวม', summaryRows, [{ key: 'label', label: 'รายการ' }, { key: 'value', label: 'จำนวน' }])}
    ${renderTable('สัดส่วนผู้ใช้งานทั้งหมด', stats.roleSummary, [{ key: 'label', label: 'ประเภทผู้ใช้' }, { key: 'count', label: 'จำนวน' }])}
    ${renderTable('จำนวนผู้ขอรับคำปรึกษารายเดือน', stats.monthlyConsultations, [{ key: 'label', label: 'เดือน' }, { key: 'count', label: 'จำนวนคำขอ' }])}
    ${renderTable('หอพักที่ใช้บริการมากที่สุด', stats.dormitoryUsage, [{ key: 'dormitory', label: 'หอพัก' }, { key: 'count', label: 'จำนวนนักเรียน' }])}
    ${renderTable('ระดับชั้นที่ใช้บริการมากที่สุด', stats.gradeUsage, [{ key: 'grade', label: 'ระดับชั้น' }, { key: 'count', label: 'จำนวนนักเรียน' }])}
    <div class="note">หมายเหตุ: รายเดือนนับจำนวนคำขอจากวันที่นัดหมาย ส่วนหอพักและระดับชั้นนับนักเรียนที่มีคำขอในปีที่เลือก</div>
</body>
</html>`;
};

router.get('/summary', authMiddleware, authorizeRole(['Admin']), async (req, res, next) => {
    try {
        return res.json(await getDashboardStats(req.query.year));

        const currentYear = new Date().getFullYear();
        const requestedYear = parseInt(req.query.year, 10);
        const selectedYear = Number.isInteger(requestedYear) ? requestedYear : currentYear;
        const monthLabels = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const gradeLabels = ['ม.1', 'ม.2', 'ม.3', 'ม.4', 'ม.5', 'ม.6'];

        const [students] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Student'");
        const [psychologists] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Psychologist'");
        const [admins] = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'Admin'");
        const [totalUsers] = await db.query("SELECT COUNT(*) as count FROM users WHERE role IN ('Student', 'Psychologist', 'Admin')");
        const [roleRows] = await db.query(`
            SELECT role, COUNT(*) AS count
            FROM users
            WHERE role IN ('Student', 'Psychologist', 'Admin')
            GROUP BY role
        `);

        let confirmedAppointments = 0;
        try {
            const [appt] = await db.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'confirmed'");
            confirmedAppointments = appt[0].count;
        } catch (e) { console.log("Appointments table not ready"); }

        let pendingAssessments = 0;
        try {
            const [assess] = await db.query("SELECT COUNT(*) as count FROM assessments");
            pendingAssessments = assess[0].count;
        } catch (e) { console.log("Assessments table not ready"); }

        let availableYears = [currentYear];
        let monthlyConsultations = monthLabels.map((label, index) => ({ month: index + 1, label, count: 0 }));
        let dormitoryUsage = [];
        let gradeUsage = gradeLabels.map((grade) => ({ grade, count: 0 }));
        let yearlyAppointments = 0;

        try {
            const [yearRows] = await db.query(`
                SELECT DISTINCT YEAR(booking_date) AS year
                FROM appointments
                WHERE booking_date IS NOT NULL
                ORDER BY year DESC
            `);
            availableYears = yearRows.map((row) => row.year).filter(Boolean);
            if (!availableYears.includes(currentYear)) availableYears.unshift(currentYear);
            if (!availableYears.includes(selectedYear)) availableYears.unshift(selectedYear);

            const [monthlyRows] = await db.query(`
                SELECT MONTH(booking_date) AS month, COUNT(*) AS count
                FROM appointments
                WHERE YEAR(booking_date) = ?
                GROUP BY MONTH(booking_date)
            `, [selectedYear]);
            monthlyConsultations = monthlyConsultations.map((item) => {
                const found = monthlyRows.find((row) => Number(row.month) === item.month);
                return { ...item, count: found ? Number(found.count) : 0 };
            });
            yearlyAppointments = monthlyConsultations.reduce((sum, item) => sum + item.count, 0);

            const [dormRows] = await db.query(`
                SELECT
                    COALESCE(NULLIF(TRIM(u.dormitory), ''), 'ไม่ระบุ') AS dormitory,
                    COUNT(DISTINCT a.student_user_id) AS count
                FROM appointments a
                JOIN users u ON a.student_user_id = u.user_id
                WHERE YEAR(a.booking_date) = ? AND u.role = 'Student'
                GROUP BY COALESCE(NULLIF(TRIM(u.dormitory), ''), 'ไม่ระบุ')
                ORDER BY count DESC
                LIMIT 10
            `, [selectedYear]);
            dormitoryUsage = dormRows.map((row) => ({ dormitory: row.dormitory, count: Number(row.count) }));

            const [gradeRows] = await db.query(`
                SELECT u.education_level AS grade, COUNT(DISTINCT a.student_user_id) AS count
                FROM appointments a
                JOIN users u ON a.student_user_id = u.user_id
                WHERE YEAR(a.booking_date) = ? AND u.role = 'Student'
                GROUP BY u.education_level
            `, [selectedYear]);
            const gradeCountMap = gradeRows.reduce((map, row) => {
                const match = String(row.grade || '').match(/[1-6]/);
                if (match) {
                    const label = `ม.${match[0]}`;
                    map[label] = (map[label] || 0) + Number(row.count);
                }
                return map;
            }, {});
            gradeUsage = gradeUsage.map((item) => ({ ...item, count: gradeCountMap[item.grade] || 0 }));
        } catch (e) {
            console.log("Dashboard chart data not ready:", e.message);
        }

        const roleCountMap = roleRows.reduce((map, row) => {
            map[row.role] = Number(row.count);
            return map;
        }, {});

        res.json({
            selectedYear,
            availableYears,
            total_users: totalUsers[0].count,
            total_students: students[0].count,
            total_admins: admins[0].count,
            pending_assessments: pendingAssessments,
            confirmed_appointments: confirmedAppointments,
            yearly_appointments: yearlyAppointments,
            pending_psychologists: psychologists[0].count,
            roleSummary: [
                { role: 'Student', label: 'นักเรียน', count: roleCountMap.Student || 0 },
                { role: 'Psychologist', label: 'นักจิตวิทยา', count: roleCountMap.Psychologist || 0 },
                { role: 'Admin', label: 'ผู้ดูแลระบบ', count: roleCountMap.Admin || 0 }
            ],
            monthlyConsultations,
            dormitoryUsage,
            gradeUsage
        });
    } catch (err) {
        next(err);
    }
});

router.get('/export/excel', authMiddleware, authorizeRole(['Admin']), async (req, res, next) => {
    try {
        const stats = await getDashboardStats(req.query.year);
        const html = buildReportHtml(stats, false);
        const filename = `pcshs-heartcare-report-${toBuddhistYear(stats.selectedYear)}.xls`;

        res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send('\ufeff' + html);
    } catch (err) {
        next(err);
    }
});

router.get('/export/report', authMiddleware, authorizeRole(['Admin']), async (req, res, next) => {
    try {
        const stats = await getDashboardStats(req.query.year);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(buildReportHtml(stats, true));
    } catch (err) {
        next(err);
    }
});


// ==========================================
// 1.5 🔔 ดึงรายชื่อผู้ใช้ใหม่ล่าสุด (สำหรับแจ้งเตือนกระดิ่ง)
// ==========================================
router.get('/notifications/new-users', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    try {
        const sql = `
            SELECT user_id AS id, fullname, email, created_at 
            FROM users 
            WHERE role = 'Student' 
            ORDER BY created_at DESC 
            LIMIT 10
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        console.error("Notifications API Error:", err);
        res.status(500).json({ error: 'Database Error' });
    }
});


// ==========================================
// 2. 👥 ดึงรายชื่อผู้ใช้ทั้งหมด (สำหรับหน้าจัดการ Users)
// ==========================================
router.get('/users', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    try {
        const [rows] = await db.query("SELECT user_id, fullname, email, role, phone, created_at, profile_image FROM users ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Database Error' });
    }
});

// ==========================================
// 3. ➕ เพิ่มผู้ใช้งานใหม่ (Create User)
// ==========================================
router.post('/users', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    const { fullname, email, password, role, phone, gender } = req.body;

    if (!fullname || !email || !password || !role) {
        return res.status(400).json({ msg: 'กรุณากรอกข้อมูลให้ครบ' });
    }

    try {
        const [existing] = await db.query("SELECT user_id FROM users WHERE email = ?", [email]);
        if (existing.length > 0) return res.status(400).json({ msg: 'อีเมลนี้มีอยู่ในระบบแล้ว' });

        const salt = await bcrypt.genSalt(10);
        const hashed_password = await bcrypt.hash(password, salt);
        const profile_image = `https://ui-avatars.com/api/?name=${encodeURIComponent(fullname)}&background=random&color=fff`;

        // ✅ เปลี่ยน password_hash เป็น password ให้ตรงกับตาราง users ล่าสุด
        const sql = `INSERT INTO users (fullname, email, password, role, phone, gender, profile_image, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`;
        await db.query(sql, [fullname, email, hashed_password, role, phone || null, gender || 'Other', profile_image]);

        res.json({ msg: 'เพิ่มผู้ใช้งานสำเร็จ' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// ==========================================
// 4. ✏️ แก้ไขข้อมูลผู้ใช้งาน (Update User) - เพิ่มใหม่!
// ==========================================
router.put('/users/:id', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    const { fullname, email, role, phone, gender } = req.body;
    const userId = req.params.id;

    try {
        // 1. ตรวจสอบว่าผู้ใช้มีตัวตนจริงไหม
        const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [userId]);
        if (user.length === 0) {
            return res.status(404).json({ msg: 'ไม่พบผู้ใช้งานที่ต้องการแก้ไข' });
        }

        // 2. ตรวจสอบว่าอีเมลใหม่ไปซ้ำกับคนอื่นไหม (ถ้ามีการเปลี่ยนอีเมล)
        const [existingEmail] = await db.query("SELECT user_id FROM users WHERE email = ? AND user_id != ?", [email, userId]);
        if (existingEmail.length > 0) {
            return res.status(400).json({ msg: 'อีเมลนี้ถูกใช้งานโดยผู้ใช้รายอื่นแล้ว' });
        }

        // 3. อัปเดตข้อมูล (ไม่รวมรหัสผ่าน เพื่อความปลอดภัย)
        const sql = `
            UPDATE users 
            SET fullname = ?, email = ?, role = ?, phone = ?, gender = ?
            WHERE user_id = ?
        `;
        await db.query(sql, [fullname, email, role, phone || null, gender || 'Other', userId]);

        res.json({ msg: 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ' });
    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ msg: 'Server Error: ไม่สามารถแก้ไขข้อมูลได้' });
    }
});

// ==========================================
// 5. ❌ ลบผู้ใช้งาน (ปรับปรุงจากเดิม)
// ==========================================
router.delete('/users/:id', authMiddleware, authorizeRole(['Admin']), async (req, res) => {
    try {
        const userId = req.params.id;
        
        // ตรวจสอบก่อนว่ามี user นี้ไหม
        const [user] = await db.query("SELECT * FROM users WHERE user_id = ?", [userId]);
        if (user.length === 0) {
            return res.status(404).json({ msg: 'ไม่พบผู้ใช้งานที่ต้องการลบ' });
        }

        // ทำการลบ
        await db.query("DELETE FROM users WHERE user_id = ?", [userId]);
        res.json({ msg: 'ลบผู้ใช้งานสำเร็จ' });
    } catch (err) {
        console.error("Delete Error:", err);
        res.status(500).json({ msg: 'Server Error: ไม่สามารถลบผู้ใช้งานได้ (อาจมีข้อมูลที่เกี่ยวข้องอยู่ในตารางอื่น)' });
    }
});

module.exports = router;