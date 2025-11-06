using Microsoft.AspNetCore.Mvc;

namespace services.Utils
{
    public class Certificate
    {
        [FromHeader(Name = "certificate-password")]
        public string password { get; set; }

        [FromHeader(Name = "certificate-base64")]
        public string base64 { get; set; }
    }
}
