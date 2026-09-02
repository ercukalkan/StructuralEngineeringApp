import openseespy.opensees as ops
import numpy as np
import matplotlib.pyplot as plt
from io import BytesIO
import base64

def ops_define_2d_model():
    ops.wipe()
    ops.model('basic', '-ndm', 2, '-ndf', 3)

def ops_define_3d_model():
    ops.wipe()
    ops.model('basic', '-ndm', 3, '-ndf', 6)

def ops_define_nodes(number_of_elements, length):
    for node_tag in range(number_of_elements + 1):
            ops.node(node_tag + 1, length * node_tag / number_of_elements, 0.0)

def ops_define_supports(supports, number_of_elements, length):
    if supports:
        for support in supports:
            if not isinstance(support, dict):
                continue
            sup_location = support.get("location", 0.0)
            sup_dofs = support.get("degreesOfFreedom") or {}

            sup_node_tag = int(round(((sup_location / length) * number_of_elements))) + 1
            dofN, dofV, dofM = sup_dofs.values()

            ops.fix(int(round(sup_node_tag)), int(dofN), int(dofV), int(dofM))
    else:
        ops.fix(1, 1, 1, 1)
        ops.fix(number_of_elements + 1, 1, 1 ,1)


def ops_geomTrans_Linear():
    ops.geomTransf("Linear", 1)

def ops_define_element(elements, area, elastic_modulus, inertia):
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

def ops_timeSeries_Linear():
    ops.timeSeries('Linear', 1)

def ops_pattern_Plain():
    ops.pattern('Plain', 1, 1)

def ops_define_load(number_of_elements, distributed_load, length, point_loads=None):
    for element_tag in range(1, number_of_elements + 1):
            ops.eleLoad("-ele", element_tag, "-type", "-beamUniform", distributed_load)

    for point_load in point_loads:
        if not isinstance(point_load, dict):
            continue

        location = float(point_load.get("location", 0.0))
        magnitude = float(point_load.get("magnitude", 0.0))
        x_position = max(0.0, min(location, length))
        node_tag = int(round((x_position / length) * number_of_elements)) + 1 if length > 0 else 1
        node_tag = max(1, min(node_tag, number_of_elements + 1))
        ops.load(node_tag, 0.0, magnitude, 0.0)

def ops_define_analysis_setup():
    ops.system('BandGeneral')
    ops.numberer('RCM')
    ops.constraints('Plain')
    ops.integrator('LoadControl', 1.0)
    ops.algorithm('Linear')
    ops.analysis('Static')

def ops_perform_analysis():
    if ops.analyze(1) != 0:
        raise RuntimeError("OpenSees Analysis failed")
    ops.reactions()

def ops_element_forces(length, number_of_elements):
    x = np.linspace(0, length, number_of_elements + 1) 
    forces = np.zeros((3, number_of_elements + 1))
    for element_tag in range(1, number_of_elements + 1):
        element_forces = ops.eleForce(element_tag)
        if element_tag == 1:
            forces[:, 0] = element_forces[:3]
        forces[:, element_tag] = [-i for i in element_forces[3:6]]
    return x, forces

def ops_support_reactions(supports, length, number_of_elements):
    support_reactions = []
    if supports:
        for support in supports:
            if not isinstance(support, dict):
                continue
            sup_location = support.get("location", 0.0)
            sup_node_tag = int(round(((sup_location / length) * number_of_elements))) + 1
            sup_reactions_N, sup_reactions_V, sup_reactions_M = ops.nodeReaction(sup_node_tag)
            support_reactions.append(
                {
                    "location": round(float(sup_location), 2),
                    "reactions": {
                        "axial": round(float(sup_reactions_N), 2),
                        "shear": round(float(sup_reactions_V), 2),
                        "moment": round(float(sup_reactions_M), 2)
                    }
                }
            )
        return support_reactions
    else:
        return []
        

def ops_plot_internal_forces(x, forces):
    fig, axes = plt.subplots(3, 1, sharex=True, figsize=(10, 8), constrained_layout=True)
    diagrams = (
        (forces[0][:] / 1e3, "Axial force N (kN)", "tab:blue"),
        (forces[1][:] / 1e3, "Shear force V (kN)", "tab:orange"),
        (forces[2][:] / 1e3, "Bending moment M (kN m)", "tab:green"),
    )
    for axis, (values, ylabel, color) in zip(axes, diagrams):
        axis.axhline(0.0, color="black", linewidth=0.8)
        axis.plot(x, values, color=color, linewidth=2)
        axis.fill_between(x, 0.0, values, color=color, alpha=0.2)
        axis.set_ylabel(ylabel)
        axis.grid(True, alpha=0.3)

    axes[-1].set_xlabel("Beam coordinate x (m)")
    fig.suptitle("Simply Supported Beam: Internal Force Diagrams")
    return fig

def ops_save_plot_to_data_url(fig):
    plot_buffer = BytesIO()
    fig.savefig(plot_buffer, format="png", dpi=150)
    plot_data_url = "data:image/png;base64," + base64.b64encode(
        plot_buffer.getvalue()
    ).decode("ascii")
    plt.close(fig)
    return plot_data_url

def ops_internal_forces_at_points(x, forces):
    points = [
        {
            "location": float(position),
            "internalForces": {
                "axial": round(float(axial_value), 2),
                "shear": round(float(shear_value), 2),
                "moment": round(float(moment_value), 2),
            }
        }
        for position, axial_value, shear_value, moment_value in zip(
            x, forces[0][:], forces[1][:], forces[2][:]
        )
    ]
    return points

def ops_result_dictionary(length, number_of_elements, distributed_load, points, support_reactions, plot_data_url):
    return {
        "units": {
            "length": "m", 
            "force": "N", 
            "moment": "N m"
        },
        "beam": {
            "length": length, 
            "elements": number_of_elements, 
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