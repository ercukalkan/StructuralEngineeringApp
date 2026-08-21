"""Business layer service for simply supported beam example."""

from calculation_service.calculation.examples.simple_supported_beam import main


def get_simple_supported_beam_result():
    """Call the calculation-layer simple_supported_beam and return its value."""
    return main()