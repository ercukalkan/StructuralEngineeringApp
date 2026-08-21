"""API layer controller for simply supported beam example."""

from fastapi import FastAPI
from calculation_service.api.Middlewares.cors_middleware import add_cors_middleware
from calculation_service.core.services.simple_supported_beam import get_simple_supported_beam_result

app = FastAPI()

add_cors_middleware(app)

@app.get("/simple_supported_beam")
def simple_supported_beam():
    """Return the result of the simply supported beam calculation."""
    return {"result": get_simple_supported_beam_result()}