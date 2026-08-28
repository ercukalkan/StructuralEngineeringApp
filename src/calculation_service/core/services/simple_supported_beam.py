"""Business layer service for simply supported beam example."""

from calculation_service.calculation.examples.simple_supported_beam import main


def get_simple_supported_beam_result(
    length=8.0,
    elements=20,
    distributed_load=-20.0e3,
    point_loads=None,
    supports=None,
):
    """Call the calculation-layer simple_supported_beam and return its value."""
    return main(
        length=length,
        elements=elements,
        distributed_load=distributed_load,
        point_loads=point_loads,
        supports=supports,
    )