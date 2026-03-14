---
description: "World Models — Sora v2 video generation + Genie 2 interactive environments"
---

# World Models Workflow

> Video world model training and deployment: Sora v2 for physics-aware video prediction, Genie 2 for interactive action-conditioned simulation.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    World Models Stack                         │
├──────────────────┬──────────────────┬────────────────────────┤
│  Video Generation │  Interactive Env │  Foundation Models    │
│  (Sora v2)       │  (Genie 2)       │  (Video DiT)          │
├──────────────────┼──────────────────┼────────────────────────┤
│  Text→Video      │  Action→Frame    │  Diffusion Transformer│
│  Image→Video     │  Game-like Ctrl  │  Spatial-Temporal Attn│
│  Video→Video     │  Physics-Aware   │  Latent Video VAE     │
│  Physics Sim     │  Reward Signals  │  Causal Masking       │
└──────────────────┴──────────────────┴────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │   Applications      │
              │  • RL Environments  │
              │  • Robotics Sim     │
              │  • Game Prototyping │
              │  • Video Prediction │
              └─────────────────────┘
```

---

## Component 1: Sora v2 — Video Generation

### Text-to-Video Generation

```python
# Sora v2 API — text-to-video
import openai

client = openai.OpenAI()

response = client.videos.create(
    model="sora-v2",
    prompt="A drone flying through a futuristic city at sunset, "
           "weaving between glass skyscrapers with reflections, "
           "cinematic camera movement, 4K quality",
    duration=10,          # seconds
    resolution="1920x1080",
    fps=30,
    style="cinematic",
    physics_mode="realistic",  # v2: physics-aware generation
)

video_url = response.data[0].url
```

### Image-to-Video (Animation)

```python
# Animate a still image
response = client.videos.create(
    model="sora-v2",
    image=open("robot_scene.png", "rb"),
    prompt="The robot arm picks up the red cube and places it on the shelf, "
           "smooth and precise mechanical movement",
    duration=5,
    physics_mode="realistic",
    camera_motion="static",
)
```

### Video-to-Video (Style Transfer & Extension)

```python
# Extend or restyle existing video
response = client.videos.create(
    model="sora-v2",
    video=open("prototype.mp4", "rb"),
    prompt="Continue the scene: the character walks through the door "
           "into a brightly lit laboratory",
    extend_by=5,  # add 5 seconds
    maintain_consistency=True,
)
```

---

## Component 2: Genie 2 — Interactive Environments

### Action-Conditioned Frame Generation

```python
# Genie 2 — interactive world model
from genie2 import WorldModel, ActionSpace

# Initialize world model
world = WorldModel(
    checkpoint="genie-2-large",
    resolution=(512, 512),
    action_space=ActionSpace.CONTINUOUS_2D,  # or DISCRETE_4DIR, CONTINUOUS_6DOF
)

# Generate initial frame from prompt
initial_frame = world.generate_initial(
    prompt="A top-down view of a maze with a small robot at the entrance"
)

# Interactive loop — generate frames conditioned on actions
state = world.reset(initial_frame)

for step in range(1000):
    action = agent.select_action(state)  # RL agent or human input
    next_state, reward, done = world.step(action)

    if done:
        break
    state = next_state
```

### Environment Generation from Description

```python
# Generate custom RL environment
env_config = {
    "description": "A warehouse with shelving units, a mobile robot, "
                   "and packages to sort. Top-down view.",
    "physics": {
        "gravity": True,
        "collision": True,
        "friction": 0.3,
    },
    "action_space": "continuous_2d",
    "observation_space": "rgb_512x512",
    "reward": {
        "package_delivered": +10,
        "collision": -1,
        "time_step": -0.01,
    },
    "max_steps": 500,
}

env = world.create_environment(env_config)

# Compatible with Gymnasium API
obs, info = env.reset()
for _ in range(500):
    action = env.action_space.sample()
    obs, reward, terminated, truncated, info = env.step(action)
```

---

## Component 3: Video Diffusion Transformer (DiT) Training

For custom world models trained on domain-specific data:

```python
# Custom video world model training
from world_models import VideoDiT, VideoDataset, TrainingConfig

config = TrainingConfig(
    model_size="base",           # base | large | xl
    resolution=(256, 256),
    num_frames=16,
    frame_rate=8,
    latent_channels=4,
    patch_size=(2, 4, 4),        # (time, height, width)
    hidden_size=768,
    num_heads=12,
    num_layers=24,
    learning_rate=1e-4,
    batch_size=8,
    gradient_checkpointing=True,
    mixed_precision="bf16",
)

# Dataset
dataset = VideoDataset(
    video_dir="data/training_videos/",
    caption_file="data/captions.json",
    num_frames=config.num_frames,
    resolution=config.resolution,
)

# Train
model = VideoDiT(config)
model.train(dataset, num_epochs=100, save_every=10)
```

---

## Applications

### 1. RL Environment Generation

```python
# Use Genie 2 as a training environment for RL
from stable_baselines3 import PPO

# Genie 2 environment wraps Gymnasium API
env = world.create_environment({
    "description": "Robotic arm sorting colored blocks",
    "action_space": "continuous_6dof",
})

model = PPO("CnnPolicy", env, verbose=1)
model.learn(total_timesteps=100_000)
```

### 2. Robotics Simulation

```python
# Generate diverse training scenarios for robot navigation
scenarios = world.generate_scenarios(
    base_prompt="Indoor office environment with obstacles",
    variations=100,
    physics_mode="realistic",
    randomize=["lighting", "furniture_placement", "floor_texture"],
)
```

### 3. Game Prototyping

```python
# Rapid game prototype from description
game = world.create_game(
    description="2D platformer with a knight character, "
                "medieval castle setting, enemies and collectibles",
    controls="wasd",
    style="pixel_art",
)
game.run_interactive()  # Opens playable prototype
```

### 4. Video Prediction for Planning

```python
# Predict future frames for robot trajectory planning
current_observation = camera.capture()
candidate_actions = planner.generate_candidates(n=10)

# Simulate each action trajectory
trajectories = []
for action_seq in candidate_actions:
    predicted_frames = world.predict(
        initial_frame=current_observation,
        actions=action_seq,
        num_steps=20,
    )
    safety_score = safety_checker.evaluate(predicted_frames)
    trajectories.append((action_seq, predicted_frames, safety_score))

# Select safest trajectory
best = max(trajectories, key=lambda t: t[2])
robot.execute(best[0])
```

---

## Config Directory

```
infra/world-models/
  sora/
    api-config.yaml          — Sora v2 API settings
    generation-presets.yaml  — Common video generation presets
  genie/
    model-config.yaml        — Genie 2 model settings
    env-templates/           — Pre-built environment templates
  training/
    dit-config.yaml          — Video DiT training hyperparams
    dataset-config.yaml      — Training data pipeline
  evaluation/
    fvd-config.yaml          — Fréchet Video Distance metrics
    physics-eval.yaml        — Physics accuracy benchmarks
```

---

## Commands

```bash
# Generate video from text
/world-models --sora-v2 --prompt "robot arm assembling circuit board" --duration 10

# Create interactive environment
/world-models --genie --env "warehouse sorting robot" --interactive

# Train custom world model
/world-models --train --dataset data/videos/ --config dit-config.yaml

# Generate RL environment
/world-models --genie --rl-env --description "maze navigation" --action-space discrete

# Video prediction for planning
/world-models --predict --input current_frame.png --actions trajectory.json

# Benchmark world model
/world-models --evaluate --metrics fvd,physics_accuracy,action_consistency
```
