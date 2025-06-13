BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[empresa_filial] DROP CONSTRAINT [empresa_filial_codigo_empresa_fkey];

-- AlterTable
ALTER TABLE [dbo].[aspnet_Membership] ALTER COLUMN [Password] NVARCHAR(128) NULL;

-- AlterTable
ALTER TABLE [dbo].[empresa] ALTER COLUMN [descricao] VARCHAR(50) NULL;

-- AlterTable
ALTER TABLE [dbo].[empresa_filial] ALTER COLUMN [codigo_empresa] INT NULL;
ALTER TABLE [dbo].[empresa_filial] ALTER COLUMN [RazaoSocial] NVARCHAR(100) NULL;

-- AddForeignKey
ALTER TABLE [dbo].[empresa_filial] ADD CONSTRAINT [empresa_filial_codigo_empresa_fkey] FOREIGN KEY ([codigo_empresa]) REFERENCES [dbo].[empresa]([codigo_empresa]) ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
