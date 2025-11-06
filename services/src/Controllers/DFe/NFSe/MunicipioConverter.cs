
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using OpenAC.Net.DFe.Core.Attributes;
using OpenAC.Net.DFe.Core.Serializer;
using OpenAC.Net.NFSe.Nacional.Common.Model;
using System;

/// <summary>
/// Representa um município no padrão nacional.
/// </summary>
public sealed class TomadorMunicipio : IMunicipio
{
    #region Properties

    /// <summary>
    /// Código do município (cMun).
    /// </summary>
    [DFeElement(TipoCampo.StrNumber, "CodMunicipio", Min = 0, Max = 7, Ocorrencia = Ocorrencia.Obrigatoria)]
    public string CodMunicipio { get; set; } = string.Empty;

    /// <summary>
    /// Código de Endereçamento Postal (CEP).
    /// </summary>
    [DFeElement(TipoCampo.Str, "CEP", Min = 8, Max = 8, Ocorrencia = Ocorrencia.Obrigatoria)]
    public string CEP { get; set; } = string.Empty;

    #endregion Properties
}

public class MunicipioConverter : JsonConverter
{
    public override bool CanConvert(Type objectType)
    {
        return objectType == typeof(IMunicipio);
    }

    public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
    {
        var jo = JObject.Load(reader);
        var obj = new TomadorMunicipio(); // classe concreta
        serializer.Populate(jo.CreateReader(), obj);
        return obj;
    }

    public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
    {
        serializer.Serialize(writer, value);
    }
}