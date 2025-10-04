using Exo_planets.Models;
using Microsoft.AspNetCore.Mvc;

namespace Exo_planets.Controllers
{
    public class MLController : Controller
    {
        [HttpPost]
        public IActionResult Predecir(ModeloImput input)
        {
            //Load sample data
            if (ModelState.IsValid)
            {
                var sampleData = new MLModelExoplanetas.ModelInput()
                {
                    Koi_score = input.Koi_score,
                    Koi_fpflag_nt = input.Koi_fpflag_nt,
                    Koi_fpflag_ss = input.Koi_fpflag_ss,
                    Koi_fpflag_co = input.Koi_fpflag_co,
                    Koi_fpflag_ec = input.Koi_fpflag_ec,
                    Koi_period = input.Koi_period,
                    Koi_impact = input.Koi_impact,
                    Koi_duration = input.Koi_duration,
                    Koi_depth = input.Koi_depth,
                    Koi_prad = input.Koi_prad,
                    Koi_teq = input.Koi_teq,
                    Koi_insol = input.Koi_insol,
                    Koi_model_snr = input.Koi_model_snr,
                    Koi_steff = input.Koi_steff,
                    Koi_slogg = input.Koi_slogg,
                    Koi_srad = input.Koi_srad,
                    Ra = input.Ra,
                    Dec = input.Dec,
                    Koi_kepmag = input.Koi_kepmag,
                };

                //Load model and predict output
                var result = MLModelExoplanetas.Predict(sampleData);
                string resultadoPorcentaje="";
                float[] scores = result.Score;
                float confirmedPercent = scores[0] * 100;
                float falsePositivePercent = scores[1] * 100;
                if (confirmedPercent>falsePositivePercent)
                {
                    resultadoPorcentaje=result.PredictedLabel+" " + confirmedPercent.ToString("0.##") + "%";
                }
                else
                {
                    resultadoPorcentaje = result.PredictedLabel + " " + falsePositivePercent.ToString("0.##") + "%";

                }
                //ViewData["PredictedLabel"] = result.PredictedLabel;
                ViewData["PredictedLabel"] = resultadoPorcentaje;
                ViewData["ConfirmedPercent"] = confirmedPercent.ToString("0.##") + "%";
                ViewData["FalsePositivePercent"] = falsePositivePercent.ToString("0.##") + "%";
                return View("Index", input); // Volver a la vista con los datos ingresados
            }

            return View("Index");
        }

        public IActionResult Index()    
        {
            return View();
        }
    }
}
