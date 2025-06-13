BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[empresa] (
    [codigo_empresa] INT NOT NULL IDENTITY(1,1),
    [descricao] VARCHAR(50) NOT NULL,
    CONSTRAINT [empresa_pkey] PRIMARY KEY CLUSTERED ([codigo_empresa])
);

-- CreateTable
CREATE TABLE [dbo].[empresa_filial] (
    [codigo_empresa_filial] INT NOT NULL,
    [codigo_empresa] INT NOT NULL,
    [RazaoSocial] NVARCHAR(100) NOT NULL,
    [nome_fantasia] NVARCHAR(100),
    CONSTRAINT [empresa_filial_pkey] PRIMARY KEY CLUSTERED ([codigo_empresa_filial])
);

-- CreateTable
CREATE TABLE [dbo].[aspnet_Users] (
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [UserName] NVARCHAR(256),
    CONSTRAINT [aspnet_Users_pkey] PRIMARY KEY CLUSTERED ([UserId])
);

-- CreateTable
CREATE TABLE [dbo].[aspnet_Membership] (
    [UserId] UNIQUEIDENTIFIER NOT NULL,
    [Email] NVARCHAR(256),
    [Password] NVARCHAR(128) NOT NULL,
    CONSTRAINT [aspnet_Membership_pkey] PRIMARY KEY CLUSTERED ([UserId])
);

-- AddForeignKey
ALTER TABLE [dbo].[aspnet_Membership] ADD CONSTRAINT [aspnet_Membership_UserId_fkey] FOREIGN KEY ([UserId]) REFERENCES [dbo].[aspnet_Users]([UserId]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
