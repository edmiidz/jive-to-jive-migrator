-- phpMyAdmin SQL Dump
-- version 4.9.0.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Aug 12, 2019 at 07:31 AM
-- Server version: 10.3.16-MariaDB
-- PHP Version: 7.1.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `jive_jive_migrator`
--
CREATE DATABASE IF NOT EXISTS `jive_jive_migrator` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `jive_jive_migrator`;

-- --------------------------------------------------------

--
-- Table structure for table `migrator_data`
--

DROP TABLE IF EXISTS `migrator_data`;
CREATE TABLE `migrator_data` (
  `id` int(10) NOT NULL,
  `place_id` int(10) NOT NULL,
  `source_contentID` int(10) NOT NULL,
  `dest_contentID` int(10) NOT NULL,
  `timeupdated` timestamp NOT NULL DEFAULT current_timestamp(),
  `extra_field1` int(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


--
-- Indexes for table `migrator_data`
--
ALTER TABLE `migrator_data`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `migrator_data`
--
ALTER TABLE `migrator_data`
  MODIFY `id` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=165;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
