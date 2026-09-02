"""Unit conversion utilities."""

# Conversion factors for force units
force_conversion_factors = {
    "N": 1,
    "kN": 1e3,
    "lb": 4.44822,
    "kip": 4448.22,
    "tonf": 9806.65,
}

# Conversion factors for length units
length_conversion_factors = {
    "m": 1,
    "cm": 1e-2,
    "mm": 1e-3,
    "in": 0.0254,
    "ft": 0.3048,
}

def Conversion_Factors(unitPair):
    input_unit_force, input_unit_length = unitPair
    force_conversion_factor = force_conversion_factors.get(input_unit_force)
    length_conversion_factor = length_conversion_factors.get(input_unit_length)
    
    return force_conversion_factor, length_conversion_factor

def Convert_All(length, elastic_modulus, area, inertia, distributed_load, point_loads, unit_pair):
    force_factor, length_factor = Conversion_Factors(unit_pair)
    if force_factor is None or length_factor is None:
        raise ValueError("Invalid unit pair")
    
    length *= length_factor
    elastic_modulus *= force_factor / (length_factor ** 2)
    area *= length_factor ** 2
    inertia *= length_factor ** 4
    distributed_load *= force_factor / length_factor
    for point_load in point_loads:
        magnitude = float(point_load.get("magnitude", 0.0))
        point_load["magnitude"] = magnitude * force_factor
    
    return length, elastic_modulus, area, inertia, distributed_load, point_loads