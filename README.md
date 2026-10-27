# PacketPulse Intelligence — Live Network Loss Estimation & Probabilistic Anomaly Detection

> **Academic Micro-Project**: *Packet Loss Estimation in Data Networks Using Binomial Distribution*  
> **Course / Discipline**: Probability and Statistics for Data Science and Cyber Security Engineers  
> **Core Motto**: *Measure Reality • Model Probability • Understand Reliability*  
> **Primary Principle**: **REAL DATA FIRST** — Zero synthetic fabrication of live metrics, timestamps, locations, probe IDs, or prediction results.

---

## Table of Contents
1. [A. Project Overview](#a-project-overview)
2. [B. Real-World Dataset Documentation (RIPE Atlas & Local)](#b-real-world-dataset-documentation)
3. [C. End-to-End Data Pipeline](#c-end-to-end-data-pipeline)
4. [D. Mathematical & Statistical Foundations](#d-mathematical--statistical-foundations)
5. [E. Novelty & Innovation (PacketPulse Intelligence Engine)](#e-novelty--innovation)
6. [F. Installation & Execution Guide (macOS)](#f-installation--execution-guide-macos)
7. [G. Project Structure](#g-project-structure)
8. [H. API Reference & Schemas](#h-api-reference--schemas)
9. [I. Testing & Verification Suite](#i-testing--verification-suite)
10. [J. Limitations & Future Scope](#j-limitations--future-scope)
11. [K. References](#k-references)

---

## A. Project Overview

### 1. Problem Statement
In modern computer networks, packet loss occurs when data packets traversing intermediate transmission links and router buffers fail to reach their intended destination. While network engineers routinely observe aggregate loss metrics, classical deterministic models fail to capture the stochastic variability inherent in packet arrivals and queuing drops. 

This project tackles the fundamental question: **How can discrete probability theory—specifically the Binomial distribution—be rigorously applied to estimate, model, and detect probabilistic anomalies in live network packet loss using genuine Internet telemetry?**

### 2. Core Vision & Five Guiding Questions
PacketPulse Intelligence addresses five critical operational questions:
1. **What is happening to network connectivity right now?** (Real-time latency and packet reception across global Internet probes)
2. **How many packet losses are actually being observed?** (Empirical maximum-likelihood loss probability $\hat{p} = K_{\text{lost}} / N_{\text{sent}}$)
3. **What does the binomial distribution predict for a future batch of packets?** (Discrete PMF, cumulative risk $P(X \le x)$, and tail probability $P(X \ge x)$ under current conditions)
4. **Are the observed loss patterns consistent with the model's assumptions?** (Hypothesis testing: Wald-Wolfowitz runs test for trial independence, Chi-Square goodness-of-fit across probe batches, and Wilson score confidence intervals)
5. **What do the measurements mean for network reliability?** (Explainable, deterministic network-health diagnostics grounded strictly in computed metrics)

### 3. Core Architectural Highlights
- **True Multi-Source Architecture**:
  - **Primary**: Official **RIPE Atlas** REST API (global distributed Internet probes measuring Anycast DNS root servers and public resolvers).
  - **Secondary**: Bounded **Local Network Diagnostics** (real ICMP echo probes and socket latency probes from the host machine with strict input sanitization).
  - **Historical**: Local **SQLite** database via SQLAlchemy retaining original epoch timestamps and probe observations.
- **Separation of Modes**: Measured mode (calculating probabilities from verified telemetry) is strictly isolated and visually demarcated from Manual Scenario mode (educational what-if exploration).
- **Real-Time Live Auto-Update Engine**:
  - Continuous automatic telemetry polling with dynamic intervals (`5s Live`, `10s Fast`, `30s`, `60s`).
  - Visual animated countdown timer beacon (`Live (Xs)`) with immediate 1-click pause/resume toggle.
  - Manual forced refresh bypass (`force_refresh=true`) with millisecond cache-busting tokens.
- **Direct Navigation & URL Hash Routing**:
  - Full HTML5 and hash-based navigation across all 6 views (`#overview`, `#explorer`, `#probability`, `#fingerprint`, `#validation`, `#provenance`).
  - Synchronized browser history (`popstate`, `hashchange`) allowing direct bookmarks, external linking, and back/forward browser navigation without state loss or page reload.
- **Instant Datasets Directory & Data Integrity Banner**:
  - Global navbar **"Datasets"** button opening an interactive glassmorphic modal with verified links to web portals and raw JSON feeds.
  - Persistent **Data Integrity Banner** highlighting telemetry source, timestamp, probe count, and direct links to active RIPE Atlas datasets.

---

## B. Real-World Dataset Documentation

### 1. Primary External Source: RIPE Atlas
- **Official Organization**: RIPE Network Coordination Centre (RIPE NCC)
- **Official Portal**: [https://atlas.ripe.net/](https://atlas.ripe.net/)
- **API Documentation**: [https://atlas.ripe.net/docs/apis/rest-api-manual/](https://atlas.ripe.net/docs/apis/rest-api-manual/)
- **API Reference**: [https://atlas.readthedocs.io/](https://atlas.readthedocs.io/)
- **RIPE NCC Homepage**: [https://www.ripe.net/](https://www.ripe.net/)

#### Curated Live Global Datasets Used in the Application:
| Target Name | Target Host | Measurement ID | Official Web Portal Dataset | Live Raw JSON Feed |
| :--- | :--- | :--- | :--- | :--- |
| **DNS Root Server K** | `k.root-servers.net` | `MSM #1001` | [atlas.ripe.net/measurements/1001/](https://atlas.ripe.net/measurements/1001/) | [Raw JSON Feed](https://atlas.ripe.net/api/v2/measurements/1001/latest/?format=json) |
| **Google Public DNS** | `8.8.8.8` | `MSM #1999544` | [atlas.ripe.net/measurements/1999544/](https://atlas.ripe.net/measurements/1999544/) | [Raw JSON Feed](https://atlas.ripe.net/api/v2/measurements/1999544/latest/?format=json) |
| **Cloudflare Public DNS** | `1.1.1.1` | `MSM #11908848` | [atlas.ripe.net/measurements/11908848/](https://atlas.ripe.net/measurements/11908848/) | [Raw JSON Feed](https://atlas.ripe.net/api/v2/measurements/11908848/latest/?format=json) |
| **DNS Root Server F** | `f.root-servers.net` | `MSM #1004` | [atlas.ripe.net/measurements/1004/](https://atlas.ripe.net/measurements/1004/) | [Raw JSON Feed](https://atlas.ripe.net/api/v2/measurements/1004/latest/?format=json) |

#### API Endpoints Employed:
1. **Measurement Discovery**:
   ```http
   GET https://atlas.ripe.net/api/v2/measurements/?type=ping&status=Ongoing&page_size=10
   ```
2. **Latest Probe Results**:
   ```http
   GET https://atlas.ripe.net/api/v2/measurements/{msm_id}/latest/?format=json
   ```
3. **Time-Bounded Results**:
   ```http
   GET https://atlas.ripe.net/api/v2/measurements/{msm_id}/results/?start={epoch_start}&stop={epoch_stop}&format=json
   ```

#### Retrieved Telemetry Fields & Units:
| Field Name | Type | Units | Description |
| :--- | :--- | :--- | :--- |
| `msm_id` | Integer | Identifier | RIPE Atlas unique measurement identification number |
| `prb_id` | Integer | Identifier | Hardware/software probe identifier geographically deployed across autonomous systems |
| `dst_name` / `dst_addr` | String | FQDN / IP | Destination hostname or IP address (e.g., `k.root-servers.net`, `193.0.14.129`, `8.8.8.8`) |
| `timestamp` | Integer | Epoch seconds | Original timestamp when the probe performed the ICMP echo transmission |
| `sent` | Integer | Packets | Number of ICMP Echo Request attempts dispatched in this probe round (typically 3) |
| `rcvd` | Integer | Packets | Number of successful ICMP Echo Reply packets received within protocol timeout |
| `result` | Array of Dicts | Latency (ms) / Error | Detailed outcome per attempt: `[{"rtt": 23.4}, {"x": "*"}]` where `*` designates unanswered timeout |
| `avg`, `min`, `max` | Float | Milliseconds | Aggregate round-trip time statistics across responding echo packets |
| `fw` | Integer | Build version | Probe firmware version |

#### Determination of Loss & Formulas:
- **Packet Loss Count**:
  $$\text{lost} = \max\left(0, \text{sent} - \text{rcvd}\right)$$
- **Observed Loss Percentage**:
  $$\text{Loss Rate (\%)} = \left(\frac{\sum \text{lost}}{\sum \text{sent}}\right) \times 100\%$$
- **Point Estimate ($\hat{p}$)**:
  $$\hat{p} = \frac{\sum_{i=1}^M \text{lost}_i}{\sum_{i=1}^M \text{sent}_i}$$
  where $M$ is the number of participating probes in the observation window.

#### Rate Limits, Caching, and Attribution:
- RIPE Atlas requests are performed over HTTPS with user-agent identification: `PacketPulse-Intelligence/1.0`.
- Results are cached in backend memory with a 45-second Time-To-Live (TTL) to avoid redundant requests and respect public API fair-use policies.
- Data Freshness is categorized dynamically:
  - **LIVE**: Data measurement age $< 5$ minutes ($< 300\text{s}$)
  - **RECENT**: Data measurement age between 5 and 30 minutes
  - **HISTORICAL**: Data measurement age $> 30$ minutes or loaded from database
  - **STALE / UNAVAILABLE**: Network failure or upstream rate limiting

#### Independent Verification Command (Curl):
```bash
curl -s "https://atlas.ripe.net/api/v2/measurements/1001/latest/?format=json" | python3 -m json.tool | head -n 35
```

---

### 2. Secondary Data Source: Local Network Diagnostics
- **Methodology**: Native macOS `/sbin/ping` execution using bounded subprocess with socket connect timing fallback.
- **Security & Parameter Constraints**:
  - Target input sanitized with strict regular expression `^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|(?:\d{1,3}\.){3}\d{1,3}$` to preclude arbitrary command execution.
  - Trial count bounded to $n \in [3, 20]$ packets.
  - Strict execution timeout of $\min(10\text{s}, 2n\text{s})$.
- **Preserved Trial Resolution**: Each attempt is recorded as a binary sequence ($0 = \text{Reply}$, $1 = \text{Drop}$) to enable consecutive failure analysis and runs tests.

---

## C. End-to-End Data Pipeline

```
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│     RIPE Atlas Public API       │       │    Local Network Diagnostic     │
│   (https://atlas.ripe.net/v2)   │       │   (Sanitized ICMP / TCP SYN)    │
└────────────────┬────────────────┘       └────────────────┬────────────────┘
                 │                                         │
                 ▼                                         ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                           FastAPI Python Backend                          │
│                                                                           │
│  1. In-memory Rate-Limit & Caching Layer (TTL = 45s)                      │
│  2. JSON Schema Validation & Error Normalization (Pydantic)               │
│  3. Calculation Engine:                                                   │
│     - Empirical p̂ & Latency Percentiles (NumPy)                           │
│     - Binomial PMF, CDF, Tail Risk & Moments (SciPy)                      │
│     - Wilson Score 95% Confidence Interval                                │
│     - Wald-Wolfowitz Runs Test for Independence                           │
│     - Chi-Square Goodness-of-Fit across Batches                           │
│     - Burstiness Dispersion Index & Loss Fingerprinting                   │
│  4. SQLite Local Persistence (SQLAlchemy: Measurements, Events, Stats)   │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ REST API (/api/v1/...)
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                         React 19 + TypeScript Frontend                    │
│                                                                           │
│  1. Live Network Pulse (Freshness badges, cards, latency timeline)        │
│  2. Measurement Explorer (Curated anchors, custom MSM ID, local triggers) │
│  3. Probability Laboratory (Interactive sliders, PMF & CDF Recharts)      │
│  4. Loss Fingerprint (Sequential attempt stream, burstiness index)        │
│  5. Model Validation (Observed vs Expected, Wilson CI bar, Runs test)     │
│  6. Data Provenance & Methodology Documentation                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### Data Pipeline Principles:
- **Zero Fabrication**: If an external endpoint times out or is unreachable, the system returns HTTP 503 with a structured error explanation and retry trigger.
- **Deduplication**: Identical measurement timestamps for the same target are deduplicated before database insertion.
- **Timezone Standardization**: All measurement timestamps are ingested as Unix epoch seconds and rendered with UTC and local timezone representations.

---

## D. Mathematical & Statistical Foundations

### 1. Bernoulli Trials Formulation
In digital communications, each probe transmission represents a discrete trial with two mutually exclusive outcomes:
$$X_i = \begin{cases} 1 & \text{if packet is dropped / lost (unanswered before timeout)} \\ 0 & \text{if packet is successfully received (valid echo reply)} \end{cases}$$
The probability of loss on each trial is denoted by $p \in [0, 1]$.

### 2. Binomial Distribution
When a batch of $n$ independent probe attempts is transmitted, the random variable $X = \sum_{i=1}^n X_i$ represents the total number of dropped packets. Under the assumptions of constant loss probability $p$ and trial independence, $X$ follows the Binomial distribution:
$$X \sim \text{Binomial}(n, p)$$

#### Probability Mass Function (PMF):
The probability of observing exactly $x$ lost packets in $n$ attempts is given by:
$$P(X = x) = \binom{n}{x} p^x (1 - p)^{n - x} = \frac{n!}{x!(n - x)!} p^x (1 - p)^{n - x}, \quad x \in \{0, 1, 2, \dots, n\}$$

#### Cumulative Distribution Function (CDF):
The probability of observing at most $x$ lost packets:
$$P(X \le x) = \sum_{k=0}^x \binom{n}{k} p^k (1 - p)^{n - k}$$

#### Upper Tail / Survival Function (At least $x$ losses):
$$P(X \ge x) = 1 - P(X \le x - 1) = \sum_{k=x}^n \binom{n}{k} p^k (1 - p)^{n - k}$$

#### Statistical Moments:
- **Expected Value (Mean)**:
  $$E[X] = \mu = n \cdot p$$
- **Variance**:
  $$\text{Var}(X) = \sigma^2 = n \cdot p \cdot (1 - p)$$
- **Standard Deviation**:
  $$\sigma = \sqrt{n \cdot p \cdot (1 - p)}$$
- **Zero Loss Probability**:
  $$P(X = 0) = (1 - p)^n$$
- **Threshold Risk (Exceeding loss threshold $T$)**:
  $$P(X > T) = P(X \ge T + 1) = \sum_{k=T+1}^n \binom{n}{k} p^k (1 - p)^{n - k}$$

---

### 3. Parameter Estimation & Wilson Score Confidence Interval
Given an observation sample of $N$ attempts with $K$ losses, the point estimate (MLE) is:
$$\hat{p} = \frac{K}{N}$$
Standard Wald intervals ($\hat{p} \pm z \sqrt{\hat{p}(1-\hat{p})/N}$) fail near $p \approx 0$ or small $N$, producing negative bounds or severe under-coverage. This application utilizes the **Wilson Score Interval**:
$$\tilde{p} = \frac{\hat{p} + \frac{z^2}{2N}}{1 + \frac{z^2}{N}}, \quad \text{Margin} = \frac{z}{1 + \frac{z^2}{N}} \sqrt{\frac{\hat{p}(1 - \hat{p})}{N} + \frac{z^2}{4N^2}}$$
$$\text{CI}_{95\%} = \left[ \max\left(0, \tilde{p} - \text{Margin}\right), \; \min\left(1, \tilde{p} + \text{Margin}\right) \right]$$
where $z = 1.95996$ for 95% confidence ($\alpha = 0.05$).

---

### 4. Wald-Wolfowitz Runs Test for Temporal Independence
To evaluate whether packet losses occur independently or exhibit burstiness/clustering, we analyze the sequential binary string of outcomes.
Let $N_0$ be successful replies, $N_1$ be packet drops, $N = N_0 + N_1$, and $R$ be the total count of contiguous runs of identical outcomes.

Under the null hypothesis $H_0$ (trials are independent Bernoulli trials):
$$\mu_R = 1 + \frac{2 N_0 N_1}{N}$$
$$\sigma_R^2 = \frac{2 N_0 N_1 (2 N_0 N_1 - N)}{N^2 (N - 1)}$$
The test statistic with continuity correction:
$$Z = \begin{cases} \frac{R - \mu_R + 0.5}{\sigma_R} & \text{if } R < \mu_R \\ \frac{R - \mu_R - 0.5}{\sigma_R} & \text{if } R > \mu_R \\ 0 & \text{if } R = \mu_R \end{cases}$$
- If $Z < -1.96$ ($p < 0.05$): Fewer runs than expected $\to$ **statistically significant clustering / burstiness**.
- If $Z > 1.96$ ($p < 0.05$): More runs than expected $\to$ **systematic alternating behavior**.
- If $|Z| \le 1.96$: Consistent with trial independence.

---

### 5. Chi-Square Goodness-of-Fit Test across Batches
When observations are partitioned into $M$ batches of trial size $b$, observed batch loss frequencies $O_k$ are tested against expected frequencies $E_k = M \cdot P(X = k)$ where $X \sim \text{Binomial}(b, \hat{p})$.
Categories with expected frequency $E_k < 5$ are collapsed into tail bins.
$$\chi^2 = \sum_{j=1}^C \frac{(O_j - E_j)^2}{E_j}, \quad df = C - 1 - 1 = C - 2$$
(1 degree of freedom subtracted for total count constraint, 1 for estimated parameter $\hat{p}$).

---

### 6. Fully Worked Numerical Example

**Telemetry Inputs**:
- Batch size: $n = 50$ packets
- Estimated loss probability: $\hat{p} = 0.04$ (4.0% packet loss)
- Test count: $x = 2$ lost packets
- Threshold: $T = 3$ lost packets

**Calculations**:
1. Expected Losses:
   $$E[X] = n \cdot p = 50 \times 0.04 = 2.00 \text{ packets}$$
2. Variance:
   $$\text{Var}(X) = n \cdot p \cdot (1 - p) = 50 \times 0.04 \times 0.96 = 1.92$$
3. Standard Deviation:
   $$\sigma = \sqrt{1.92} \approx 1.3856 \text{ packets}$$
4. Probability of Exactly $x = 2$ Losses:
   $$\binom{50}{2} = \frac{50 \times 49}{2} = 1225$$
   $$P(X = 2) = 1225 \times (0.04)^2 \times (0.96)^{48} = 1225 \times 0.0016 \times 0.1415 = 0.2773 \quad (27.73\%)$$
5. Probability of Zero Losses:
   $$P(X = 0) = (0.96)^{50} \approx 0.1299 \quad (12.99\%)$$
6. Threshold Exceedance Risk ($P(X > 3)$):
   $$P(X > 3) = 1 - P(X \le 3) = 1 - [P(0) + P(1) + P(2) + P(3)] \approx 1 - 0.8609 = 0.1391 \quad (13.91\%)$$

---

## E. Novelty & Innovation

PacketPulse Intelligence introduces six distinctive innovative features:

1. **PacketPulse Intelligence Engine**:
   Transforms raw network socket and ICMP metrics into probabilistic models and explainable operational alerts.
2. **Loss Fingerprint**:
   Dissects the microstructure of packet loss in time. Rather than computing only an aggregate percentage, it measures:
   - Maximum consecutive dropped packet streak.
   - Frequency distribution of run lengths (single drops vs multi-packet bursts).
   - Burstiness Index: Variance-to-Mean Dispersion Ratio across sliding temporal sub-windows ($\text{Var}(W) / E[W]$).
   - Automated interpretable classification: *Low observed loss*, *Uniform / Dispersed loss*, *Potentially clustered loss*, or *Insufficient evidence*.
3. **Expected vs. Observed Analyzer**:
   Directly overlays empirical loss events against theoretical Binomial probability density, highlighting exact tail probability $P(X \ge \text{observed})$ under the null model.
4. **Statistical Trust Check**:
   Evaluates whether the assumptions underlying the Binomial model (memoryless Bernoulli trials, constant $p$, binary outcomes) actually hold for the operational network path under study.
5. **Real-Time Live Auto-Updating Telemetry Engine**:
   - High-precision automated background polling engine with dynamic cadence options (5s, 10s, 30s, 60s).
   - Visual countdown timer with animated live beacon status and 1-click pause/resume toggle.
   - Microsecond cache-busting tokens (`_t=Date.now()`, `force_refresh=true`) enabling instant verification.
6. **Interactive Datasets Directory & Deep URL Hash Routing**:
   - Instant-access modal in the global navigation bar providing clickable links to both official Web Portals and raw JSON REST feeds for major Internet infrastructure (DNS Root K, Root F, Google DNS, Cloudflare DNS).
   - Native HTML5 hash routing (`#overview`, `#explorer`, `#probability`, `#fingerprint`, `#validation`, `#provenance`) with browser back/forward history synchronization.

---

## F. Installation & Execution Guide (macOS)

### Prerequisites
- macOS 12.0 or higher
- Python 3.10+ (tested with Python 3.13)
- Node.js 18+ (tested with Node.js v25)
- npm 9+

---

### Step 1: Clone or Navigate to Project Workspace
```bash
cd "/Users/jananishree/Documents/MATH MICRO PROJECT "
```

---

### Step 2: Configure Environment Variables
Copy the example environment configuration:
```bash
cp .env.example .env
```
*(Optional: Set your `RIPE_ATLAS_API_KEY` in `.env` if you have a registered account; public read endpoints function without an API key).*

---

### Step 3: Install Backend Dependencies
```bash
pip install -r backend/requirements.txt
```
*(Dependencies: `fastapi`, `uvicorn`, `numpy`, `scipy`, `pandas`, `pydantic`, `sqlalchemy`, `httpx`, `pytest`)*

---

### Step 4: Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

### Step 5: Start the Backend Server
In your first terminal:
```bash
cd "/Users/jananishree/Documents/MATH MICRO PROJECT "
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Base URL: `http://127.0.0.1:8000`
- Interactive Swagger Documentation: `http://127.0.0.1:8000/docs`
- Health Endpoint: `http://127.0.0.1:8000/api/v1/health`

---

### Step 6: Start the Frontend Application
In a second terminal:
```bash
cd "/Users/jananishree/Documents/MATH MICRO PROJECT /frontend"
npm run dev -- --host 127.0.0.1 --port 5173
```
- Frontend Application URL: `http://127.0.0.1:5173/` or `http://localhost:5173/`

---

### Step 7: Localhost Service Directory & Port Mapping

| Service / View | Localhost URL | Description |
| :--- | :--- | :--- |
| **Interactive Dashboard** | [http://localhost:5173/](http://localhost:5173/) | Production dark-navy responsive operations dashboard |
| **Backend REST API** | [http://localhost:8000/](http://localhost:8000/) | FastAPI Python backend engine |
| **Swagger API Explorer** | [http://localhost:8000/docs](http://localhost:8000/docs) | Interactive OpenAPI testing console |
| **ReDoc Documentation** | [http://localhost:8000/redoc](http://localhost:8000/redoc) | Clean schema & endpoint reference |
| **Health Check Endpoint** | [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) | System health & data integrity verification |
| **SQLite Historical Dataset**| [http://localhost:8000/api/v1/measurements/history](http://localhost:8000/api/v1/measurements/history) | JSON feed of all persisted real-world telemetry |

#### Direct URL Hash Navigation (Deep Links):
- **Live Network Pulse**: `http://localhost:5173/#overview`
- **Measurement Explorer**: `http://localhost:5173/#explorer`
- **Probability Laboratory**: `http://localhost:5173/#probability`
- **Loss Fingerprint**: `http://localhost:5173/#fingerprint`
- **Model Validation**: `http://localhost:5173/#validation`
- **Data Provenance & Datasets**: `http://localhost:5173/#provenance`

#### Live Auto-Update Operation:
- **Refresh Cadence**: Toggle between `5s (Live)`, `10s (Fast)`, `30s`, and `60s` directly in the top header.
- **Pulsing Indicator**: The emerald beacon displays the remaining seconds before the next automatic telemetry fetch (`Live (Xs)`).
- **Pause / Resume**: Click the timer button to pause polling or resume live updates.
- **Immediate Bypass**: Click the circular `Refresh` button anytime to bypass caching and force a fresh query to RIPE Atlas.

---

### Step 8: Stopping the Servers
Press `CTRL+C` in each terminal window to gracefully terminate the backend and frontend dev servers.

---

## G. Project Structure

```
MATH MICRO PROJECT /
├── .env.example                       # Example environment variables
├── .gitignore                         # Comprehensive git exclusions
├── README.md                          # Complete academic and technical documentation
├── backend/
│   ├── requirements.txt               # Backend Python dependencies
│   ├── data/
│   │   └── packetpulse.db             # Local SQLite database (auto-generated)
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI entrypoint, CORS, router registration
│   │   ├── config.py                  # Pydantic configuration settings
│   │   ├── database.py                # SQLAlchemy engine & session management
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── db_models.py           # SQLite tables (Measurements, LossEvents, Stats)
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py             # Pydantic request & response validation schemas
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── binomial_engine.py     # Exact SciPy PMF, CDF, moments, Wilson CI
│   │   │   ├── statistical_validation.py # Runs test, Chi-square GoF, burstiness
│   │   │   ├── ripe_atlas.py          # Official RIPE Atlas REST API client & cache
│   │   │   └── local_network.py       # Bounded local ICMP & TCP latency diagnostics
│   │   └── routers/
│   │       ├── __init__.py
│   │       ├── pulse.py               # GET /api/v1/pulse (Live network pulse)
│   │       ├── probability.py         # POST /api/v1/probability/calculate
│   │       ├── fingerprint.py         # GET /api/v1/fingerprint (Burstiness analysis)
│   │       ├── validation.py          # GET /api/v1/validation (Model trust check)
│   │       ├── measurements.py        # Public measurement discovery & history
│   │       └── provenance.py          # GET /api/v1/provenance (Lineage & metadata)
│   └── tests/
│       ├── test_binomial_math.py      # SciPy PMF, moments, edge cases, Wilson CI
│       ├── test_statistical_tests.py  # Runs test, Chi-square GoF, burstiness index
│       └── test_api_endpoints.py      # FastAPI HTTP endpoint & validation tests
└── frontend/
    ├── index.html                     # HTML5 template with Inter typography
    ├── package.json                   # React 19, TypeScript, Recharts, Lucide, Tailwind
    ├── vite.config.ts                 # Vite bundler configuration & API proxy
    ├── tailwind.config.js             # Dark navy, electric cyan, violet design tokens
    ├── postcss.config.js              # PostCSS plugins
    ├── tsconfig.json                  # TypeScript compiler settings
    └── src/
        ├── main.tsx                   # React root mount
        ├── App.tsx                    # Tab state, auto-refresh polling, main layout
        ├── index.css                  # Custom styling, scrollbars, glassmorphism
        ├── types.ts                   # Complete TypeScript interfaces
        ├── api.ts                     # API client functions
        ├── components/
        │   ├── Navbar.tsx             # 6-tab navigation, auto-refresh cadence, Datasets trigger
        │   ├── DataIntegrityBanner.tsx # Visual verified telemetry badge & direct portal links
        │   └── DatasetsModal.tsx      # Interactive directory modal for real-world datasets & APIs
        └── pages/
            ├── OverviewPage.tsx       # Live Network Pulse cards & RTT timeline
            ├── ExplorerPage.tsx       # RIPE Atlas anchors & local diagnostic runner
            ├── ProbabilityLabPage.tsx # Interactive Binomial calculator & PMF chart
            ├── FingerprintPage.tsx    # Sequential binary stream & burstiness index
            ├── ValidationPage.tsx     # Observed vs Expected, Wilson CI, Runs test
            └── ProvenancePage.tsx     # Academic documentation & formulas
```

---

## H. API Reference

### 1. `GET /api/v1/health`
Returns system operational status and data integrity mode.
- **Response**:
  ```json
  {
    "status": "healthy",
    "service": "PacketPulse Intelligence",
    "database": "connected",
    "data_integrity": "REAL_DATA_FIRST"
  }
  ```

### 2. `GET /api/v1/pulse`
Retrieves live network pulse metrics from RIPE Atlas, Local Diagnostics, or SQLite History.
- **Query Parameters**:
  - `source`: `RIPE_ATLAS` (default), `LOCAL_DIAGNOSTIC`, or `HISTORICAL`
  - `msm_id`: RIPE Atlas Measurement ID (default `1001`)
  - `target`: Target hostname or IP for local ping (default `1.1.1.1`)
- **Key Response Fields**: `total_sent`, `successful_replies`, `failed_losses`, `observed_loss_percentage`, `estimated_p`, `avg_rtt_ms`, `median_rtt_ms`, `p95_rtt_ms`, `freshness_status`, `probes`, `alerts`.

### 3. `POST /api/v1/probability/calculate`
Calculates exact Binomial distribution statistics and returns full PMF data.
- **Request Body**:
  ```json
  {
    "n": 50,
    "p": 0.04,
    "x": 2,
    "threshold": 5,
    "mode": "measured"
  }
  ```
- **Response**: Exact $P(X=x)$, $P(X \le x)$, $P(X \ge x)$, $E[X]$, $\text{Var}(X)$, $\sigma$, substituted formula string, and PMF points array.

### 4. `GET /api/v1/fingerprint`
Extracts sequential attempt outcomes and computes burstiness classification.
- **Key Response Fields**: `sequential_attempts` ($[0, 0, 1, \dots]$), `max_consecutive_losses`, `consecutive_run_counts`, `burstiness_dispersion_index`, `temporal_classification`, `classification_reason`.

### 5. `GET /api/v1/validation`
Performs hypothesis testing and assumption checks.
- **Key Response Fields**: `expected_losses`, `observed_losses`, `tail_prob_of_observed_or_worse`, `wilson_ci`, `runs_test`, `chi_square_gof`, `binomial_assumptions_check`, `explainable_insights`.

### 6. `GET /api/v1/measurements/public`
Lists ongoing public ping measurements from RIPE Atlas API with filtering and pagination.

### 7. `POST /api/v1/measurements/local`
Triggers a bounded local diagnostic ping against a validated target with trial size bounding ($n \in [3, 20]$).

### 8. `GET /api/v1/measurements/history`
Retrieves persisted historical telemetry runs from the local SQLite database.
- **Query Parameters**: `limit` (default 50)
- **Key Response Fields**: Array of records with `msm_id`, `source`, `target`, `total_sent`, `total_lost`, `loss_percentage`, `avg_rtt`, and timestamp.

### 9. `GET /api/v1/measurements/loss-events`
Returns granular individual packet loss events with consecutive run lengths and probe IDs.

### 10. `GET /api/v1/provenance`
Returns system data provenance, architectural documentation, and mathematical formulations.

---

## I. Testing & Verification Suite

All mathematical computations, boundary conditions, and API endpoints are verified via automated automated test suites.

### Running Backend Unit & Integration Tests:
```bash
cd "/Users/jananishree/Documents/MATH MICRO PROJECT "
PYTHONPATH=. pytest -v backend/tests
```

### Actual Test Suite Execution Results:
```text
============================= test session starts ==============================
platform darwin -- Python 3.13.5, pytest-8.3.4
rootdir: /Users/jananishree/Documents/MATH MICRO PROJECT 

backend/tests/test_api_endpoints.py::test_health_endpoint PASSED         [  7%]
backend/tests/test_api_endpoints.py::test_root_endpoint PASSED           [ 14%]
backend/tests/test_api_endpoints.py::test_probability_calculation_api PASSED [ 21%]
backend/tests/test_api_endpoints.py::test_provenance_endpoint PASSED     [ 28%]
backend/tests/test_api_endpoints.py::test_local_diagnostic_validation PASSED [ 35%]
backend/tests/test_binomial_math.py::test_binomial_standard_calculation PASSED [ 42%]
backend/tests/test_binomial_math.py::test_pmf_sums_to_one PASSED         [ 50%]
backend/tests/test_binomial_math.py::test_binomial_edge_cases PASSED     [ 57%]
backend/tests/test_binomial_math.py::test_wilson_score_interval PASSED   [ 64%]
backend/tests/test_statistical_tests.py::test_runs_test_clustered PASSED [ 71%]
backend/tests/test_statistical_tests.py::test_runs_test_alternating PASSED [ 78%]
backend/tests/test_statistical_tests.py::test_runs_test_inconclusive_small PASSED [ 85%]
backend/tests/test_statistical_tests.py::test_loss_fingerprint_metrics PASSED [ 92%]
backend/tests/test_statistical_tests.py::test_chi_square_gof_insufficient_batches PASSED [100%]

============================== 14 passed in 0.91s ==============================
```

### Verified Test Categories:
1. **Mathematical Consistency**:
   - $\sum_{k=0}^n P(X = k) = 1.00000$ validated over multiple parameter pairs.
   - $E[X] = np$, $\text{Var}(X) = np(1-p)$, $\sigma = \sqrt{np(1-p)}$ validated within $10^{-6}$.
   - Boundary tests for $p = 0.0$ (deterministic zero loss), $p = 1.0$ (deterministic 100% loss), $n = 0$, and $x > n$.
2. **Statistical Robustness**:
   - Wilson score confidence interval generates non-negative, asymmetric bounds even at zero loss.
   - Wald-Wolfowitz runs test identifies clustering with $Z < -2.0$ on contiguous drop bursts.
3. **API Security**:
   - Illegal character injection in local ping targets correctly returns HTTP 400.

---

## J. Limitations & Future Scope

### Limitations:
1. **ICMP Deprioritization**: Many Internet routers deprioritize or rate-limit ICMP Echo Requests in their control planes. An observed ICMP loss does not automatically mean higher-layer TCP or UDP payload packets experienced identical loss rates.
2. **Correlated / Bursty Loss**: The standard Binomial distribution assumes independent Bernoulli trials. Real router drop-tail buffer overflows cause clustered packet drops. When the Wald-Wolfowitz runs test rejects independence, Binomial predictions should be interpreted as a baseline approximation.
3. **Probe Asymmetry**: In RIPE Atlas measurements, individual probes operate across diverse last-mile access links (DSL, fiber, cellular). Aggregating heterogeneous probes into a single point estimate $\hat{p}$ averages out regional variations.

### Future Scope:
1. **Markovian Correlated Loss Modeling**: Implement two-state **Gilbert-Elliott Markov Chains** to model transitions between "Good" and "Bad" network states when runs tests detect clustering.
2. **Autonomous Anomaly Detection**: Integrate statistical process control (CUSUM / EWMA charts) for real-time alerting on transient loss spikes.
3. **IPv6 and UDP Traceroute Diagnostics**: Extend probe capabilities to measure path MTU and transport-layer queuing delays.

---

## K. References

1. **RIPE Atlas Documentation**: RIPE NCC. *RIPE Atlas REST APIs Manual & Documentation*. [https://atlas.ripe.net/docs/apis/](https://atlas.ripe.net/docs/apis/)
2. **Ross, Sheldon M.** (2014). *Introduction to Probability Models*. 11th Edition, Academic Press.
3. **Papoulis, A., & Pillai, S. U.** (2002). *Probability, Random Variables, and Stochastic Processes*. McGraw-Hill.
4. **Wilson, E. B.** (1927). "Probable inference, the law of seizure, and statistical determination". *Journal of the American Statistical Association*, 22(158), 209–212.
5. **Wald, A., & Wolfowitz, J.** (1940). "On a test whether two samples are from the same population". *The Annals of Mathematical Statistics*, 11(2), 147–162.
6. **RFC 792**: Postel, J. (1981). *Internet Control Message Protocol*. DARPA Internet Program Protocol Specification.
7. **Bolch, G., Greiner, S., de Meer, H., & Trivedi, K. S.** (2006). *Queueing Networks and Markov Chains: Modeling and Performance Evaluation with Computer Science Applications*. John Wiley & Sons.

---

*Academic Micro-Project Deliverable — PacketPulse Intelligence*  
*Developed for Probability and Statistics for Data Science and Cyber Security Engineers.*
