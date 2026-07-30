-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jul 25, 2026 at 01:34 PM
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
-- Database: `next_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `billing`
--

CREATE TABLE `billing` (
  `id` varchar(191) NOT NULL,
  `amount` double NOT NULL,
  `status` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dashboardmetric`
--

CREATE TABLE `dashboardmetric` (
  `id` int(11) NOT NULL,
  `key` varchar(191) NOT NULL,
  `value` varchar(191) NOT NULL,
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `avatar` varchar(191) DEFAULT NULL,
  `role` enum('ADMIN','NURSE','STAFF','PATIENT') NOT NULL DEFAULT 'PATIENT',
  `status` enum('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
  `studentNumber` varchar(191) DEFAULT NULL,
  `employeeNumber` varchar(191) DEFAULT NULL,
  `employmentType` varchar(191) DEFAULT NULL,
  `hireDate` datetime(3) DEFAULT NULL,
  `designations` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`designations`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `password` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `email`, `name`, `avatar`, `role`, `status`, `studentNumber`, `employeeNumber`, `employmentType`, `hireDate`, `designations`, `createdAt`, `updatedAt`, `password`) VALUES
('3604fb1e-5397-49a0-8241-2c9b05ae1f36', 'ronilouvarquez@ckcm.edu.ph', 'ronilou manimbo varquez', NULL, 'ADMIN', 'ACTIVE', NULL, '221221', 'Part Time', NULL, NULL, '2026-03-25 06:41:20.132', '2026-03-25 06:41:20.088', '123456789'),
('6a9f5466-0026-4aa7-b4cd-9741c7a2fefc', 'rona@gmail.com', 'Cherry Ann Consigna', NULL, 'PATIENT', 'ACTIVE', '221221', NULL, NULL, NULL, NULL, '2026-03-25 06:29:57.959', '2026-03-25 06:29:57.956', '12345678'),
('7c88dbe7-af32-4813-87e3-fab882c63cb0', 'precy@gmail.com', 'precy atay bachiller', NULL, 'PATIENT', 'ACTIVE', '221221', NULL, NULL, NULL, NULL, '2026-03-25 06:15:42.313', '2026-03-25 06:15:42.312', '12345678'),
('admin-1', 'admin@example.com', 'Admin User', NULL, 'ADMIN', 'ACTIVE', NULL, NULL, NULL, NULL, NULL, '2026-03-24 13:42:14.000', '2026-03-24 13:42:14.000', '12345678'),
('d4cf412c-0a0e-4d10-bf05-8aa6335cbadf', 'ron@gmail.com', 'ron', NULL, 'PATIENT', 'ACTIVE', NULL, NULL, NULL, NULL, NULL, '2026-03-25 02:47:21.008', '2026-03-25 02:47:20.988', '12345678'),
('d7d008b3-4b41-4331-847e-7d153c998690', 'cherryconsigna@ckcm.edu.ph', 'Cherry Ann Consigna', NULL, 'PATIENT', 'ACTIVE', '221221', NULL, NULL, NULL, NULL, '2026-03-25 05:52:35.584', '2026-03-25 05:52:35.537', '12345678'),
('nurse-1', 'nurse@example.com', 'Nurse User', NULL, 'NURSE', 'ACTIVE', NULL, NULL, NULL, NULL, NULL, '2026-03-24 13:42:14.000', '2026-03-24 13:42:14.000', '12345678'),
('staff-1', 'staff@example.com', 'Staff User', NULL, 'STAFF', 'ACTIVE', NULL, NULL, NULL, NULL, NULL, '2026-03-24 13:42:14.000', '2026-03-24 13:42:14.000', '12345678\r\n');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `billing`
--
ALTER TABLE `billing`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Billing_userId_fkey` (`userId`);

--
-- Indexes for table `dashboardmetric`
--
ALTER TABLE `dashboardmetric`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `DashboardMetric_key_key` (`key`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_email_key` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `dashboardmetric`
--
ALTER TABLE `dashboardmetric`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `billing`
--
ALTER TABLE `billing`
  ADD CONSTRAINT `Billing_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
