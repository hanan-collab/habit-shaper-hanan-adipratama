ALTER TABLE `User`
  ADD COLUMN `onboardingCompleted` BOOLEAN NOT NULL DEFAULT false;

UPDATE `User`
SET `onboardingCompleted` = (`onboardingCompletedAt` IS NOT NULL);

ALTER TABLE `User`
  DROP COLUMN `onboardingCompletedAt`;
