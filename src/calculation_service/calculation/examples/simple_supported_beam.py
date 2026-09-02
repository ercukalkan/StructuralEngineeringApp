"""Beam analysis."""

from calculation_service.core.util import *
from calculation_service.core.util.analysis_request import AnalysisRequest
import calculation_service.core.util.opensees_helper as ops_helper
from calculation_service.core.util.unit_convert import Convert_All

def main(request: AnalysisRequest):
    #region Beam properties
    elastic_modulus = 210.0e9
    area = 0.012
    inertia = 8.0e-5
    length = float(request.length)
    distributed_load = float(request.uniform_load)
    elements = int(request.elements)
    point_loads = request.point_loads or []
    supports = request.supports or []
    input_units = request.input_units or ("N", "m")
    #endregion

    #region Unit Conversion
    length, elastic_modulus, area, inertia, distributed_load, point_loads = Convert_All(
        length, elastic_modulus, area, inertia, distributed_load, point_loads, input_units
    )
    #endregion

    #region OpenSees Model Definition
    ops_helper.ops_define_2d_model()
    #endregion

    #region Node Definition
    ops_helper.ops_define_nodes(elements, length)
    #endregion

    #region Support Definition
    support_map = ops_helper.ops_define_supports(supports, elements, length)
    #endregion

    #region Geometric Transformation
    ops_helper.ops_geomTrans_Linear()
    #endregion

    #region Element Definition
    ops_helper.ops_define_element(elements, area, elastic_modulus, inertia)
    #endregion

    #region Time Series and Pattern
    ops_helper.ops_timeSeries_Linear()
    ops_helper.ops_pattern_Plain()
    #endregion

    #region Load Definition
    ops_helper.ops_define_load(elements, distributed_load, length, point_loads)
    #endregion

    #region Analysis Setup
    ops_helper.ops_define_analysis_setup()
    ops_helper.ops_perform_analysis()
    #endregion

    #region Result Arrays Initialization
    #endregion

    #region Element Forces in Local Coordinates (N_i, V_i, M_i, N_j, V_j, M_j)
    x, [axial, shear, moment] = ops_helper.ops_element_forces(length, elements)
    #endregion

    #region Support Reactions
    support_reactions = ops_helper.ops_support_reactions(supports, support_map)
    #endregion

    #region Plot Internal Force Diagrams
    fig = ops_helper.plot_internal_forces(x, [axial, shear, moment])
    #endregion

    #region Save Plot to Data URL
    plot_data_url = ops_helper.save_plot_to_data_url(fig)
    #endregion

    #region Internal Forces At Points Along the Beam
    points = ops_helper.internal_forces_at_points(x, [axial, shear, moment])
    #endregion

    #region Return Result Dictionary
    return {
        "units": {
            "length": "m", 
            "force": "N", 
            "moment": "N m"
            },
        "beam": {
            "length": length, 
            "elements": elements, 
            "distributedLoad": {
                "magnitude": distributed_load,
                "startPosition": 0.0,
                "endPosition": length
            }
            },
        "points": points,
        "supportReactions": support_reactions,
        "plot": {"format": "png", "dataUrl": plot_data_url},
    }
    #endregion


if __name__ == "__main__":
    main()