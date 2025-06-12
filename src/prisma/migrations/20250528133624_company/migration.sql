/*
  Warnings:

  - A unique constraint covering the columns `[codigo_empresa]` on the table `empresa_filial` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- CreateIndex
ALTER TABLE [dbo].[empresa_filial] ADD CONSTRAINT [empresa_filial_codigo_empresa_key] UNIQUE NONCLUSTERED ([codigo_empresa]);

-- AddForeignKey
ALTER TABLE [dbo].[empresa_filial] ADD CONSTRAINT [empresa_filial_codigo_empresa_fkey] FOREIGN KEY ([codigo_empresa]) REFERENCES [dbo].[empresa]([codigo_empresa]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
