-- CreateEnum
CREATE TYPE "SessionMode" AS ENUM ('TEXT', 'VOICE');

-- AlterTable
ALTER TABLE "chat_sessions" ADD COLUMN "mode" "SessionMode" NOT NULL DEFAULT 'TEXT';
