BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[companyUser] DROP CONSTRAINT [companyUser_companyId_fkey];

-- AlterTable
ALTER TABLE [dbo].[companyUser] ALTER COLUMN [companyId] TINYINT NULL;

-- AddForeignKey
ALTER TABLE [dbo].[companyUser] ADD CONSTRAINT [companyUser_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[empresa_filial]([codigo_empresa_filial]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
