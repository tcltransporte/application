public static class EnumExtensions
{
    public static TEnum? ToNullableEnum<TEnum>(this int? value)
        where TEnum : struct, Enum
    {
        if (value.HasValue)
        {
            var intValue = value.Value;

            // Verifica se existe no enum
            if (Enum.IsDefined(typeof(TEnum), intValue))
                return (TEnum)(object)intValue;
        }

        return null;
    }
}
