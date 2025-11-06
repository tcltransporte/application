using Microsoft.AspNetCore.Mvc;
//using Microsoft.VisualStudio.TestTools.UnitTesting;
using OpenAC.Net.Core.Extensions;
using OpenAC.Net.DFe.Core;
using OpenAC.Net.DFe.Core.Common;
using OpenAC.Net.NFSe.Nacional;
using OpenAC.Net.NFSe.Nacional.Common.Model;
using OpenAC.Net.NFSe.Nacional.Common.Types;
using services.Utils;
using System.Security.Cryptography.X509Certificates;
//using OpenAC.Net.NFSe.Nacional.Test;

namespace services.Controllers.DFe.NFSe
{
    [ApiController]
    [Route("DFe/[controller]")]
    public class NFSeController : ControllerBase
    {

        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromHeader(Name = "X-Cert-Base64")] string base64, [FromHeader(Name = "X-Cert-Password")] string password, [FromBody] Schemas.DPS dps)
        {
            try
            {

                var certBytes = Convert.FromBase64String(base64);

                var cert = X509CertificateLoader.LoadPkcs12(certBytes, password);

                //Informacoes.Prestador
                if (dps.Informacoes?.TipoAmbiente == null)
                {
                    throw new Exception($"Tipo de ambiente - Campo obrigatório!");
                }

                if (dps.Informacoes?.Prestador?.Regime?.OptanteSimplesNacional == null)
                {
                    throw new Exception($"Optante pelo simples nacional - Campo obrigatório!");
                }

                if (dps.Informacoes?.Prestador?.Regime?.OptanteSimplesNacional == null)
                {
                    throw new Exception($"Regime especial - Campo obrigatório!");
                }

                if (dps.Informacoes?.Prestador?.Regime?.OptanteSimplesNacional == null)
                {
                    throw new Exception($"Regime especial - Campo obrigatório!");
                }

                //Informacoes.Tomador
                if (dps.Informacoes?.Tomador?.Endereco?.Bairro == null)
                {
                    throw new Exception($"Bairro do tomador - Campo obrigatório!");
                }


                var openNFSeNacional = new OpenNFSeNacional();

                openNFSeNacional.Configuracoes.WebServices.Ambiente = (DFeTipoAmbiente)dps.Informacoes?.TipoAmbiente;
                openNFSeNacional.Configuracoes.Arquivos.PathSchemas = Path.Combine(AppContext.BaseDirectory, "Schemas", "NFSe", "1.00");


                var prest = new PrestadorDps
                {
                    CPF = dps.Informacoes?.Prestador?.CPF,
                    CNPJ = dps.Informacoes?.Prestador?.CNPJ,
                    Email = dps.Informacoes?.Prestador?.Email,
                    Regime = new RegimeTributario
                    {
                        RegimeApuracao = dps.Informacoes?.Prestador?.Regime?.RegimeApuracao.ToNullableEnum<RegimeApuracao>(),
                        OptanteSimplesNacional = dps.Informacoes?.Prestador?.Regime?.OptanteSimplesNacional.ToNullableEnum<OptanteSimplesNacional>(),
                        RegimeEspecial = dps.Informacoes?.Prestador?.Regime?.RegimeEspecial.ToNullableEnum<RegimeEspecial>()
                    }
                };

                var toma = new InfoPessoaNFSe
                {
                    CPF = dps.Informacoes?.Tomador?.CPF,
                    CNPJ = dps.Informacoes?.Tomador?.CNPJ,
                    Nome = dps.Informacoes?.Tomador?.Nome,
                    Endereco = new EnderecoNFSe
                    {
                        Bairro = dps.Informacoes?.Tomador?.Endereco?.Bairro,
                        Logradouro = dps.Informacoes?.Tomador.Endereco?.Logradouro,
                        Municipio = new MunicipioNacional
                        {
                            CEP = dps.Informacoes?.Tomador?.Endereco?.Municipio?.CEP,
                            CodMunicipio = dps.Informacoes?.Tomador?.Endereco?.Municipio?.CodMunicipio
                        },
                        Numero = dps.Informacoes?.Tomador?.Endereco?.Numero
                    }
                };

                var serv = new ServicoNFSe
                {
                    Localidade = new LocalidadeNFSe
                    {
                        CodMunicipioPrestacao = dps.Informacoes?.Servico?.Localidade?.CodMunicipioPrestacao
                    },
                    Informacoes = new InformacoesServico
                    {
                        CodTributacaoNacional = dps.Informacoes?.Servico?.Informacoes?.CodTributacaoNacional,
                        Descricao = dps.Informacoes?.Servico?.Informacoes?.Descricao
                    }
                };

                var valores = new ValoresDps
                {
                    ValoresServico = new ValoresServico
                    {
                        Valor = dps.Informacoes?.Valores?.ValoresServico?.Valor
                    },
                    Tributos = new TributosNFSe
                    {
                        Municipal = new TributoMunicipal
                        {
                            ISSQN = dps.Informacoes?.Valores?.Tributos?.Municipal?.ISSQN.ToNullableEnum<TributoISSQN>(),
                            TipoRetencaoISSQN = dps.Informacoes?.Valores?.Tributos?.Municipal?.TipoRetencaoISSQN.ToNullableEnum<TipoRetencaoISSQN>(),
                        },
                        Total = new TotalTributos
                        {
                            PorcentagemTotal = new PorcentagemTotalTributos
                            {
                                TotalEstadual = dps.Informacoes?.Valores?.Tributos?.Total?.PorcentagemTotal?.TotalEstadual,
                                TotalFederal = dps.Informacoes?.Valores?.Tributos?.Total?.PorcentagemTotal?.TotalFederal,
                                TotalMunicipal = dps.Informacoes?.Valores?.Tributos?.Total?.PorcentagemTotal?.TotalMunicipal,
                            }
                        }
                    }
                };

                string numeroIdentificacao = dps.Informacoes?.Prestador?.CPF ?? dps.Informacoes?.Prestador?.CNPJ ?? "";

                // Determina o tipo conforme o tamanho
                string InscricaoFederal = "";

                if (!string.IsNullOrEmpty(dps.Informacoes?.Prestador?.CPF))
                {
                    InscricaoFederal = "1"; // CPF
                }
                else if (!string.IsNullOrEmpty(dps.Informacoes?.Prestador?.CNPJ))
                {
                    InscricaoFederal = "2"; // CNPJ
                }

                string Id = dps.Informacoes?.LocalidadeEmitente?.PadLeft(7, '0') + InscricaoFederal + numeroIdentificacao.PadLeft(14, '0') + dps.Informacoes?.Serie?.PadLeft(5, '0') + dps.Informacoes?.NumeroDps?.ToString().PadLeft(15, '0');

                var Dps = new Dps
                {
                    Versao = dps.Versao,
                    Informacoes = new InfDps
                    {
                        Id = "DPS" + Id,
                        TipoAmbiente = openNFSeNacional.Configuracoes.WebServices.Ambiente,
                        DhEmissao = dps.Informacoes?.DhEmissao,
                        LocalidadeEmitente = dps.Informacoes?.LocalidadeEmitente,
                        Serie = dps.Informacoes?.Serie,
                        NumeroDps = dps.Informacoes?.NumeroDps,
                        Competencia = dps.Informacoes?.Competencia,
                        TipoEmitente = dps.Informacoes?.TipoEmitente.ToNullableEnum<EmitenteDps>(),
                        Prestador = prest,
                        Tomador = toma,
                        Servico = serv,
                        Valores = valores
                    }
                };

                var retorno = await openNFSeNacional.EnviarAsync(cert, Dps);

                if (retorno.Sucesso)
                {
                    return Ok(new {
                        idDps = retorno.Resultado?.IdDps,
                        chNFSe = retorno.Resultado?.ChaveAcesso,
                        tpAmb = retorno.Resultado?.Ambiente,
                        dhProcessamento = retorno.Resultado?.DataHoraProcessamento,
                        xmlAut = retorno.Resultado?.XmlNFSe
                    });
                }
                else
                {
                    throw new Exception(retorno.Resultado?.Erros[0].Descricao);
                }

            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }


        }
    }
}
