namespace services.Controllers.DFe.NFSe.Schemas
{
    public class DPS
    {
        public string? Versao { get; set; }
        public Informacoes? Informacoes { get; set; }
    }

    public class Informacoes
    {
        public int? TipoAmbiente { get; set; }
        public DateTime? DhEmissao { get; set; }
        public string? VersaoAplicacao { get; set; }
        public string? Serie { get; set; }
        public int? NumeroDps { get; set; }
        public DateTime? Competencia { get; set; }
        public int? TipoEmitente { get; set; }
        public string? LocalidadeEmitente { get; set; }
        public string? Substituida { get; set; }
        public Prestador? Prestador { get; set; }
        public Tomador? Tomador { get; set; }
        public object? Intermediario { get; set; }
        public Servico? Servico { get; set; }
        public Valores? Valores { get; set; }
    }

    public class Prestador
    {
        public Regime? Regime { get; set; }
        public string? CNPJ { get; set; }
        public string? CPF { get; set; }
        public string? Nif { get; set; }
        public string? CodigoNaoNif { get; set; }
        public string? NumeroCAEPF { get; set; }
        public string? InscricaoMunicipal { get; set; }
        public string? Nome { get; set; }
        public string? Endereco { get; set; }
        public string? Telefone { get; set; }
        public string? Email { get; set; }
    }

    public class Regime
    {
        public int? OptanteSimplesNacional { get; set; }
        public int? RegimeApuracao { get; set; }
        public int? RegimeEspecial { get; set; }
    }

    public class Tomador
    {
        public string? CNPJ { get; set; }
        public string? CPF { get; set; }
        public string? Nif { get; set; }
        public string? CodigoNaoNif { get; set; }
        public string? NumeroCAEPF { get; set; }
        public string? InscricaoMunicipal { get; set; }
        public string? Nome { get; set; }
        public Endereco? Endereco { get; set; }
        public string? Telefone { get; set; }
        public string? Email { get; set; }
    }

    public class Endereco
    {
        public Municipio? Municipio { get; set; }
        public string? Logradouro { get; set; }
        public string? Numero { get; set; }
        public string? Complemento { get; set; }
        public string? Bairro { get; set; }
    }

    public class Municipio
    {
        public string? CEP { get; set; }
        public string? CodMunicipio { get; set; }
    }

    public class Servico
    {
        public Localidade? Localidade { get; set; }
        public InformacoesServico? Informacoes { get; set; }
        public object? ServicoExterior { get; set; }
        public object? InformacoesLocacao { get; set; }
        public object? Obra { get; set; }
        public object? Evento { get; set; }
        public object? ExploracaoRodoviaria { get; set; }
        public object? InformacoesComplementares { get; set; }
    }

    public class Localidade
    {
        public string? CodMunicipioPrestacao { get; set; }
        public string? CodPaisPrestacao { get; set; }
    }

    public class InformacoesServico
    {
        public string? CodTributacaoNacional { get; set; }
        public string? CodTributacaoMunicipio { get; set; }
        public string? Descricao { get; set; }
        public string? CodNBS { get; set; }
        public string? CodInterno { get; set; }
    }

    public class Valores
    {
        public ValoresServico? ValoresServico { get; set; }
        public object? ValoresDesconto { get; set; }
        public object? ValoresDeducaoReducao { get; set; }
        public Tributos? Tributos { get; set; }
    }

    public class ValoresServico
    {
        public decimal? ValorRecebido { get; set; }
        public decimal? Valor { get; set; }
    }

    public class Tributos
    {
        public Municipal? Municipal { get; set; }
        public object? Federal { get; set; }
        public Total? Total { get; set; }
    }

    public class Municipal
    {
        public int? ISSQN { get; set; }
        public string? CodPais { get; set; }
        public string? Beneficio { get; set; }
        public string? Suspensao { get; set; }
        public string? TipoImunidade { get; set; }
        public decimal? Aliquota { get; set; }
        public int? TipoRetencaoISSQN { get; set; }
    }

    public class Total
    {
        public decimal? ValorTotal { get; set; }
        public PorcentagemTotal? PorcentagemTotal { get; set; }
        public decimal? IndicadorTotal { get; set; }
        public decimal? PercetualSimples { get; set; }
    }

    public class PorcentagemTotal
    {
        public decimal? TotalFederal { get; set; }
        public decimal? TotalEstadual { get; set; }
        public decimal? TotalMunicipal { get; set; }
    }


}
