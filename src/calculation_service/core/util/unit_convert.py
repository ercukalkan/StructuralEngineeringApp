# Conversion factors for force units
force_conversion_factors = {
    "N": 1,
    "kN": 1e3,
}

# Conversion factors for length units
length_conversion_factors = {
    "m": 1,
    "cm": 1e2,
    "mm": 1e3,
}

def conversion_factor(input_unit_force, input_unit_length):
    force_conversion = force_conversion_factors.get(input_unit_force)
    length_conversion = length_conversion_factors.get(input_unit_length)

    return force_conversion, length_conversion

def value_convert(value, conversion_factor):
    return value * conversion_factor