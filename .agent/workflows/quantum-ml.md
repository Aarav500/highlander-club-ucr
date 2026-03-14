---
description: "Quantum ML — PennyLane + Qiskit 3.0 for variational quantum circuits and hybrid pipelines"
---

# Quantum ML Workflow (V7.0)

> Variational quantum circuits, quantum kernel methods, hybrid classical-quantum pipelines, and portfolio optimization with PennyLane + Qiskit 3.0 + TinyGrad.

---

## V7.0 Upgrades

| Feature | V5.0 | V7.0 |
|---------|------|------|
| Qiskit | 2.0 | 3.0 (GenAI circuits + dynamic) |
| Classical Backend | JAX/Torch | + TinyGrad (ultra-fast local) |
| Error Mitigation | Basic | ZNE + PEC + M3 readout |
| Portfolio | 4-asset QAOA | 20-asset + constraint optimization |
| Hardware | IBM Quantum | + IonQ + Rigetti + simulators |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Quantum ML Stack                        │
├──────────────┬──────────────┬────────────────────────────┤
│  PennyLane   │  Qiskit 2.0  │  Applications              │
├──────────────┼──────────────┼────────────────────────────┤
│ Variational  │ Transpiler   │ Portfolio Optimization     │
│ Quantum Kern.│ Primitives   │ Drug Discovery             │
│ Hybrid Train │ Error Mitig. │ Combinatorial Optimize     │
│ AutoDiff     │ IBM Quantum  │ Quantum Chemistry          │
│ JAX/Torch    │ Simulators   │ Classification             │
└──────────────┴──────────────┴────────────────────────────┘
```

---

## Step 1: PennyLane — Variational Quantum Circuits

```python
import pennylane as qml
from pennylane import numpy as np

# Create quantum device
dev = qml.device("default.qubit", wires=4)

@qml.qnode(dev)
def variational_circuit(params, x):
    """Variational quantum classifier."""
    # Encode classical data
    for i in range(4):
        qml.RX(x[i], wires=i)

    # Variational layers
    for layer in range(3):
        # Entangling layer
        for i in range(3):
            qml.CNOT(wires=[i, i + 1])
        # Rotation layer
        for i in range(4):
            qml.RY(params[layer, i, 0], wires=i)
            qml.RZ(params[layer, i, 1], wires=i)

    return qml.expval(qml.PauliZ(0))

# Train with gradient descent
params = np.random.randn(3, 4, 2, requires_grad=True)
opt = qml.AdamOptimizer(stepsize=0.01)

for step in range(200):
    params, cost = opt.step_and_cost(
        lambda p: cost_function(p, X_train, y_train),
        params,
    )
    if step % 20 == 0:
        print(f"Step {step}: cost = {cost:.4f}")
```

---

## Step 2: Qiskit 2.0 — Quantum Circuits

```python
from qiskit import QuantumCircuit
from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
from qiskit_ibm_runtime import EstimatorV2, SamplerV2, QiskitRuntimeService

# Build circuit
qc = QuantumCircuit(4)
qc.h(0)
qc.cx(0, 1)
qc.cx(1, 2)
qc.cx(2, 3)
qc.ry(0.5, range(4))
qc.measure_all()

# Connect to IBM Quantum
service = QiskitRuntimeService(channel="ibm_quantum")
backend = service.least_busy(simulator=False, min_num_qubits=4)

# Transpile for hardware
pm = generate_preset_pass_manager(backend=backend, optimization_level=3)
transpiled = pm.run(qc)

# Execute with error mitigation
sampler = SamplerV2(mode=backend)
job = sampler.run([transpiled], shots=4096)
result = job.result()
```

---

## Step 3: Quantum Kernel Methods

```python
import pennylane as qml
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score

dev = qml.device("default.qubit", wires=4)

@qml.qnode(dev)
def kernel_circuit(x1, x2):
    """Quantum kernel: compute inner product in Hilbert space."""
    # Encode x1
    qml.templates.AngleEmbedding(x1, wires=range(4))
    qml.templates.StronglyEntanglingLayers(
        weights=np.random.randn(2, 4, 3), wires=range(4)
    )
    # Adjoint of x2 encoding
    qml.adjoint(qml.templates.AngleEmbedding)(x2, wires=range(4))

    return qml.probs(wires=range(4))

def quantum_kernel(x1, x2):
    """Compute quantum kernel entry."""
    probs = kernel_circuit(x1, x2)
    return probs[0]  # Probability of |0000⟩

# Build kernel matrix
K_train = np.array([[quantum_kernel(x1, x2) for x2 in X_train] for x1 in X_train])
K_test = np.array([[quantum_kernel(x1, x2) for x2 in X_train] for x1 in X_test])

# Train SVM with quantum kernel
svm = SVC(kernel="precomputed")
svm.fit(K_train, y_train)
accuracy = accuracy_score(y_test, svm.predict(K_test))
print(f"Quantum kernel SVM accuracy: {accuracy:.3f}")
```

---

## Step 4: Portfolio Optimization (QAOA)

```python
import pennylane as qml
from pennylane import numpy as np

def portfolio_optimization(expected_returns, covariance_matrix, risk_aversion=0.5):
    """Quantum Approximate Optimization for portfolio selection."""
    n_assets = len(expected_returns)
    dev = qml.device("default.qubit", wires=n_assets)

    # Cost Hamiltonian encoding portfolio objective
    cost_h = qml.Hamiltonian(
        coefficients=[],
        observables=[],
    )

    # Build QAOA cost from returns and covariance
    for i in range(n_assets):
        cost_h += -expected_returns[i] * qml.PauliZ(i)
        for j in range(i + 1, n_assets):
            cost_h += risk_aversion * covariance_matrix[i, j] * (
                qml.PauliZ(i) @ qml.PauliZ(j)
            )

    # QAOA circuit
    @qml.qnode(dev)
    def qaoa_circuit(gammas, betas):
        # Initial superposition
        for i in range(n_assets):
            qml.Hadamard(wires=i)

        # QAOA layers
        for layer in range(len(gammas)):
            # Cost unitary
            qml.ApproxTimeEvolution(cost_h, gammas[layer], 1)
            # Mixer unitary
            for i in range(n_assets):
                qml.RX(2 * betas[layer], wires=i)

        return qml.expval(cost_h)

    # Optimize QAOA parameters
    n_layers = 3
    gammas = np.random.uniform(0, 2 * np.pi, n_layers, requires_grad=True)
    betas = np.random.uniform(0, np.pi, n_layers, requires_grad=True)

    opt = qml.AdamOptimizer(stepsize=0.05)
    for step in range(100):
        (gammas, betas), cost = opt.step_and_cost(qaoa_circuit, gammas, betas)

    return gammas, betas, cost

# Example: 4-asset portfolio
returns = np.array([0.12, 0.08, 0.15, 0.10])
cov = np.array([
    [0.04, 0.01, 0.02, 0.005],
    [0.01, 0.03, 0.015, 0.01],
    [0.02, 0.015, 0.06, 0.02],
    [0.005, 0.01, 0.02, 0.035],
])

gammas, betas, optimal_cost = portfolio_optimization(returns, cov)
```

---

## Quantum Error Mitigation (V7.0 NEW)

```python
from qiskit_ibm_runtime import EstimatorV2, Options

# V7.0: Advanced error mitigation
options = Options(
    resilience={
        "measure_mitigation": True,       # M3 readout mitigation
        "zne_mitigation": True,           # Zero-Noise Extrapolation
        "zne": {
            "noise_factors": [1, 3, 5],
            "extrapolator": "exponential",
        },
        "pec": True,                      # Probabilistic Error Cancellation
    },
    execution={"shots": 8192},
)

estimator = EstimatorV2(mode=backend, options=options)
result = estimator.run([(transpiled, observable)]).result()
```

---

## TinyGrad Quantum Backend (V7.0 NEW)

```python
import tinygrad
from tinygrad import Tensor

# Ultra-fast local quantum simulation via TinyGrad
def quantum_sim_tinygrad(params, n_qubits=4):
    """TinyGrad-accelerated quantum circuit simulation."""
    # State vector: 2^n complex amplitudes
    state = Tensor.zeros(2**n_qubits)
    state[0] = 1.0  # |0...0⟩

    # Apply gates as matrix multiplications
    for gate_matrix, target in circuit_gates:
        state = gate_matrix @ state

    return state.realize()
```

---

## Commands

```bash
# Run variational classifier
/quantum-ml --pennylane --task classify --dataset iris --layers 3

# Portfolio optimization with QAOA
/quantum-ml --qaoa --portfolio assets.csv --risk-aversion 0.5 --assets 20

# Quantum kernel SVM
/quantum-ml --kernel-svm --dataset data.csv --wires 4

# Run on IBM Quantum hardware (Qiskit 3.0)
/quantum-ml --qiskit --backend ibm_brisbane --circuit circuit.py

# TinyGrad local simulation (V7.0)
/quantum-ml --tinygrad --simulate --qubits 12

# Error mitigation modes (V7.0)
/quantum-ml --qiskit --backend ibm_brisbane --mitigation zne,pec,m3

# Benchmark quantum vs classical
/quantum-ml --benchmark --task classification --compare svm,qsvm

# Multi-backend comparison (V7.0)
/quantum-ml --benchmark --backends ibm,ionq,rigetti --task qaoa
```
