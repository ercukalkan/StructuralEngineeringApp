from pydantic import BaseModel, ConfigDict, Field


class AnalysisRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    length: float
    elements: int
    uniform_load: float = Field(alias="uniformLoad")
    point_loads: list[dict] | None = Field(default=None, alias="pointLoads")
    supports: list[dict] | None = None
    input_units: tuple[str, str] | None = Field(default=None, alias="inputUnits")