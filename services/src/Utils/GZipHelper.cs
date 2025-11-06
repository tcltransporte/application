using System.IO.Compression;
using System.Text;

namespace services.Utils
{
    public static class GzipHelper
    {
        public static string DecodeGzipBase64(string base64Gzip)
        {
            if (string.IsNullOrWhiteSpace(base64Gzip))
                return null;

            string clean = base64Gzip
                .Replace("\n", "")
                .Replace("\r", "")
                .Replace(" ", "")
                .Replace("base64:", "")
                .Replace("\\/", "/")
                .Replace("\\", "");

            byte[] gzipData = Convert.FromBase64String(clean);

            using (var compressedStream = new MemoryStream(gzipData))
            using (var gzipStream = new GZipStream(compressedStream, CompressionMode.Decompress))
            using (var resultStream = new MemoryStream())
            {
                gzipStream.CopyTo(resultStream);
                return Encoding.UTF8.GetString(resultStream.ToArray());
            }
        }
    }
}
