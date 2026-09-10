"""Simply supported beam analysis."""

from calculation_service.core.util.analysis_request import AnalysisRequest
import calculation_service.core.util.opensees_helper as ops_helper
from calculation_service.core.util.unit_convert import Convert_All


DEFAULT_ELASTIC_MODULUS = 210.0e9
DEFAULT_AREA = 0.012
DEFAULT_INERTIA = 8.0e-5
DEFAULT_INPUT_UNITS = ("N", "m")


def _prepare_inputs(request: AnalysisRequest):
    """Normalize request values and convert them to the solver's SI units."""
    length = float(request.length)
    distributed_load = float(request.uniform_load)
    elements = int(request.elements)
    point_loads = [dict(point_load) for point_load in request.point_loads or []]
    supports = request.supports or []
    input_units = request.input_units or DEFAULT_INPUT_UNITS

    converted = Convert_All(
        length,
        DEFAULT_ELASTIC_MODULUS,
        DEFAULT_AREA,
        DEFAULT_INERTIA,
        distributed_load,
        point_loads,
        input_units,
    )
    converted_length, elastic_modulus, area, inertia, load, converted_points = converted
    return (
        converted_length,
        elements,
        supports,
        elastic_modulus,
        area,
        inertia,
        load,
        converted_points,
    )


def _run_analysis(length, elements, supports, elastic_modulus, area, inertia, distributed_load, point_loads):
    ops_helper.ops_setup(
        elements,
        length,
        supports,
        area,
        elastic_modulus,
        inertia,
        distributed_load,
        point_loads,
    )
    x, forces, support_reactions, points, displacements = ops_helper.ops_perform(
        length, elements, supports
    )
    plot_data_url = ops_helper.plot(x, forces)
    return ops_helper.ops_result_dictionary(
        length,
        elements,
        distributed_load,
        points,
        support_reactions,
        plot_data_url,
        displacements,
    )


def main(request: AnalysisRequest):
    """Analyze a beam request and return the API response model as a dictionary."""
    inputs = _prepare_inputs(request)
    return _run_analysis(*inputs)


if __name__ == "__main__":
    main(AnalysisRequest(
        length=8.0,
        elements=20,
        uniform_load=-20e3,
    ))