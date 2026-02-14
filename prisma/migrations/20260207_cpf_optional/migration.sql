-- AlterTable: Tornar CPF opcional (pode ter apenas CNS)
ALTER TABLE "citizen" ALTER COLUMN "cpf" DROP NOT NULL;
