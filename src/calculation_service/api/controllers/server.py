"""API layer controller for simply supported beam example."""

from typing import Any

from fastapi import FastAPI
from calculation_service.api.Middlewares.cors_middleware import add_cors_middleware
from calculation_service.core.services.simple_supported_beam import get_simple_supported_beam_result

app = FastAPI()

add_cors_middleware(app)

@app.get("/simple_supported_beam")
def simple_supported_beam_get():
    """Return the result of the simply supported beam calculation."""
    return get_simple_supported_beam_result()


@app.post("/simple_supported_beam")
def simple_supported_beam_post(payload: dict[str, Any] | None = None):
    """Run the beam calculation using values supplied by the UI."""
    payload = payload or {}
    length = float(payload.get("length", 8.0))
    elements = int(payload.get("elements", payload.get("numberOfElements", 20)))
    uniform_load = float(payload.get("uniformLoad", -20e3))
    point_loads = payload.get("pointLoads") or []
    supports = payload.get("supports") or []
    input_units = payload.get("inputUnits") or None
    return get_simple_supported_beam_result(
        length=length,
        elements=elements,
        distributed_load=uniform_load,
        point_loads=point_loads,
        supports=supports,
        input_units=input_units,
    )