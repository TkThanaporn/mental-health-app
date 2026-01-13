// server/routes/psychologistRoutes.js
const THE_ONE_PSYCHOLOGIST_ID = 2; // ❗ ตรวจสอบให้ตรงกับ user_id ในตาราง users

router.get('/available', async (req, res) => {
    try {
        const [psycho] = await db.execute(`
            SELECT 
                p.psychologist_id, 
                u.fullname,  -- ✅ ใช้ fullname ตามโครงสร้างตารางของคุณ
                p.available_settings 
            FROM PsychologistProfiles p 
            JOIN Users u ON u.user_id = p.psychologist_id
            WHERE p.psychologist_id = ?
        `, [THE_ONE_PSYCHOLOGIST_ID]);
        
        if (psycho.length === 0) {
            return res.status(404).json({ msg: 'ไม่พบโปรไฟล์นักจิตวิทยา' });
        }
        res.json(psycho[0]);
    } catch (err) {
        console.error("ERROR:", err.message);
        res.status(500).send('Server error.');
    }
});