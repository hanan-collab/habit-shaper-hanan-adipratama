ALTER TABLE `Goal`
  ADD COLUMN `userId` CHAR(36) NULL,
  ADD COLUMN `finalProgressDays` INTEGER NULL,
  ADD COLUMN `lastEvaluatedDate` DATE NULL;

UPDATE `Goal` AS g
JOIN `Habit` AS h ON h.`id` = g.`habitId`
SET g.`userId` = h.`userId`;

CREATE TABLE `GoalHabit` (
  `id` CHAR(36) NOT NULL,
  `goalId` CHAR(36) NOT NULL,
  `habitId` CHAR(36) NOT NULL,
  `connectedOn` DATE NOT NULL,
  `disconnectedOn` DATE NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `GoalHabit_goalId_connectedOn_disconnectedOn_idx` (`goalId`, `connectedOn`, `disconnectedOn`),
  INDEX `GoalHabit_habitId_disconnectedOn_idx` (`habitId`, `disconnectedOn`),
  CONSTRAINT `GoalHabit_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `Goal` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `GoalHabit_habitId_fkey` FOREIGN KEY (`habitId`) REFERENCES `Habit` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO `GoalHabit` (`id`, `goalId`, `habitId`, `connectedOn`)
SELECT UUID(), g.`id`, g.`habitId`, h.`startDate`
FROM `Goal` AS g
JOIN `Habit` AS h ON h.`id` = g.`habitId`;

CREATE TABLE `GoalProgressDay` (
  `id` CHAR(36) NOT NULL,
  `goalId` CHAR(36) NOT NULL,
  `date` DATE NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `GoalProgressDay_goalId_date_key` (`goalId`, `date`),
  INDEX `GoalProgressDay_goalId_idx` (`goalId`),
  CONSTRAINT `GoalProgressDay_goalId_fkey` FOREIGN KEY (`goalId`) REFERENCES `Goal` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Preserve the completed-day totals used by legacy single-habit BUILD goals.
INSERT IGNORE INTO `GoalProgressDay` (`id`, `goalId`, `date`)
SELECT UUID(), g.`id`, e.`date`
FROM `Goal` AS g
JOIN `Habit` AS h ON h.`id` = g.`habitId` AND h.`type` = 'BUILD'
JOIN `HabitEvent` AS e ON e.`habitId` = h.`id` AND e.`type` = 'COMPLETED';

UPDATE `Goal` AS g
SET g.`finalProgressDays` = (SELECT COUNT(*) FROM `GoalProgressDay` AS p WHERE p.`goalId` = g.`id`)
WHERE g.`status` <> 'ACTIVE';

ALTER TABLE `Goal` DROP FOREIGN KEY `Goal_habitId_fkey`;
DROP INDEX `Goal_habitId_status_idx` ON `Goal`;
DROP INDEX `Goal_habitId_activeSlot_key` ON `Goal`;
ALTER TABLE `Goal`
  MODIFY `userId` CHAR(36) NOT NULL,
  DROP COLUMN `habitId`,
  DROP COLUMN `activeSlot`,
  ADD INDEX `Goal_userId_status_idx` (`userId`, `status`),
  ADD CONSTRAINT `Goal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
