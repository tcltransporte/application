// ***********************************************************************
// Assembly         : OpenAC.Net.NFSe.Nacional
// Author           : RFTD
// Created          : 09-09-2023
//
// Last Modified By : RFTD
// Last Modified On : 09-09-2023
// ***********************************************************************
// <copyright file="NFSeWebservice.cs" company="OpenAC .Net">
//		        		   The MIT License (MIT)
//	     		    Copyright (c) 2014-2023 Grupo OpenAC.Net
//
//	 Permission is hereby granted, free of charge, to any person obtaining
// a copy of this software and associated documentation files (the "Software"),
// to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense,
// and/or sell copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following conditions:
//	 The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//	 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
// IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
// ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
// DEALINGS IN THE SOFTWARE.
// </copyright>
// <summary></summary>
// ***********************************************************************

using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Security.Authentication;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Schema;
using OpenAC.Net.Core.Logging;
using OpenAC.Net.DFe.Core;
using OpenAC.Net.DFe.Core.Common;
using OpenAC.Net.NFSe.Nacional.Common;
using OpenAC.Net.NFSe.Nacional.Common.Model;
using OpenAC.Net.NFSe.Nacional.Common.Types;

namespace OpenAC.Net.NFSe.Nacional.Webservice;

/// <summary>
/// Classe responsável pela comunicação com o webservice da NFSe Nacional.
/// </summary>
public sealed class NFSeWebservice : IOpenLog
{
    #region Internal Types

    /// <summary>
    /// Tipos de arquivos manipulados pelo webservice.
    /// </summary>
    private enum TipoArquivo
    {
        /// <summary>
        /// Arquivo de comunicação com o webservice.
        /// </summary>
        Webservice,
        /// <summary>
        /// Arquivo de RPS (Recibo Provisório de Serviços).
        /// </summary>
        Rps,
        /// <summary>
        /// Arquivo de NFS-e (Nota Fiscal de Serviço eletrônica).
        /// </summary>
        NFSe
    }
    
    #endregion Internal Types
    
    #region Fields

    /// <summary>
    /// Configuração utilizada pelo webservice.
    /// </summary>
    private readonly ConfiguracaoNFSe configuracao;

    #endregion Fields

    #region Constructors

    /// <summary>
    /// Inicializa uma nova instância da classe <see cref="NFSeWebservice"/>.
    /// </summary>
    /// <param name="configuracaoNFSe">Configuração da NFSe.</param>
    public NFSeWebservice(ConfiguracaoNFSe configuracaoNFSe)
    {
        configuracao = configuracaoNFSe;
    }

    #endregion Constructors

    #region Methods

    #region DANFSe

    /// <summary>
    /// Retorna o DANFSe de uma NFS-e a partir de sua chave de acesso.
    /// </summary>
    /// <param name="chave">Chave de acesso da NFS-e.</param>
    /// <returns>Array de bytes contendo o DANFSe.</returns>
    public async Task<byte[]> DownloadDANFSeAsync(X509Certificate2 cert, string chave)
    {
        this.Log().Debug($"Webservice: [DANFSe][Envio] - {chave}");
        
        var url = NFSeServiceManager.Instance[DFeTipoEmissao.Normal][configuracao.WebServices.Ambiente, DFeSiglaUF.AN][TipoServico.Sefin];
        var httpResponse = await SendAsync(cert, null, HttpMethod.Get, $"{url}/danfse/{chave}");
        
        this.Log().Debug($"Webservice: [DANFSe][Resposta] - {httpResponse.StatusCode}");
        
        httpResponse.EnsureSuccessStatusCode();
        return await httpResponse.Content.ReadAsByteArrayAsync();
    }

    #endregion DANFSe

    #region DFe

    /// <summary>
    /// Distribui os DF-e para contribuintes relacionados à NFS-e.
    /// </summary>
    /// <param name="nsu">Número NSU.</param>
    /// <returns>Resposta da consulta contendo os DF-e.</returns>
    public async Task<NFSeResponse<RespostaConsultaDFe>> ConsultaNsuAsync(X509Certificate2 cert, int nsu)
    {
        this.Log().Debug($"Webservice: [ConsultaNsu][Envio] - {nsu}");
        
        var url = NFSeServiceManager.Instance[DFeTipoEmissao.Normal][configuracao.WebServices.Ambiente, DFeSiglaUF.AN][TipoServico.Adn];
        var httpResponse = await SendAsync(cert, null, HttpMethod.Get, $"{url}/DFe/{nsu}");
        
        var strResponse = await httpResponse.Content.ReadAsStringAsync();
        
        this.Log().Debug($"Webservice: [ConsultaNsu][Resposta] - {strResponse}");
        
        GravarArquivoEmDisco(strResponse, $"ConsultaNsu-{nsu:000000}-resp.json", "");

        return new NFSeResponse<RespostaConsultaDFe>("", "", strResponse, httpResponse.IsSuccessStatusCode);
    }
    
    /// <summary>
    /// Distribui os DF-e vinculados à chave de acesso informada.
    /// </summary>
    /// <param name="chave">Chave de acesso da NFS-e.</param>
    /// <returns>Resposta da consulta contendo os DF-e.</returns>
    public async Task<NFSeResponse<RespostaConsultaDFe>> ConsultaChaveAsync(X509Certificate2 cert, string chave)
    {
        this.Log().Debug($"Webservice: [ConsultaChave][Envio] - {chave}");
        
        var url = NFSeServiceManager.Instance[DFeTipoEmissao.Normal][configuracao.WebServices.Ambiente, DFeSiglaUF.AN][TipoServico.Adn];
        var httpResponse = await SendAsync(cert, null, HttpMethod.Get, $"{url}/NFSe/{chave}/Eventos");
        
        var strResponse = await httpResponse.Content.ReadAsStringAsync();
        
        this.Log().Debug($"Webservice: [ConsultaChave][Resposta] - {strResponse}");
        
        GravarArquivoEmDisco(strResponse, $"ConsultaChave-{chave}-resp.json", "");

        return new NFSeResponse<RespostaConsultaDFe>("", "", strResponse, httpResponse.IsSuccessStatusCode);
    }

    #endregion DFe
    
    #region DPS

    /// <summary>
    /// Retorna a chave de acesso da NFS-e a partir do identificador do DPS.
    /// </summary>
    /// <param name="id">Identificação do DPS.</param>
    /// <returns>Resposta da consulta contendo a chave de acesso.</returns>
    public async Task<NFSeResponse<RespostaConsultaChaveDps>> ConsultaChaveDpsAsync(X509Certificate2 cert, string id)
    {
        this.Log().Debug($"Webservice: [ConsultaChaveDps][Envio] - {id}");
        
        var url = NFSeServiceManager.Instance[DFeTipoEmissao.Normal][configuracao.WebServices.Ambiente, DFeSiglaUF.AN][TipoServico.Sefin];
        var httpResponse = await SendAsync(cert, null, HttpMethod.Get, $"{url}/dps/{id}");
        
        var strResponse = await httpResponse.Content.ReadAsStringAsync();
        
        this.Log().Debug($"Webservice: [ConsultaChaveDps][Resposta] - {strResponse}");
        
        GravarArquivoEmDisco(strResponse, $"ConsultaChaveDps-{id}-resp.json", "");

        return new NFSeResponse<RespostaConsultaChaveDps>("", "", strResponse, httpResponse.IsSuccessStatusCode);
    }
    
    /// <summary>
    /// Verifica se uma NFS-e foi emitida a partir do Id do DPS.
    /// </summary>
    /// <param name="id">Identificação do DPS.</param>
    /// <returns>True se existir, caso contrário false.</returns>
    public async Task<bool> ConsultaExisteDpsAsync(X509Certificate2 cert, string id)
    {
        this.Log().Debug($"Webservice: [ConsultaExisteDps][Envio] - {id}");
        
        var url = NFSeServiceManager.Instance[DFeTipoEmissao.Normal][configuracao.WebServices.Ambiente, DFeSiglaUF.AN][TipoServico.Sefin];
        var httpResponse = await SendAsync(cert, null, HttpMethod.Head, $"{url}/dps/{id}");
        
        var strResponse = await httpResponse.Content.ReadAsStringAsync();
        
        this.Log().Debug($"Webservice: [ConsultaExisteDps][Resposta] - {strResponse}");
        
        GravarArquivoEmDisco(strResponse, $"ConsultaChaveDps-{id}-resp.json", "");

        return httpResponse.StatusCode == HttpStatusCode.OK;
    }
    
    #endregion DPS
    
    #region Eventos

    /// <summary>
    /// Recepciona o Pedido de Registro de Evento e gera Eventos de NFS-e, crédito, débito e apuração.
    /// </summary>
    /// <param name="evento">Evento a ser enviado.</param>
    /// <returns>Resposta do envio do evento.</returns>
    public async Task<NFSeResponse<RespostaEnvioEvento>> EnviarEventoAsync(X509Certificate2 cert, PedidoRegistroEvento evento)
    {
        evento.Assinar(cert, configuracao);
        
        ValidarSchema(SchemaNFSe.Evento, evento.Xml);
        
        var documento = evento.Informacoes.CPFAutor ?? evento.Informacoes.CNPJAutor;
        
        GravarDpsEmDisco(evento.Xml, $"{evento.Informacoes.NumeroPedido:000000}_evento.xml", 
            documento, evento.Informacoes.DhEvento.DateTime);
        
        var envio = new EventoEnvio()
        {
            XmlEvento = evento.Xml
        };
        
        var content = JsonContent.Create(envio);
        var strEnvio = await content.ReadAsStringAsync();
        
        this.Log().Debug($"Webservice: [Evento][Envio] - {strEnvio}");
        
        GravarArquivoEmDisco(strEnvio, $"Evento-{evento.Informacoes.NumeroPedido:000000}-env.json", documento);
        
        var url = NFSeServiceManager.Instance[DFeTipoEmissao.Normal][configuracao.WebServices.Ambiente, DFeSiglaUF.AN][TipoServico.Sefin];
        var httpResponse = await SendAsync(cert, content, HttpMethod.Post, $"{url}/nfse/{evento.Informacoes.ChNFSe}/eventos");
        
        var strResponse = await httpResponse.Content.ReadAsStringAsync();
        
        this.Log().Debug($"Webservice: [Evento][Resposta] - {strResponse}");
        
        GravarArquivoEmDisco(strResponse, $"Evento-{evento.Informacoes.NumeroPedido:000000}-resp.json", documento);

        return new NFSeResponse<RespostaEnvioEvento>(evento.Xml, strEnvio, strResponse, httpResponse.IsSuccessStatusCode);
    }

    #endregion Eventos

    #region NFS-e

    /// <summary>
    /// Recepciona a DPS e gera a NFS-e de forma síncrona.
    /// </summary>
    /// <param name="dps">DPS a ser enviada.</param>
    /// <returns>Resposta do envio da DPS.</returns>
    public async Task<NFSeResponse<RespostaEnvioDps>> EnviarAsync(X509Certificate2 cert, Dps dps)
    {
        dps.Assinar(cert, configuracao);
        
        ValidarSchema(SchemaNFSe.DPS, dps.Xml);
        
        var documento = dps.Informacoes.Prestador.CPF ?? dps.Informacoes.Prestador.CNPJ;
        
        GravarDpsEmDisco(dps.Xml, $"{dps.Informacoes.NumeroDps:000000}_dps.xml", 
            documento, dps.Informacoes.DhEmissao?.DateTime);

        var envio = new DpsEnvio
        {
            XmlDps = dps.Xml
        };

        var content = JsonContent.Create(envio);
        var strEnvio = await content.ReadAsStringAsync();
        
        this.Log().Debug($"Webservice: [Enviar][Envio] - {strEnvio}");
        
        GravarArquivoEmDisco(strEnvio, $"Enviar-{dps.Informacoes.NumeroDps:000000}-env.json", documento);
        
        var url = NFSeServiceManager.Instance[DFeTipoEmissao.Normal][configuracao.WebServices.Ambiente, DFeSiglaUF.AN][TipoServico.Sefin];
        var httpResponse = await SendAsync(cert, content, HttpMethod.Post, $"{url}/nfse");
        
        var strResponse = await httpResponse.Content.ReadAsStringAsync();
        
        this.Log().Debug($"Webservice: [Enviar][Resposta] - {strResponse}");
        
        GravarArquivoEmDisco(strResponse, $"Enviar-{dps.Informacoes.NumeroDps:000000}-resp.json", documento);

        return new NFSeResponse<RespostaEnvioDps>(dps.Xml, strEnvio, strResponse, httpResponse.IsSuccessStatusCode);

    }

    #endregion NFS-e

    #region Commom

    /// <summary>
    /// Envia uma requisição HTTP para o webservice.
    /// </summary>
    /// <param name="content">Conteúdo da requisição.</param>
    /// <param name="method">Método HTTP.</param>
    /// <param name="url">URL do serviço.</param>
    /// <returns>Resposta HTTP.</returns>
    private async Task<HttpResponseMessage> SendAsync(X509Certificate2 cert, HttpContent? content, HttpMethod method, string url)
    {
        var handler = new HttpClientHandler();

        //var certBytes = Convert.FromBase64String("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");
        //var password = "tcl@04058687";

        //var certificate = new X509Certificate2(certBytes, password, X509KeyStorageFlags.MachineKeySet | X509KeyStorageFlags.PersistKeySet | X509KeyStorageFlags.Exportable);

        handler.SslProtocols = (SslProtocols)configuracao.WebServices.Protocolos;
        handler.ClientCertificates.Add(cert);
        handler.ServerCertificateCustomValidationCallback = HttpClientHandler.DangerousAcceptAnyServerCertificateValidator;

        var client = new HttpClient(handler);

        var request = new HttpRequestMessage(method, url);

        var assemblyName = GetType().Assembly.GetName();
        var productValue = new ProductInfoHeaderValue("OpenAC.Net.NFSe.Nacional", assemblyName!.Version!.ToString());
        var commentValue = new ProductInfoHeaderValue("(+https://github.com/OpenAC-Net/OpenAC.Net.NFSe.Nacional)");

        request.Headers.UserAgent.Add(productValue);
        request.Headers.UserAgent.Add(commentValue);
        request.Content = content;
        

        //Só funciona no Windows executando o Visual Studio como administrador
        return await client.SendAsync(request);

    }
    
    /// <summary>
    /// Valida o XML de acordo com o schema.
    /// </summary>
    /// <param name="schema">O schema que será usado na verificação.</param>
    /// <param name="xml">Conteúdo XML a ser validado.</param>
    /// <exception cref="XmlSchemaException">Lançada se o arquivo de schema não for encontrado.</exception>
    /// <exception cref="XmlSchemaValidationException">Lançada se houver erros de validação.</exception>
    private void ValidarSchema(SchemaNFSe schema, string xml)
    {
        var schemaFile = configuracao.Arquivos.GetSchema(schema);
        if (!File.Exists(schemaFile))
            throw new XmlSchemaException("Nao encontrou o arquivo schema do xml => " + schemaFile);
            
        if (XmlSchemaValidation.ValidarXml(xml, schemaFile, out var errosSchema, out _)) return;

        throw new XmlSchemaValidationException("Erros gerado ao validar o schema do xml" + Environment.NewLine + 
                                               string.Join(Environment.NewLine, errosSchema));

    }

    /// <summary>
    /// Grava o xml da Dps no disco.
    /// </summary>
    /// <param name="conteudoArquivo">Conteúdo do arquivo.</param>
    /// <param name="nomeArquivo">Nome do arquivo.</param>
    /// <param name="documento">Documento do prestador.</param>
    /// <param name="data">Data de emissão.</param>
    private void GravarDpsEmDisco(string conteudoArquivo, string nomeArquivo, string? documento, DateTime? data)
    {
        if (configuracao.Arquivos.Salvar == false) return;

        GravarArquivoEmDisco(TipoArquivo.Rps, conteudoArquivo, nomeArquivo, documento, data);
    }

    /// <summary>
    /// Grava o xml da NFSe no disco.
    /// </summary>
    /// <param name="conteudoArquivo">Conteúdo do arquivo.</param>
    /// <param name="nomeArquivo">Nome do arquivo.</param>
    /// <param name="documento">Documento do prestador.</param>
    /// <param name="data">Data de emissão.</param>
    private void GravarNFSeEmDisco(string conteudoArquivo, string nomeArquivo, string? documento, DateTime? data)
    {
        if (configuracao.Arquivos.Salvar == false) return;

        GravarArquivoEmDisco(TipoArquivo.NFSe, conteudoArquivo, nomeArquivo, documento, data);
    }

    /// <summary>
    /// Grava o xml de comunicação com o webservice no disco.
    /// </summary>
    /// <param name="conteudoArquivo">Conteúdo do arquivo.</param>
    /// <param name="nomeArquivo">Nome do arquivo.</param>
    /// <param name="documento">Documento do prestador.</param>
    private void GravarArquivoEmDisco(string conteudoArquivo, string nomeArquivo, string? documento)
    {
        if (configuracao.Geral.Salvar == false) return;

        GravarArquivoEmDisco(TipoArquivo.Webservice, conteudoArquivo, nomeArquivo, documento);
    }
    
    /// <summary>
    /// Grava o arquivo no disco conforme o tipo especificado.
    /// </summary>
    /// <param name="tipo">Tipo do arquivo.</param>
    /// <param name="conteudoArquivo">Conteúdo do arquivo.</param>
    /// <param name="nomeArquivo">Nome do arquivo.</param>
    /// <param name="documento">Documento do prestador.</param>
    /// <param name="data">Data de emissão (opcional).</param>
    private void GravarArquivoEmDisco(TipoArquivo tipo, string conteudoArquivo, string nomeArquivo, string? documento, DateTime? data = null)
    {
        nomeArquivo = tipo switch
        {
            TipoArquivo.Webservice => Path.Combine(configuracao.Arquivos.GetPathEnvio(data ?? DateTime.Today, documento ?? string.Empty), nomeArquivo),
            TipoArquivo.Rps => Path.Combine(configuracao.Arquivos.GetPathDps(data ?? DateTime.Today, documento ?? string.Empty), nomeArquivo),
            TipoArquivo.NFSe => Path.Combine(configuracao.Arquivos.GetPathNFSe(data ?? DateTime.Today, documento ?? string.Empty), nomeArquivo),
            _ => throw new ArgumentOutOfRangeException(nameof(tipo), tipo, null)
        };

        File.WriteAllText(nomeArquivo, conteudoArquivo, Encoding.UTF8);
    }


    #endregion Commom

    #endregion Methods

}