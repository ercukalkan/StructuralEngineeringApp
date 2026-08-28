"""API layer controller for simply supported beam example."""

from fastapi import FastAPI
from calculation_service.api.Middlewares.cors_middleware import add_cors_middleware
from calculation_service.core.services.simple_supported_beam import get_simple_supported_beam_result
from calculation_service.core.util.analysis_request import AnalysisRequest

app = FastAPI()

add_cors_middleware(app)

@app.post("/simple_supported_beam")
def simple_supported_beam_post(payload: AnalysisRequest | None = None):
    """Run the beam calculation using values supplied by the UI."""
    request = payload or AnalysisRequest(
        length=8.0,
        elements=20,
        uniform_load=-20e3,
    )
    return get_simple_supported_beam_result(request)