using Microsoft.AspNetCore.Mvc;

namespace Exo_planets.Controllers
{
    public class MLController : Controller
    {
        void predecir() {
            //Load sample data
            var sampleData = new MLModelExoplanetas.ModelInput()
            {
                Koi_score = 0.969F,
                Koi_fpflag_nt = 0F,
                Koi_fpflag_ss = 0F,
                Koi_fpflag_co = 0F,
                Koi_fpflag_ec = 0F,
                Koi_period = 54.418385F,
                Koi_impact = 0.586F,
                Koi_duration = 4.507F,
                Koi_depth = 874.8F,
                Koi_prad = 2.83F,
                Koi_teq = 443F,
                Koi_insol = 9.11F,
                Koi_model_snr = 25.8F,
                Koi_steff = 5455F,
                Koi_slogg = 4.467F,
                Koi_srad = 0.927F,
                Ra = 291.93423F,
                Dec = 48.14165F,
                Koi_kepmag = 15.347F,
            };

            //Load model and predict output
            var result = MLModelExoplanetas.Predict(sampleData);
        }

        public IActionResult Index()
        {
            return View();
        }
    }
}
