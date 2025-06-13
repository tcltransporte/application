/*
  Warnings:

  - The primary key for the `empresa_filial` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `codigo_empresa_filial` on the `empresa_filial` table. The data in that column could be lost. The data in that column will be cast from `Int` to `TinyInt`.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[empresa_filial] DROP CONSTRAINT [empresa_filial_pkey];
ALTER TABLE [dbo].[empresa_filial] ALTER COLUMN [codigo_empresa_filial] TINYINT NOT NULL;
ALTER TABLE [dbo].[empresa_filial] ADD CONSTRAINT empresa_filial_pkey PRIMARY KEY CLUSTERED ([codigo_empresa_filial]);

-- CreateTable
CREATE TABLE [dbo].[companyUser] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [companyId] TINYINT NOT NULL,
    [userId] UNIQUEIDENTIFIER,
    [roleId] UNIQUEIDENTIFIER,
    CONSTRAINT [companyUser_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[companyUser] ADD CONSTRAINT [companyUser_companyId_fkey] FOREIGN KEY ([companyId]) REFERENCES [dbo].[empresa_filial]([codigo_empresa_filial]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
