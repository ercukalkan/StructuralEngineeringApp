"""Simply supported beam under a uniform load, analysed with OpenSeesPy."""

import base64
from io import BytesIO

import matplotlib
import numpy as np
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import openseespy.opensees as ops


def main():
    # Beam properties (consistent SI units: m, N, Pa)
    length = 8.0
    elastic_modulus = 210.0e9
    area = 0.012
    inertia = 8.0e-5
    distributed_load = -20.0e3  # downward load, N/m
    elements = 20

    ops.wipe()
    ops.model("basic", "-ndm", 2, "-ndf", 3)

    # Left support is pinned; right support is a vertical roller.
    for node_tag in range(elements + 1):
        ops.node(node_tag + 1, length * node_tag / elements, 0.0)
    ops.fix(1, 1, 1, 0)
    ops.fix(elements + 1, 0, 1, 0)

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
        force = ops.eleForce(element_tag)
        if element_tag == 1:
            axial[0], shear[0], moment[0] = force[:3]
        axial[element_tag] = -force[3]
        shear[element_tag] = -force[4]
        moment[element_tag] = -force[5]

    left_reactions = ops.nodeReaction(1)
    right_reactions = ops.nodeReaction(elements + 1)

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
        "units": {"length": "m", "force": "N", "moment": "N m"},
        "beam": {"length": length, "elements": elements},
        "points": points,
        "supportReactions": {
            "left": {"vertical": round(left_reactions[1], 2), "horizontal": round(left_reactions[0], 2), "moment": round(left_reactions[2], 2)},
            "right": {"vertical": round(right_reactions[1], 2), "horizontal": round(right_reactions[0], 2), "moment": round(right_reactions[2], 2)},
        },
        "plot": {"format": "png", "dataUrl": plot_data_url},
    }


if __name__ == "__main__":
    main()