# Algorithms & Research

> Reference for implementing novel ML models, quantitative finance engines, cryptographic primitives, and publishable algorithms with formal proofs.

---

## Custom ML: PyTorch / TensorFlow

### Attention Mechanisms (from scratch)

```python
import torch
import torch.nn as nn
import math

class MultiHeadAttention(nn.Module):
    def __init__(self, d_model: int, n_heads: int, dropout: float = 0.1):
        super().__init__()
        assert d_model % n_heads == 0
        self.d_k = d_model // n_heads
        self.n_heads = n_heads
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
        self.dropout = nn.Dropout(dropout)

    def forward(self, query, key, value, mask=None):
        B, T, _ = query.shape
        Q = self.W_q(query).view(B, T, self.n_heads, self.d_k).transpose(1, 2)
        K = self.W_k(key).view(B, -1, self.n_heads, self.d_k).transpose(1, 2)
        V = self.W_v(value).view(B, -1, self.n_heads, self.d_k).transpose(1, 2)

        scores = (Q @ K.transpose(-2, -1)) / math.sqrt(self.d_k)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, float("-inf"))
        attn = self.dropout(torch.softmax(scores, dim=-1))
        out = (attn @ V).transpose(1, 2).contiguous().view(B, T, -1)
        return self.W_o(out)
```

### Diffusion Models

```python
class DiffusionModel(nn.Module):
    """Denoising Diffusion Probabilistic Model (DDPM)."""

    def __init__(self, unet: nn.Module, T: int = 1000):
        super().__init__()
        self.unet = unet
        self.T = T
        betas = torch.linspace(1e-4, 0.02, T)
        alphas = 1.0 - betas
        self.register_buffer("alpha_bar", torch.cumprod(alphas, dim=0))

    def forward_diffusion(self, x0, t, noise=None):
        if noise is None:
            noise = torch.randn_like(x0)
        alpha_bar_t = self.alpha_bar[t].view(-1, 1, 1, 1)
        return torch.sqrt(alpha_bar_t) * x0 + torch.sqrt(1 - alpha_bar_t) * noise

    def loss(self, x0):
        t = torch.randint(0, self.T, (x0.size(0),), device=x0.device)
        noise = torch.randn_like(x0)
        x_t = self.forward_diffusion(x0, t, noise)
        predicted = self.unet(x_t, t)
        return nn.functional.mse_loss(predicted, noise)
```

### Reinforcement Learning

```python
class PPOAgent:
    """Proximal Policy Optimization with clipped surrogate objective."""

    def __init__(self, policy: nn.Module, lr: float = 3e-4, clip_eps: float = 0.2):
        self.policy = policy
        self.optimizer = torch.optim.Adam(policy.parameters(), lr=lr)
        self.clip_eps = clip_eps

    def update(self, states, actions, old_log_probs, advantages, returns):
        log_probs, values, entropy = self.policy.evaluate(states, actions)
        ratio = torch.exp(log_probs - old_log_probs)
        clipped = torch.clamp(ratio, 1 - self.clip_eps, 1 + self.clip_eps)
        policy_loss = -torch.min(ratio * advantages, clipped * advantages).mean()
        value_loss = nn.functional.mse_loss(values, returns)
        loss = policy_loss + 0.5 * value_loss - 0.01 * entropy.mean()
        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
```

---

## Quantitative Finance

### Black-Scholes Variants

```python
import numpy as np
from scipy.stats import norm

def black_scholes(S, K, T, r, sigma, option_type="call"):
    """European option pricing via Black-Scholes."""
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    if option_type == "call":
        return S * norm.cdf(d1) - K * np.exp(-r * T) * norm.cdf(d2)
    return K * np.exp(-r * T) * norm.cdf(-d2) - S * norm.cdf(-d1)
```

### Monte Carlo Simulations

```python
def monte_carlo_option(S, K, T, r, sigma, n_sims=100_000, option_type="call"):
    """Price options via Monte Carlo simulation with antithetic variates."""
    z = np.random.standard_normal(n_sims // 2)
    z = np.concatenate([z, -z])  # antithetic variates
    ST = S * np.exp((r - 0.5 * sigma**2) * T + sigma * np.sqrt(T) * z)
    if option_type == "call":
        payoffs = np.maximum(ST - K, 0)
    else:
        payoffs = np.maximum(K - ST, 0)
    return np.exp(-r * T) * payoffs.mean()
```

### Greeks Engine

| Greek | Formula | Measures |
|-------|---------|----------|
| Delta (Δ) | ∂V/∂S | Price sensitivity |
| Gamma (Γ) | ∂²V/∂S² | Delta acceleration |
| Theta (Θ) | ∂V/∂t | Time decay |
| Vega (ν) | ∂V/∂σ | Volatility sensitivity |
| Rho (ρ) | ∂V/∂r | Interest rate sensitivity |

```python
def greeks(S, K, T, r, sigma):
    d1 = (np.log(S / K) + (r + 0.5 * sigma**2) * T) / (sigma * np.sqrt(T))
    d2 = d1 - sigma * np.sqrt(T)
    return {
        "delta": norm.cdf(d1),
        "gamma": norm.pdf(d1) / (S * sigma * np.sqrt(T)),
        "theta": -(S * norm.pdf(d1) * sigma) / (2 * np.sqrt(T)) - r * K * np.exp(-r * T) * norm.cdf(d2),
        "vega": S * norm.pdf(d1) * np.sqrt(T),
        "rho": K * T * np.exp(-r * T) * norm.cdf(d2),
    }
```

---

## Cryptography & Security

### Custom Encryption Primitives

```python
class ChaCha20:
    """Simplified ChaCha20 stream cipher implementation for educational use."""

    @staticmethod
    def quarter_round(a, b, c, d):
        a = (a + b) & 0xFFFFFFFF; d ^= a; d = ((d << 16) | (d >> 16)) & 0xFFFFFFFF
        c = (c + d) & 0xFFFFFFFF; b ^= c; b = ((b << 12) | (b >> 20)) & 0xFFFFFFFF
        a = (a + b) & 0xFFFFFFFF; d ^= a; d = ((d << 8) | (d >> 24)) & 0xFFFFFFFF
        c = (c + d) & 0xFFFFFFFF; b ^= c; b = ((b << 7) | (b >> 25)) & 0xFFFFFFFF
        return a, b, c, d
```

### Zero-Knowledge Proofs

```python
# Schnorr ZK proof — prove knowledge of discrete log without revealing it
import hashlib, secrets

def prove(g, p, x):
    """Prover: prove knowledge of x such that y = g^x mod p."""
    r = secrets.randbelow(p - 1)
    commitment = pow(g, r, p)
    challenge = int(hashlib.sha256(str(commitment).encode()).hexdigest(), 16) % (p - 1)
    response = (r + challenge * x) % (p - 1)
    return commitment, response

def verify(g, p, y, commitment, response):
    """Verifier: check g^response == commitment * y^challenge mod p."""
    challenge = int(hashlib.sha256(str(commitment).encode()).hexdigest(), 16) % (p - 1)
    lhs = pow(g, response, p)
    rhs = (commitment * pow(y, challenge, p)) % p
    return lhs == rhs
```

---

## Publishable Innovation

### Paper Quality Checklist

1. **Novel contribution** — clearly state what is new vs. prior work.
2. **Formal proofs** — include theorem statements with full proofs (or proof sketches).
3. **Benchmarks** — compare against ≥ 3 strong baselines on standard datasets.
4. **Ablation study** — show which components contribute to performance.
5. **Reproducibility** — provide code, hyperparameters, random seeds, compute budget.
6. **Statistical significance** — report mean ± std over ≥ 3 runs with p-values.

### Common Venues by Area

| Area | Top Venues |
|------|------------|
| ML/AI | NeurIPS, ICML, ICLR, AAAI |
| Systems | OSDI, SOSP, NSDI, EuroSys |
| Security | S&P, CCS, USENIX Security, NDSS |
| Finance | Journal of Finance, RFS, JFE |
