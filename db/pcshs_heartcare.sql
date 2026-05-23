-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 22, 2026 at 12:38 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `pcshs_heartcare`
--

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `appointment_id` int(11) NOT NULL,
  `student_user_id` int(11) NOT NULL,
  `psychologist_user_id` int(11) NOT NULL,
  `schedule_id` int(11) DEFAULT NULL,
  `type` enum('online','onsite') NOT NULL,
  `topic` text DEFAULT NULL,
  `consultation_type` enum('individual','group') NOT NULL,
  `status` enum('pending','confirmed','completed','cancelled','no-show') DEFAULT 'pending',
  `booking_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `result_summary` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`appointment_id`, `student_user_id`, `psychologist_user_id`, `schedule_id`, `type`, `topic`, `consultation_type`, `status`, `booking_date`, `result_summary`) VALUES
(1, 6, 5, 1, 'onsite', 'สอบ', 'individual', 'confirmed', '2026-05-12 04:41:13', NULL),
(2, 27, 5, 3, 'onsite', 'ทดสอบกราฟ ม.ค.', 'individual', 'confirmed', '2026-01-05 02:00:00', NULL),
(3, 28, 5, 4, 'online', 'ทดสอบกราฟ ก.พ.', 'individual', 'confirmed', '2026-02-06 02:00:00', NULL),
(4, 29, 5, 5, 'onsite', 'ทดสอบกราฟ มี.ค.', 'individual', 'completed', '2026-03-07 02:00:00', NULL),
(5, 30, 5, 6, 'online', 'ทดสอบกราฟ เม.ย.', 'individual', 'confirmed', '2026-04-08 02:00:00', NULL),
(6, 31, 5, 7, 'onsite', 'ทดสอบกราฟ พ.ค.', 'individual', 'pending', '2026-05-09 02:00:00', NULL),
(7, 32, 5, 8, 'online', 'ทดสอบกราฟ มิ.ย.', 'individual', 'confirmed', '2026-06-10 02:00:00', NULL),
(8, 27, 5, 9, 'online', 'ขอซ้ำเพื่อทดสอบ', 'individual', 'confirmed', '2026-07-11 02:00:00', NULL),
(9, 27, 5, 10, 'online', 'ขอซ้ำเพื่อทดสอบ', 'individual', 'completed', '2026-08-12 02:00:00', NULL),
(10, 29, 5, 11, 'onsite', 'ขอซ้ำเพื่อทดสอบ', 'individual', 'confirmed', '2026-09-13 02:00:00', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `assessments`
--

CREATE TABLE `assessments` (
  `assessment_id` int(11) NOT NULL,
  `student_user_id` int(11) NOT NULL,
  `question1` tinyint(4) DEFAULT NULL,
  `question2` tinyint(4) DEFAULT NULL,
  `question3` tinyint(4) DEFAULT NULL,
  `question4` tinyint(4) DEFAULT NULL,
  `question5` tinyint(4) DEFAULT NULL,
  `question6` tinyint(4) DEFAULT NULL,
  `question7` tinyint(4) DEFAULT NULL,
  `question8` tinyint(4) DEFAULT NULL,
  `question9` tinyint(4) DEFAULT NULL,
  `score` int(11) DEFAULT NULL,
  `stress_level` varchar(25) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assessments`
--

INSERT INTO `assessments` (`assessment_id`, `student_user_id`, `question1`, `question2`, `question3`, `question4`, `question5`, `question6`, `question7`, `question8`, `question9`, `score`, `stress_level`, `created_at`) VALUES
(2, 6, 1, 2, 1, 1, 0, 1, 2, 1, 0, 9, 'ภาวะซึมเศร้าเล็กน้อย', '2026-05-12 04:39:20');

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `messages_id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `receiver_id` int(11) NOT NULL,
  `message_text` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chat_messages`
--

INSERT INTO `chat_messages` (`messages_id`, `appointment_id`, `sender_id`, `receiver_id`, `message_text`, `created_at`) VALUES
(3, 1, 5, 6, 'ดีค่ะ', '2026-05-12 05:08:24'),
(4, 1, 6, 5, 'ค่ะ', '2026-05-12 05:08:31');

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `feedback_id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `student_user_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `groupmembers`
--

CREATE TABLE `groupmembers` (
  `group_member_id` int(11) NOT NULL,
  `appointment_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `schedule_id` int(11) NOT NULL,
  `psychologist_user_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_available` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `schedules`
--

INSERT INTO `schedules` (`schedule_id`, `psychologist_user_id`, `date`, `start_time`, `end_time`, `is_available`, `created_at`) VALUES
(1, 5, '2026-05-14', '09:00:00', '10:00:00', 0, '2026-05-12 04:40:26'),
(2, 5, '2026-05-14', '14:00:00', '15:00:00', 0, '2026-05-12 04:40:26'),
(3, 5, '2026-01-10', '09:00:00', '10:00:00', 0, '2026-05-21 16:04:46'),
(4, 5, '2026-02-12', '09:00:00', '10:00:00', 0, '2026-05-21 16:04:46'),
(5, 5, '2026-03-15', '09:00:00', '10:00:00', 0, '2026-05-21 16:04:46'),
(6, 5, '2026-04-18', '09:00:00', '10:00:00', 0, '2026-05-21 16:04:46'),
(7, 5, '2026-05-20', '09:00:00', '10:00:00', 0, '2026-05-21 16:04:46'),
(8, 5, '2026-06-22', '09:00:00', '10:00:00', 0, '2026-05-21 16:04:46'),
(9, 5, '2026-07-25', '09:00:00', '10:00:00', 0, '2026-05-21 16:04:46'),
(10, 5, '2026-08-28', '09:00:00', '10:00:00', 0, '2026-05-21 16:04:46'),
(11, 5, '2026-09-05', '09:00:00', '10:00:00', 0, '2026-05-21 16:04:46'),
(12, 5, '2026-10-08', '09:00:00', '10:00:00', 0, '2026-05-21 16:04:46'),
(13, 5, '2026-11-11', '09:00:00', '10:00:00', 0, '2026-05-21 16:04:46'),
(14, 5, '2026-12-14', '09:00:00', '10:00:00', 0, '2026-05-21 16:04:46');

-- --------------------------------------------------------

--
-- Table structure for table `system_news`
--

CREATE TABLE `system_news` (
  `news_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text DEFAULT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('draft','published') DEFAULT 'published',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_news`
--

INSERT INTO `system_news` (`news_id`, `title`, `content`, `image_url`, `category`, `user_id`, `status`, `created_at`) VALUES
(1, 'หัวข้อ: ขยายเวลาทำแบบทดสอบบุคลิกภาพ (MBTI) เพื่อการเลือกสายอาชีพ', 'เนื้อหา: งานแนะแนวประกาศขยายเวลาให้นักเรียนชั้น ม.3 และ ม.6 ที่ยังไม่ได้เข้าทำแบบทดสอบบุคลิกภาพผ่านระบบออนไลน์ เพื่อนำผลมาวิเคราะห์ศักยภาพและแรงจูงใจในการเลือกคณะวิชาในมหาวิทยาลัย สามารถเข้าทำได้จนถึงวันศุกร์นี้ก่อนเวลา 16.00', 'http://localhost:5000/uploads/news-1778562872436.png', 'ประกาศ', 4, 'published', '2026-05-12 05:14:32'),
(2, 'เปิดรับสมัครแกนนำ \"Friend Listen\" อาสาสมัครเพื่อนรับฟัง', 'เนื้อหา: ชมรมจิตวิทยาเปิดรับสมัครเพื่อนๆ ที่มีใจรักในการรับฟัง (Active Listening) มาร่วมอบรมทักษะการให้คำปรึกษาเบื้องต้น เพื่อเป็น \"Safe Zone\" ให้กับเพื่อนในหอพัก ใครที่อยากฝึกทักษะการสื่อสารและเห็นอกเห็นใจผู้อื่น (Empathy) ห้ามพลาด! สมัครได้ที่ห้องแนะแนว', 'http://localhost:5000/uploads/news-1778562918220.jpg', 'กิจกรรม', 4, 'published', '2026-05-12 05:15:18'),
(3, 'Social Media Detox\" ลองวางมือถือ แล้วกลับมาคุยกับตัวเอง', 'รู้หรือไม่? การเปรียบเทียบตัวเองกับคนอื่นบนโลกโซเชียลส่งผลต่อ Self-esteem ของเราโดยไม่รู้ตัว สัปดาห์นี้ลองแบ่งเวลาวันละ 30 นาที ปิดแจ้งเตือน แล้วใช้เวลากับงานอดิเรกที่ชอบหรือนั่งสมาธิสั้นๆ เพื่อลดระดับฮอร์โมนความเครียด (Cortisol) และเพิ่มความสุขให้กับจิตใจดูนะคะ', 'http://localhost:5000/uploads/news-1778562992298.jpg', 'สุขภาพจิต', 5, 'published', '2026-05-12 05:16:32'),
(4, 'จัดระเบียบโต๊ะหนังสือ ช่วยให้สมอง Focus ได้ดีขึ้นจริงหรือ?', 'จิตวิทยาสิ่งแวดล้อมระบุว่า \"ความวุ่นวายสายตา\" (Visual Clutter) ทำให้สมองต้องแบ่งทรัพยากรไปประมวลผลสิ่งของที่วางระเกะระกะ จนทำให้สมาธิสั้นลง ลองใช้เวลา 5 นาทีก่อนนอนจัดโต๊ะในหอพักให้โล่งดู แล้วจะพบว่าเช้าวันต่อมาคุณจะเริ่มอ่านหนังสือได้มีประสิทธิภาพมากขึ้น', 'http://localhost:5000/uploads/news-1778563072008.jpg', 'ทั่วไป', 5, 'published', '2026-05-12 05:17:52');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `email` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Student','Psychologist','Admin') NOT NULL,
  `fullname` varchar(50) NOT NULL,
  `phone` varchar(10) DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `education_level` varchar(20) DEFAULT NULL,
  `dormitory` varchar(20) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `otp_code` varchar(6) DEFAULT NULL,
  `otp_expires_at` datetime DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `email`, `password`, `role`, `fullname`, `phone`, `gender`, `education_level`, `dormitory`, `bio`, `profile_image`, `created_at`, `otp_code`, `otp_expires_at`, `is_verified`) VALUES
(4, 'admin@gmail.com', '$2b$10$u0umXquZqgCPyFstx8s1T.sIYW1JkWjsuEm5b9j1wbwARHF9Y4s5G', 'Admin', 'แอดมิน นะจ๊ะ', 'null', 'Female', NULL, NULL, NULL, NULL, '2026-05-12 04:32:21', NULL, NULL, 1),
(5, 'thanaporn282548@gmail.com', '$2b$10$z3ARCA9DPoxDg5CgLS/PFuFRzzyFI9ix5Al0AkCLciVIjPGsBA5Am', 'Psychologist', 'คุณหมอแก้ว จิตราภรณ์', NULL, 'Female', NULL, NULL, NULL, 'https://ui-avatars.com/api/?name=%E0%B8%84%E0%B8%B8%E0%B8%93%E0%B8%AB%E0%B8%A1%E0%B8%AD%E0%B9%81%E0%B8%81%E0%B9%89%E0%B8%A7%20%E0%B8%88%E0%B8%B4%E0%B8%95%E0%B8%A3%E0%B8%B2%E0%B8%A0%E0%B8%A3%E0%B8%93%E0%B9%8C&background=random&color=fff', '2026-05-12 04:34:37', NULL, NULL, 1),
(6, 'Stu@gmail.com', '$2b$10$VEZHnKp2zLP1TEYaZukux.HnCL9n3hWwoRtl4OrraSRz6Qmv54ORi', 'Student', 'ธนพร แก้วมีสี', NULL, 'Other', NULL, NULL, NULL, NULL, '2026-05-12 04:38:45', NULL, NULL, 1),
(7, 'inthira040248@gmail.com', '$2b$10$ikpptsvP2peJIj67HsHqBuzOIrpTNDaLKesv.eFq6gzvHPSqSInyK', 'Psychologist', 'อินทิรา ไชยโสดา', '084xxxxxxx', 'Male', NULL, NULL, 'null', NULL, '2026-05-13 14:31:28', NULL, NULL, 1),
(27, 'student_m1_a@test.com', '$2b$10$testhash', 'Student', 'นักเรียน ม1 หอ A', '0800000001', 'Other', 'มัธยมศึกษาปีที่ 1', 'หอพัก A', NULL, NULL, '2026-05-21 16:04:03', NULL, NULL, 1),
(28, 'student_m2_a@test.com', '$2b$10$testhash', 'Student', 'นักเรียน ม2 หอ A', '0800000002', 'Other', 'มัธยมศึกษาปีที่ 2', 'หอพัก A', NULL, NULL, '2026-05-21 16:04:03', NULL, NULL, 1),
(29, 'student_m3_b@test.com', '$2b$10$testhash', 'Student', 'นักเรียน ม3 หอ B', '0800000003', 'Other', 'มัธยมศึกษาปีที่ 3', 'หอพัก B', NULL, NULL, '2026-05-21 16:04:03', NULL, NULL, 1),
(30, 'student_m4_b@test.com', '$2b$10$testhash', 'Student', 'นักเรียน ม4 หอ B', '0800000004', 'Other', 'มัธยมศึกษาปีที่ 4', 'หอพัก B', NULL, NULL, '2026-05-21 16:04:03', NULL, NULL, 1),
(31, 'student_m5_c@test.com', '$2b$10$testhash', 'Student', 'นักเรียน ม5 หอ C', '0800000005', 'Other', 'มัธยมศึกษาปีที่ 5', 'หอพัก C', NULL, NULL, '2026-05-21 16:04:03', NULL, NULL, 1),
(32, 'student_m6_c@test.com', '$2b$10$testhash', 'Student', 'นักเรียน ม6 หอ C', '0800000006', 'Other', 'มัธยมศึกษาปีที่ 6', 'หอพัก C', NULL, NULL, '2026-05-21 16:04:03', NULL, NULL, 1),
(33, 'sb6640248128@lru.ac.th', '$2b$10$fHmDqzLsT/H2jLeEvvwEdukweLdIZFNdnP19EVSiSIdRN86Z..WLu', 'Psychologist', 'ทดสอบ', NULL, 'LGBTQ+', NULL, NULL, NULL, 'https://ui-avatars.com/api/?name=%E0%B8%97%E0%B8%94%E0%B8%AA%E0%B8%AD%E0%B8%9A&background=random&color=fff', '2026-05-22 09:36:22', NULL, NULL, 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`appointment_id`),
  ADD KEY `student_user_id` (`student_user_id`),
  ADD KEY `psychologist_user_id` (`psychologist_user_id`),
  ADD KEY `schedule_id` (`schedule_id`);

--
-- Indexes for table `assessments`
--
ALTER TABLE `assessments`
  ADD PRIMARY KEY (`assessment_id`),
  ADD KEY `student_user_id` (`student_user_id`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`messages_id`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `sender_id` (`sender_id`),
  ADD KEY `receiver_id` (`receiver_id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `student_user_id` (`student_user_id`);

--
-- Indexes for table `groupmembers`
--
ALTER TABLE `groupmembers`
  ADD PRIMARY KEY (`group_member_id`),
  ADD KEY `appointment_id` (`appointment_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`schedule_id`),
  ADD KEY `psychologist_user_id` (`psychologist_user_id`);

--
-- Indexes for table `system_news`
--
ALTER TABLE `system_news`
  ADD PRIMARY KEY (`news_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `appointment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `assessments`
--
ALTER TABLE `assessments`
  MODIFY `assessment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `messages_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `feedback_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `groupmembers`
--
ALTER TABLE `groupmembers`
  MODIFY `group_member_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `schedule_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `system_news`
--
ALTER TABLE `system_news`
  MODIFY `news_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`psychologist_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`schedule_id`) ON DELETE SET NULL;

--
-- Constraints for table `assessments`
--
ALTER TABLE `assessments`
  ADD CONSTRAINT `assessments_ibfk_1` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `chat_messages_ibfk_3` FOREIGN KEY (`receiver_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `groupmembers`
--
ALTER TABLE `groupmembers`
  ADD CONSTRAINT `groupmembers_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`appointment_id`) ON DELETE CASCADE,
  ADD CONSTRAINT `groupmembers_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`psychologist_user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

--
-- Constraints for table `system_news`
--
ALTER TABLE `system_news`
  ADD CONSTRAINT `system_news_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
