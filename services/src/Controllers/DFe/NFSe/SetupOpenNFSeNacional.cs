/*
using OpenAC.Net.NFSe.Nacional;

namespace services.Controllers.DFe.NFSe;

public class SetupOpenNFSeNacional
{
    #region Propriedades 
    public static string CodMun = "";
    public static int TipoInscricaoFederal = 0; //2 CNPJ; 1 CPF;
    public static string InscricaoFederal = "";

    //Emissão
    public static string NumDPS = "";
    public static string SerieDPS = "";

    //Evento
    public static string NumEvento = "";
    #endregion

    public static void Configuracao(OpenNFSeNacional openNFSeNacional)
    {
        //openNFSeNacional.Configuracoes.Certificados.CertificadoBytes = File.ReadAllBytes("C:\\develop\\Certificados\\04058687000177.pfx");
        //openNFSeNacional.Configuracoes.Certificados.Senha = "tcl@04058687";
        //openNFSeNacional.Configuracoes.Geral.Salvar = true;
        openNFSeNacional.Configuracoes.Geral.RetirarAcentos = true;
        openNFSeNacional.Configuracoes.Geral.RetirarEspacos = true;
        //openNFSeNacional.Configuracoes.Arquivos.PathSalvar =
        //    "C:\\develop\\OpenAC.Net.NFSe.Nacional-main\\src\\OpenAC.Net.NFSe.Nacional.Test\\XML";
        openNFSeNacional.Configuracoes.Arquivos.PathSchemas = Path.Combine(AppContext.BaseDirectory, "Schemas\\NFSe\\1.00");
    }
}
*/