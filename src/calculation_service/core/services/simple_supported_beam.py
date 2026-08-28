from calculation_service.calculation.examples.simple_supported_beam import main
from calculation_service.core.util.analysis_request import AnalysisRequest


def get_simple_supported_beam_result(request: AnalysisRequest):
    return main(request)