"""Beam analysis."""

from calculation_service.core.util import *
from calculation_service.core.util.analysis_request import AnalysisRequest
import calculation_service.core.util.opensees_helper as ops_helper
from calculation_service.core.util.unit_convert import Convert_All

def main(request: AnalysisRequest):
    elastic_modulus = 210.0e9
    area = 0.012
    inertia = 8.0e-5
    length = float(request.length)
    distributed_load = float(request.uniform_load)
    elements = int(request.elements)
    point_loads = request.point_loads or []
    supports = request.supports or []
    input_units = request.input_units or ("N", "m")

    length, elastic_modulus, area, inertia, distributed_load, point_loads = Convert_All(
        length, elastic_modulus, area, inertia, distributed_load, point_loads, input_units
    )

    ops_helper.ops_setup(elements, length, supports, area, elastic_modulus, inertia, distributed_load, point_loads)

    x, [axial, shear, moment], support_reactions, points = ops_helper.ops_perform(length, elements, supports)

    plot_data_url = ops_helper.plot(x, [axial, shear, moment])

    return ops_helper.ops_result_dictionary(length, elements, distributed_load, points, support_reactions, plot_data_url)

if __name__ == "__main__":
    main()