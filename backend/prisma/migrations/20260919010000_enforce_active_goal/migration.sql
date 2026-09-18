-- Add an internal slot used to enforce one active goal per habit. MySQL permits
-- multiple NULL values in a unique index, while every ACTIVE goal uses slot 1.
ALTER TABLE `Goal` ADD COLUMN `activeSlot` INTEGER NULL;
UPDATE `Goal` SET `activeSlot` = 1 WHERE `status` = 'ACTIVE';
CREATE UNIQUE INDEX `Goal_habitId_activeSlot_key` ON `Goal`(`habitId`, `activeSlot`);
