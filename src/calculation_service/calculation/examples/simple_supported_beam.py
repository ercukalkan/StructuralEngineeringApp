"""Simply supported beam under a uniform load, analysed with OpenSeesPy."""

import base64
from io import BytesIO

import matplotlib
import numpy as np
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import openseespy.opensees as ops

import calculation_service.core.util.unit_convert as unit_convert


def main(
    length=8.0,
    elements=20,
    distributed_load=-20.0e3,
    point_loads=None,
    supports=None,
    input_units=None,
):
    # Beam properties (consistent SI units: m, N, Pa)
    elastic_modulus = 210.0e9
    area = 0.012
    inertia = 8.0e-5
    length = float(length)
    distributed_load = float(distributed_load)
    elements = int(elements)
    point_loads = point_loads or []
    supports = supports or []
    input_units = input_units or ("N", "m")

    elastic_modulus *= force_factor / (length_factor ** 2)
    area *= length_factor ** 2
    inertia *= length_factor ** 4
    force_factor, length_factor = unit_convert.conversion_factor(input_units)
    length *= length_factor
    distributed_load *= force_factor / length_factor
    for point_load in point_loads:
        magnitude = float(point_load.get("magnitude", 0.0))
        point_load["magnitude"] = magnitude * force_factor / length_factor

    ops.wipe()
    ops.model("basic", "-ndm", 2, "-ndf", 3)

    for node_tag in range(elements + 1):
        ops.node(node_tag + 1, length * node_tag / elements, 0.0)

    if supports:
        support_map = {}
        for support in supports:
            if not isinstance(support, dict):
                continue

            location = float(support.get("location", 0.0))
            dofs = support.get("degreesOfFreedom", {}) or {}
            if not isinstance(dofs, dict):
                dofs = {}

            x_position = max(0.0, min(float(location), length))
            node_tag = int(round((x_position / length) * elements)) + 1 if length > 0 else 1
            node_tag = max(1, min(node_tag, elements + 1))

            support_info = support_map.setdefault(
                node_tag,
                {"location": x_position, "fixity": [0, 0, 0]},
            )
            current_fix = support_info["fixity"]
            current_fix[0] = current_fix[0] or int(bool(dofs.get("N", False)))
            current_fix[1] = current_fix[1] or int(bool(dofs.get("V", False)))
            current_fix[2] = current_fix[2] or int(bool(dofs.get("M", False)))

        for node_tag, support_info in support_map.items():
            ops.fix(node_tag, *support_info["fixity"])
    else:
        ops.fix(1, 1, 1, 1)
        ops.fix(elements + 1, 1, 1, 1)

    ops.geomTransf("Linear", 1)
    for element_tag in range(1, elements + 1):
        ops.element(
            "elasticBeamColumn",
            element_tag,
            element_tag,
            element_tag + 1,
            area,
            elastic_modulus,
            inertia,
            1,
        )

    ops.timeSeries("Linear", 1)
    ops.pattern("Plain", 1, 1)
    for element_tag in range(1, elements + 1):
        ops.eleLoad("-ele", element_tag, "-type", "-beamUniform", distributed_load)

    for point_load in point_loads:
        if not isinstance(point_load, dict):
            continue

        location = float(point_load.get("location", 0.0))
        magnitude = float(point_load.get("magnitude", 0.0))
        x_position = max(0.0, min(location, length))
        node_tag = int(round((x_position / length) * elements)) + 1 if length > 0 else 1
        node_tag = max(1, min(node_tag, elements + 1))
        ops.load(node_tag, 0.0, magnitude, 0.0)

    ops.system("BandGeneral")
    ops.numberer("RCM")
    ops.constraints("Plain")
    ops.integrator("LoadControl", 1.0)
    ops.algorithm("Linear")
    ops.analysis("Static")
    if ops.analyze(1) != 0:
        raise RuntimeError("OpenSees analysis failed")
    ops.reactions()

    x = np.linspace(0.0, length, elements + 1)
    axial = np.zeros(elements + 1)
    shear = np.zeros(elements + 1)
    moment = np.zeros(elements + 1)

    # eleForce gives [N_i, V_i, M_i, N_j, V_j, M_j] in local coordinates.
    for element_tag in range(1, elements + 1):
        force = ops.eleForce(element_tag) # *********************************
        if element_tag == 1:
            axial[0], shear[0], moment[0] = force[:3]
        axial[element_tag] = -force[3]
        shear[element_tag] = -force[4]
        moment[element_tag] = -force[5]

    support_reactions = []
    if supports:
        for node_tag, info in support_map.items():
            reactions = ops.nodeReaction(node_tag)
            support_reactions.append(
                {
                    "location": round(float(info["location"]), 2),
                    "reactions": {
                        "horizontal": round(float(reactions[0]), 2),
                        "vertical": round(float(reactions[1]), 2),
                        "moment": round(float(reactions[2]), 2),
                    },
                }
            )
    else:
        left_reactions = ops.nodeReaction(1)
        right_reactions = ops.nodeReaction(elements + 1)
        support_reactions = [
            {
                "location": 0.0,
                "reactions": {
                    "horizontal": round(float(left_reactions[0]), 2),
                    "vertical": round(float(left_reactions[1]), 2),
                    "moment": round(float(left_reactions[2]), 2),
                },
            },
            {
                "location": round(float(length), 2),
                "reactions": {
                    "horizontal": round(float(right_reactions[0]), 2),
                    "vertical": round(float(right_reactions[1]), 2),
                    "moment": round(float(right_reactions[2]), 2),
                },
            },
        ]

    fig, axes = plt.subplots(3, 1, sharex=True, figsize=(10, 8), constrained_layout=True)
    diagrams = (
        (axial / 1e3, "Axial force N (kN)", "tab:blue"),
        (shear / 1e3, "Shear force V (kN)", "tab:orange"),
        (moment / 1e3, "Bending moment M (kN m)", "tab:green"),
    )
    for axis, (values, ylabel, color) in zip(axes, diagrams):
        axis.axhline(0.0, color="black", linewidth=0.8)
        axis.plot(x, values, color=color, linewidth=2)
        axis.fill_between(x, 0.0, values, color=color, alpha=0.2)
        axis.set_ylabel(ylabel)
        axis.grid(True, alpha=0.3)

    axes[-1].set_xlabel("Beam coordinate x (m)")
    fig.suptitle("Simply Supported Beam: Internal Force Diagrams")

    plot_buffer = BytesIO()
    fig.savefig(plot_buffer, format="png", dpi=150)
    plot_data_url = "data:image/png;base64," + base64.b64encode(
        plot_buffer.getvalue()
    ).decode("ascii")
    plt.close(fig)

    points = [
        {
            "x": float(position),
            "axial": round(float(axial_value), 2),
            "shear": round(float(shear_value), 2),
            "moment": round(float(moment_value), 2),
        }
        for position, axial_value, shear_value, moment_value in zip(
            x, axial, shear, moment
        )
    ]

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


if __name__ == "__main__":
    main()