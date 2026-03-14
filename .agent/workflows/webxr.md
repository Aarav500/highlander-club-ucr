---
description: "AR/VR v2 — WebXR Layers + Depth API + A-Frame 1.7 + 8th Wall v30 + spatial audio + multi-user XR"
---

# WebXR Workflow (V8.0)

> Immersive AR/VR web experiences with WebXR v2 (Layers, Depth API), A-Frame 1.7, 8th Wall v30 (SLAM v2, LiDAR), spatial audio, multi-user XR, and 3D asset pipeline.

---

## V8.0 Upgrades

| Feature | V7.0 | V8.0 |
|---------|------|------|
| WebXR | Device API | + **WebXR Layers** + **Depth API** |
| A-Frame | 1.6 | **1.7** + **Three.js r170** |
| 8th Wall | Basic | **v30** (SLAM v2, LiDAR, semantic) |
| Tracking | Hand tracking | + **Eye tracking** + **haptic feedback** |
| Surface | Surface detection | + **Mesh detection** + **scene understanding** |
| Audio | None | **Spatial audio** (Web Audio API + HRTF) |
| Multi-user | None | **Multi-user XR sessions** |
| Assets | None | **3D asset pipeline** (glTF + USD) |
| Anchors | None | **AR Cloud anchors** (persistent AR) |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                    WebXR Stack V8.0                                   │
├────────────────┬────────────────┬────────────────┬──────────────────┤
│  WebXR v2      │  A-Frame 1.7   │  8th Wall v30  │  Multi-User      │
│  Layers+Depth  │  + Three.js    │  SLAM v2       │  + Spatial Audio │
├────────────────┼────────────────┼────────────────┼──────────────────┤
│ Compositor     │ ECS framework  │ LiDAR meshing  │ WebRTC sync      │
│ Depth sensing  │ VR components  │ Semantic seg.  │ HRTF audio       │
│ Eye tracking   │ Physics (Cannon│ Image tracking │ Shared anchors   │
│ Haptic API     │ Anim system    │ Face tracking  │ 3D asset pipe    │
└────────────────┴────────────────┴────────────────┴──────────────────┘
```

---

## Step 1: WebXR v2 (Layers + Depth)

```javascript
// WebXR v2 session with layers and depth
async function startXR() {
    const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["local-floor", "depth-sensing", "layers"],
        optionalFeatures: ["hand-tracking", "eye-tracking", "mesh-detection"],
        depthSensing: {
            usagePreference: ["gpu-optimized"],
            dataFormatPreference: ["luminance-alpha"],
        },
    });

    // WebXR Layers — separate render layers for performance
    const baseLayer = new XRWebGLLayer(session, gl);
    const projectionLayer = new XRProjectionLayer(gl, { colorFormat: gl.SRGB8_ALPHA8 });
    session.updateRenderState({ layers: [projectionLayer] });
}
```

---

## Step 2: A-Frame 1.7 + Three.js r170

```html
<a-scene
  webxr="referenceSpaceType: local-floor; requiredFeatures: depth-sensing, layers"
  renderer="colorManagement: true; physicallyCorrectLights: true"
>
  <!-- Spatial audio -->
  <a-entity
    position="0 1.6 -3"
    sound="src: #ambient; autoplay: true; spatial: true; distanceModel: inverse; rolloffFactor: 2"
  ></a-entity>

  <!-- Hand tracking interaction -->
  <a-entity hand-tracking-controls="hand: left; modelStyle: mesh"></a-entity>
  <a-entity hand-tracking-controls="hand: right; modelStyle: mesh"></a-entity>

  <!-- Depth-aware occlusion -->
  <a-entity depth-occlusion="enabled: true"></a-entity>
</a-scene>
```

---

## Step 3: 8th Wall v30 (SLAM v2 + LiDAR)

```javascript
// 8th Wall v30 — advanced AR features
AFRAME.registerComponent("eighth-wall-v30", {
    init() {
        XR8.addCameraPipelineModules([
            XR8.SlamModule.pipelineModule({
                enableLidar: true,           // V8.0: LiDAR meshing
                enableSemanticSegmentation: true, // V8.0: semantic understanding
            }),
            XR8.MeshModule.pipelineModule(), // V8.0: real-time mesh
        ]);
    },
});
```

---

## Step 4: Multi-User XR (V8.0 NEW)

```javascript
class MultiUserXR {
    async joinSession(roomId) {
        this.peer = new WebRTCConnection(roomId);
        this.peer.onPeerUpdate((peerId, transform) => {
            this.updateAvatar(peerId, transform);
        });
    }

    broadcastTransform(headPose, handPoses) {
        this.peer.send({ head: headPose, hands: handPoses });
    }
}
```

---

## Commands

```bash
# Create AR experience (V8.0)
/webxr --init --type ar --framework aframe --features depth,hands,spatial-audio

# Create VR experience
/webxr --init --type vr --framework aframe --features layers,eye-tracking

# Enable 8th Wall v30 (V8.0)
/webxr --8thwall --features slam-v2,lidar,semantic

# Multi-user XR session (V8.0)
/webxr --multi-user --room my-room --max-users 10

# 3D asset pipeline (V8.0)
/webxr --assets --import model.glb --optimize --output web-ready.glb

# Spatial audio setup (V8.0)
/webxr --spatial-audio --hrtf --source ambient.ogg

# AR cloud anchors (V8.0)
/webxr --anchors --persist --cloud-provider azure-spatial-anchors
```
