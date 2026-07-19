-- DropIndex
DROP INDEX "users_facebook_id_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "facebook_id";
