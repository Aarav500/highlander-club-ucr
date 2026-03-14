---
description: "Physics Simulation — NVIDIA Omniverse + MuJoCo for robotics and RL environments"
---

# Physics Simulation Workflow

> High-fidelity physics simulation with NVIDIA Omniverse (USD, ray tracing) and MuJoCo (fast contact dynamics). For robotics sim-to-real and RL training.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│               Physics Simulation Stack                    │
├──────────────────┬──────────────────┬────────────────────┤
│  NVIDIA Omniverse│  MuJoCo 3.x     │  Integration       │
├──────────────────┼──────────────────┼────────────────────┤
│ USD Composer     │ MJCF Models      │ Gymnasium API      │
│ PhysX 5          │ Contact Dynamics │ Stable Baselines 3 │
│ RTX Ray Tracing  │ Soft Bodies      │ Isaac Gym          │
│ Digital Twins    │ Tendons/Muscles  │ dm_control         │
│ Omni.Replicator  │ MJX (JAX accel) │ Sim-to-Real        │
└──────────────────┴──────────────────┴────────────────────┘
```

---

## Component 1: MuJoCo Environments

### Basic Setup

```python
import mujoco
import mujoco.viewer

# Load model from XML
model = mujoco.MjModel.from_xml_path("models/robot_arm.xml")
data = mujoco.MjData(model)

# Simulation loop
with mujoco.viewer.launch_passive(model, data) as viewer:
    while viewer.is_running():
        # Set control inputs
        data.ctrl[:] = controller.compute(data.qpos, data.qvel)

        # Step simulation
        mujoco.mj_step(model, data)

        # Read sensors
        joint_positions = data.qpos.copy()
        joint_velocities = data.qvel.copy()
        contact_forces = data.cfrc_ext.copy()

        viewer.sync()
```

### MJCF Robot Model

```xml
<!-- models/robot_arm.xml -->
<mujoco model="6dof_arm">
  <option timestep="0.002" gravity="0 0 -9.81"/>

  <worldbody>
    <light diffuse="1 1 1" pos="0 0 3" dir="0 0 -1"/>
    <geom type="plane" size="2 2 0.1" rgba="0.8 0.8 0.8 1"/>

    <!-- Robot Base -->
    <body name="base" pos="0 0 0.1">
      <geom type="cylinder" size="0.1 0.05" rgba="0.3 0.3 0.3 1"/>
      <joint name="base_yaw" type="hinge" axis="0 0 1" range="-180 180"/>

      <!-- Link 1 -->
      <body name="link1" pos="0 0 0.1">
        <geom type="capsule" fromto="0 0 0 0 0 0.3" size="0.04" rgba="0.2 0.6 0.9 1"/>
        <joint name="shoulder" type="hinge" axis="0 1 0" range="-90 90"/>

        <!-- Link 2 -->
        <body name="link2" pos="0 0 0.3">
          <geom type="capsule" fromto="0 0 0 0 0 0.25" size="0.035" rgba="0.2 0.6 0.9 1"/>
          <joint name="elbow" type="hinge" axis="0 1 0" range="-120 120"/>

          <!-- Gripper -->
          <body name="gripper" pos="0 0 0.25">
            <geom type="box" size="0.02 0.06 0.02" pos="0 0.04 0" rgba="0.6 0.6 0.6 1"/>
            <geom type="box" size="0.02 0.06 0.02" pos="0 -0.04 0" rgba="0.6 0.6 0.6 1"/>
            <joint name="grip" type="slide" axis="0 1 0" range="0 0.04"/>
          </body>
        </body>
      </body>
    </body>

    <!-- Target object -->
    <body name="target" pos="0.3 0 0.15">
      <freejoint/>
      <geom type="box" size="0.03 0.03 0.03" rgba="1 0.2 0.2 1" mass="0.1"/>
    </body>
  </worldbody>

  <actuator>
    <motor joint="base_yaw" ctrlrange="-1 1" gear="50"/>
    <motor joint="shoulder" ctrlrange="-1 1" gear="50"/>
    <motor joint="elbow" ctrlrange="-1 1" gear="30"/>
    <motor joint="grip" ctrlrange="0 1" gear="10"/>
  </actuator>
</mujoco>
```

---

## Component 2: Gymnasium RL Integration

```python
import gymnasium as gym
import numpy as np
from stable_baselines3 import SAC

# MuJoCo Gymnasium environment
class RobotArmEnv(gym.Env):
    def __init__(self):
        self.model = mujoco.MjModel.from_xml_path("models/robot_arm.xml")
        self.data = mujoco.MjData(self.model)

        self.action_space = gym.spaces.Box(low=-1, high=1, shape=(4,))
        self.observation_space = gym.spaces.Box(
            low=-np.inf, high=np.inf, shape=(18,)
        )

    def step(self, action):
        self.data.ctrl[:] = action
        mujoco.mj_step(self.model, self.data, nstep=10)

        obs = self._get_obs()
        reward = self._compute_reward()
        terminated = self._check_success()
        truncated = self.step_count >= 1000

        return obs, reward, terminated, truncated, {}

    def _compute_reward(self):
        gripper_pos = self.data.body("gripper").xpos
        target_pos = self.data.body("target").xpos
        distance = np.linalg.norm(gripper_pos - target_pos)
        return -distance + (10.0 if distance < 0.05 else 0.0)

# Train with SAC
env = RobotArmEnv()
model = SAC("MlpPolicy", env, verbose=1, learning_rate=3e-4)
model.learn(total_timesteps=1_000_000)
```

---

## Component 3: NVIDIA Omniverse

```python
# Omniverse — USD scene composition
from pxr import Usd, UsdGeom, UsdPhysics, Gf

# Create USD stage
stage = Usd.Stage.CreateNew("scenes/warehouse.usda")

# Add physics scene
scene = UsdPhysics.Scene.Define(stage, "/PhysicsScene")
scene.CreateGravityDirectionAttr().Set(Gf.Vec3f(0, 0, -1))
scene.CreateGravityMagnitudeAttr().Set(9.81)

# Add ground plane
ground = UsdGeom.Mesh.Define(stage, "/World/Ground")
UsdPhysics.CollisionAPI.Apply(ground.GetPrim())

# Add robot from URDF (via Isaac Sim)
from omni.isaac.urdf import _urdf
robot_prim = _urdf.import_robot("robot.urdf", "/World/Robot")

# Domain randomization with Replicator
import omni.replicator.core as rep

with rep.trigger.on_frame():
    rep.randomizer.light(intensity=rep.distribution.uniform(500, 2000))
    rep.randomizer.rotation(rep.distribution.uniform((-180,), (180,)))

stage.GetRootLayer().Save()
```

---

## Commands

```bash
# Create MuJoCo environment
/physics-sim --mujoco --model robot_arm.xml --render

# Train RL agent
/physics-sim --train --env RobotArmEnv --algo sac --steps 1M

# Omniverse scene setup
/physics-sim --omniverse --scene warehouse --import-urdf robot.urdf

# Benchmark physics performance
/physics-sim --benchmark --model robot_arm.xml --steps 10000

# Domain randomization
/physics-sim --randomize --params lighting,texture,physics

# Export trained policy
/physics-sim --export-policy --format onnx --output policy.onnx
```
