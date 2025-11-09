using System.Security.Cryptography.X509Certificates;
using Microsoft.AspNetCore.Mvc;

namespace Service.Controllers.Pamcard2
{

    public class ExecuteRequest
    {
        public string? Context { get; set; }
        public List<KeyValuePair<string, string>>? Fields { get; set; }
    }

    [ApiController]
    [Route("payment/[controller]")]
    public class PamcardController : ControllerBase
    {

        [HttpPost("execute")]
        public async Task<ActionResult<object>> ExecuteAsync([FromHeader(Name = "X-Cert-Base64")] string base64, [FromHeader(Name = "X-Cert-Password")] string password, [FromBody] ExecuteRequest executeRequest)
        {
            try
            {
                
                var certBytes = Convert.FromBase64String(base64);

                var cert = X509CertificateLoader.LoadPkcs12(certBytes, password);

                var PamcardClient = new PamcardClient();

                await PamcardClient.CallExecuteAsync(cert, executeRequest.Context, executeRequest.Fields);

                return Ok();

            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

    }
}
