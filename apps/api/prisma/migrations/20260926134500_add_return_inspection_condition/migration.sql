CREATE TYPE "ReturnCondition" AS ENUM ('SEALED_INTACT', 'DAMAGED_OPENED');
ALTER TABLE "return_items" ADD COLUMN "condition" "ReturnCondition";
