using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;

namespace services.Controllers.DFe.NFSe
{
    [ApiController]
    [Route("certificate/[controller]")]
    public class InfoController : ControllerBase
    {

        [HttpPost]
        public IActionResult Info([FromHeader(Name = "X-Cert-Base64")] string base64, [FromHeader(Name = "X-Cert-Password")] string password)
        {
            try
            {

                if (string.IsNullOrWhiteSpace(base64))
                {
                    throw new Exception("Certificado digital não foi informado!");
                }

                base64 = base64.Replace("\n", "").Replace("\r", "");

                byte[] pfxBytes = Convert.FromBase64String(base64);

                var cert = X509CertificateLoader.LoadPkcs12(pfxBytes, password);

                return Ok(new
                {
                    subject = cert.Subject,
                    issuer = cert.Issuer,
                    validFrom = cert.NotBefore.ToString("yyyy-MM-dd HH:mm:ss"),
                    validUntil = cert.NotAfter.ToString("yyyy-MM-dd HH:mm:ss"),
                    expired = DateTime.Now > cert.NotAfter,
                    serialNumber = cert.SerialNumber,
                    thumbprint = cert.Thumbprint,
                });

            }
            catch (CryptographicException)
            {
                return BadRequest(new { message = "Senha do certificado inválida ou PFX corrompido!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

    }

}