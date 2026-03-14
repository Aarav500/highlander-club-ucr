---
description: "Physical AI — ROS2 Jazzy + NVIDIA Isaac Sim digital twin + sim-to-real transfer"
---

# Robotics / Physical AI Workflow

> ROS2 workspace scaffolding, NVIDIA Isaac Sim digital twin, URDF/SDF modeling, sensor fusion, and sim-to-real transfer.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                    Physical AI Stack                           │
├───────────────┬───────────────┬───────────────┬───────────────┤
│  Simulation   │  Perception   │  Planning     │  Control      │
│  Isaac Sim    │  Computer     │  Nav2 / MoveIt│  ROS2 Control │
│  MuJoCo       │  Vision + LiD │  Behavior Tree│  Hardware I/F │
├───────────────┼───────────────┼───────────────┼───────────────┤
│  USD Scenes   │  PointCloud   │  A* / RRT*    │  Joint Ctrl   │
│  PhysX 5      │  YOLO v9      │  SLAM         │  Actuators    │
│  Ray Tracing  │  Depth Est.   │  Path Plan    │  Sensors      │
└───────────────┴───────────────┴───────────────┴───────────────┘
                         │
              ┌──────────┴──────────┐
              │   Sim-to-Real       │
              │   Domain Randomize  │
              │   Transfer Learning │
              └─────────────────────┘
```

---

## Step 1: ROS2 Workspace Setup

```bash
# Create ROS2 Jazzy workspace
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws/src

# Create robot package
ros2 pkg create --build-type ament_cmake \
  --dependencies rclcpp sensor_msgs geometry_msgs nav_msgs \
  --node-name robot_controller \
  my_robot

# Create perception package
ros2 pkg create --build-type ament_python \
  --dependencies rclpy sensor_msgs cv_bridge \
  --node-name perception_node \
  my_robot_perception
```

### Package Structure

```
ros2_ws/
  src/
    my_robot/
      CMakeLists.txt
      package.xml
      src/
        robot_controller.cpp    — Main control loop
      include/
        my_robot/
          robot_controller.hpp
      launch/
        robot.launch.py        — Launch file
      config/
        robot_params.yaml      — ROS2 parameters
      urdf/
        robot.urdf.xacro       — Robot model
      meshes/
        base_link.stl
        arm_link.stl
    my_robot_perception/
      setup.py
      my_robot_perception/
        perception_node.py     — Camera + LiDAR processing
        object_detector.py     — YOLO inference
```

---

## Step 2: URDF/SDF Robot Model

```xml
<!-- urdf/robot.urdf.xacro -->
<?xml version="1.0"?>
<robot xmlns:xacro="http://www.ros.org/wiki/xacro" name="my_robot">

  <!-- Base Link -->
  <link name="base_link">
    <visual>
      <geometry><box size="0.5 0.3 0.1"/></geometry>
      <material name="blue"><color rgba="0.2 0.2 0.8 1.0"/></material>
    </visual>
    <collision><geometry><box size="0.5 0.3 0.1"/></geometry></collision>
    <inertial>
      <mass value="5.0"/>
      <inertia ixx="0.01" iyy="0.01" izz="0.01" ixy="0" ixz="0" iyz="0"/>
    </inertial>
  </link>

  <!-- Camera Sensor -->
  <xacro:include filename="$(find my_robot)/urdf/camera.urdf.xacro"/>
  <xacro:camera_sensor parent="base_link" x="0.2" y="0" z="0.1"/>

  <!-- LiDAR Sensor -->
  <xacro:include filename="$(find my_robot)/urdf/lidar.urdf.xacro"/>
  <xacro:lidar_sensor parent="base_link" x="0" y="0" z="0.15"/>

  <!-- Differential Drive -->
  <xacro:include filename="$(find my_robot)/urdf/wheels.urdf.xacro"/>
  <xacro:wheel_pair parent="base_link" separation="0.3" radius="0.05"/>

</robot>
```

---

## Step 3: NVIDIA Isaac Sim Digital Twin

```python
# Isaac Sim — load robot and create digital twin
from omni.isaac.core import World
from omni.isaac.core.robots import Robot
from omni.isaac.sensor import Camera, LidarRtx

# Create world
world = World(stage_units_in_meters=1.0, physics_dt=1/240, rendering_dt=1/60)

# Import robot from URDF
from omni.isaac.urdf import _urdf
urdf_interface = _urdf.acquire_urdf_interface()
robot_path = urdf_interface.parse_urdf("robot.urdf", import_config)
robot = world.scene.add(Robot(prim_path="/World/MyRobot", name="my_robot"))

# Add sensors
camera = Camera(
    prim_path="/World/MyRobot/camera_link/camera",
    resolution=(640, 480),
    frequency=30,
)
lidar = LidarRtx(prim_path="/World/MyRobot/lidar_link/lidar", frequency=20)

# Domain randomization for sim-to-real
from omni.isaac.core.utils.randomization import Randomizer

randomizer = Randomizer()
randomizer.add_light_randomization(intensity_range=(500, 2000))
randomizer.add_texture_randomization(materials=["floor", "walls"])
randomizer.add_camera_noise(gaussian_std=0.02)
```

---

## Step 4: Perception Pipeline

```python
# ROS2 perception node with YOLOv9 + depth estimation
import rclpy
from rclpy.node import Node
from sensor_msgs.msg import Image, PointCloud2
from cv_bridge import CvBridge
from ultralytics import YOLO

class PerceptionNode(Node):
    def __init__(self):
        super().__init__("perception")
        self.bridge = CvBridge()
        self.model = YOLO("yolov9c.pt")

        self.image_sub = self.create_subscription(
            Image, "/camera/image_raw", self.image_callback, 10
        )
        self.detection_pub = self.create_publisher(
            DetectionArray, "/perception/detections", 10
        )

    def image_callback(self, msg):
        cv_image = self.bridge.imgmsg_to_cv2(msg, "bgr8")
        results = self.model(cv_image)

        detections = DetectionArray()
        for box in results[0].boxes:
            det = Detection()
            det.class_name = self.model.names[int(box.cls)]
            det.confidence = float(box.conf)
            det.bbox = list(box.xyxy[0].cpu().numpy())
            detections.detections.append(det)

        self.detection_pub.publish(detections)
```

---

## Step 5: Navigation & Planning

```python
# Nav2 configuration
# config/nav2_params.yaml
bt_navigator:
  ros__parameters:
    global_frame: map
    robot_base_frame: base_link
    default_bt_xml_filename: "navigate_w_replanning_and_recovery.xml"

controller_server:
  ros__parameters:
    controller_plugins: ["FollowPath"]
    FollowPath:
      plugin: "dwb_core::DWBLocalPlanner"
      max_vel_x: 0.5
      max_vel_theta: 1.0

planner_server:
  ros__parameters:
    planner_plugins: ["GridBased"]
    GridBased:
      plugin: "nav2_navfn_planner/NavfnPlanner"
      tolerance: 0.5
      use_astar: true
```

---

## Step 6: Sim-to-Real Transfer

1. **Domain Randomization** — vary lighting, textures, physics in simulation
2. **Progressive Nets** — transfer learned features from sim to real
3. **System Identification** — calibrate sim dynamics to match real robot
4. **Evaluation Protocol:**

| Metric | Sim Target | Real Target |
|--------|-----------|-------------|
| Navigation success | >95% | >85% |
| Object detection mAP | >0.90 | >0.75 |
| Manipulation success | >90% | >70% |
| Latency (control loop) | <10ms | <20ms |

---

## Config Directory

```
infra/robotics/
  ros2/
    workspace-config.yaml   — ROS2 workspace layout
    launch-templates/       — Launch file templates
  isaac/
    scene-config.yaml       — Isaac Sim scene setup
    randomization.yaml      — Domain randomization params
  models/
    urdf-templates/         — Robot URDF templates
    sdf-templates/          — Gazebo SDF templates
  sim2real/
    transfer-config.yaml    — Sim-to-real pipeline config
    calibration.yaml        — System identification params
```

---

## Commands

```bash
# Scaffold ROS2 workspace
/robotics --ros2 --init --robot mobile_base

# Launch Isaac Sim digital twin
/robotics --isaac-sim --urdf robot.urdf --scene warehouse

# Run perception pipeline
/robotics --perception --model yolov9 --sensors camera,lidar

# Navigation demo
/robotics --nav2 --map warehouse.pgm --goal "2.0 3.0 0.0"

# Sim-to-real evaluation
/robotics --sim2real --evaluate --metrics navigation,detection

# Domain randomization training
/robotics --train --domain-randomization --episodes 10000
```
