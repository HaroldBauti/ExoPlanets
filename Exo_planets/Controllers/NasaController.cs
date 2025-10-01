using Exo_planets.Utility;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using System.Text;
using Newtonsoft.Json;

namespace Exo_planets.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NasaController : ControllerBase
    {

        private readonly string _webHookUrl;
        public NasaController(IOptions<WebhookSettings> settings)
        {
            _webHookUrl = settings.Value.WebhookUrl;
        }

        [HttpGet]
        [Route("Query")]
        public async Task<IActionResult> Query([FromQuery] string message, [FromQuery] int id)
        {
            var httpClient = new HttpClient();
            var rsp = new Response();
            try
            {
                var query = new Query { message = message, id = id };
                var json = JsonConvert.SerializeObject(query);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                var response = await httpClient.PostAsync(_webHookUrl, content);

                var responseContent = await response.Content.ReadAsStringAsync();
                Console.WriteLine(responseContent);
                if (responseContent.Contains("N/A"))
                {
                    int indexOf = responseContent.IndexOf("N/A");
                    rsp.url = "N/A";
                    rsp.output = "N/A";
                    rsp.Value = responseContent.Substring(indexOf + 4).TrimStart();
                }
                else
                {
                    rsp.url = responseContent.Split(',')[0];
                    rsp.output = responseContent.Split(',')[1];
                    rsp.Value = responseContent.Split(',')[2];
                }

            }
            catch (Exception ex)
            {
                rsp.output = $"Error: {ex.Message}";
            }

            return Ok(rsp);
        }

    }
}
