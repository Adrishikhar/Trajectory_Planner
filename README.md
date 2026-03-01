# 3-DOF Robotic Manipulator | LSPB Trajectory Planner 🤖

A high-fidelity 3D robotic arm simulation built with **Three.js**. This tool calculates smooth motion profiles using **LSPB (Linear Segment with Parabolic Blend)** and solves **Analytical Inverse Kinematics (IK)** in real-time.

🔗 **Live Demo:** [https://adrishikhar.github.io/Trajectory_Planner/](https://adrishikhar.github.io/Trajectory_Planner/)

---

## 🚀 Key Features

- **LSPB Trajectory Generation**: Implements a trapezoidal velocity profile ensuring zero-velocity starts and ends with smooth acceleration/deceleration.
- **Analytical Inverse Kinematics**: Computes Joint 1 (Yaw), Joint 2 (Shoulder Pitch), and Joint 3 (Elbow Pitch) using geometric decomposition and the Law of Cosines.
- **Real-time Visual Feedback**:
  - **Ghost Arm**: A semi-transparent manipulator that previews the target pose based on slider input.
  - **Path Tracing**: A persistent yellow line tracing the precise Cartesian path of the end-effector.
- **Cinematic Camera Controls**:
  - **Auto-Rotate**: The frame rotates at a slow angular velocity on load for a cinematic view.
  - **Interactive Kill-Switch**: Auto-rotation disables instantly upon user click or touch.
  - **Full Orbit**: Zoom, pan, and rotate using **OrbitControls**.
- **Precision UI**:
  - Numerical readouts for every slider for logical value setting.
  - Labeled 3D axes ($X$, $Y$, $Z$) for better spatial orientation.

---

## 🛠️ Technical Specifications

### 1. Kinematic Chain

| Link   | Role     | Length | Axis of Motion |
| :----- | :------- | :----- | :------------- |
| **L1** | Base     | 2.0    | Y-Axis (Yaw)   |
| **L2** | Shoulder | 3.5    | Z-Axis (Pitch) |
| **L3** | Elbow    | 3.0    | Z-Axis (Pitch) |

### 2. Trajectory Math (LSPB)

The trajectory follows the normalized progress variable $s(t)$ over time $t_f$:

$$s(t) = \begin{cases} \frac{1}{2}at^2 & 0 \le t \le t_b \\ v(t - \frac{t_b}{2}) & t_b < t \le t_f - t_b \\ 1 - \frac{1}{2}a(t_f - t)^2 & t_f - t_b < t \le t_f \end{cases}$$

### 3. Inverse Kinematics

The base rotation ($\theta_1$) is solved via:
$$\theta_1 = \operatorname{atan2}(z, x)$$

The remaining 2D planar problem is solved using the Law of Cosines to find $\theta_2$ and $\theta_3$ relative to the projected reach $r = \sqrt{x^2 + z^2}$.

---
