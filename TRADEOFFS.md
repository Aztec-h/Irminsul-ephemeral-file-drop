# System Trade-Offs & Architectural Decisions

This document details the critical architectural decisions made during the design and implementation of Irminsul. It explores the reasoning behind the technologies chosen, the alternatives considered, and why those alternatives were rejected.

---

## 1. Container Orchestration: K3s vs. AWS EKS vs. ECS

### The Decision: K3s (Lightweight Kubernetes)
We chose K3s installed on raw EC2 instances via Ansible.

**Why?**
* **Cost Efficiency**: AWS EKS charges a flat ~$70/month control plane fee. This project aimed to remain within the AWS Free Tier during development.
* **Declarative Workloads**: We needed advanced orchestration features like `CronJobs`, `NetworkPolicies`, and `Ingress` controllers, which standard Docker Compose lacks.
* **Portability**: Kubernetes manifests (`.yaml`) are cloud-agnostic. We can migrate this cluster to GCP, Azure, or on-premise without rewriting the deployment logic.

**Alternatives Rejected:**
* **AWS EKS**: Rejected strictly due to cost constraints. In an enterprise production setting, EKS is vastly superior due to managed upgrades, IAM role integration (IRSA), and high availability.
* **AWS ECS (Fargate)**: ECS is AWS-proprietary. While it removes node management, migrating away from ECS requires rewriting task definitions. K3s offers superior vendor neutrality.
* **Docker Swarm**: Declining industry adoption and weaker ecosystem support compared to Kubernetes.

---

## 2. Infrastructure as Code (IaC): Terraform vs. CloudFormation

### The Decision: HashiCorp Terraform
Terraform was used to provision the foundational AWS infrastructure (VPC, EC2, RDS, S3).

**Why?**
* **Cloud Agnostic Logic**: While the AWS provider is specific, the HCL syntax and state management skills transfer easily to other cloud providers.
* **Ecosystem & Modules**: The Terraform Registry provides robust, battle-tested modules (e.g., `terraform-aws-modules/vpc`) that abstract away hundreds of lines of boilerplate.
* **Plan & Apply Paradigm**: The separation of `plan` (previewing changes) and `apply` (executing changes) provides a massive safety net.

**Alternatives Rejected:**
* **AWS CloudFormation**: Extremely verbose (JSON/YAML), AWS-locked, and notoriously difficult to debug when stacks roll back due to errors.
* **AWS CDK (Cloud Development Kit)**: While allowing IaC via Python/TypeScript is appealing, Terraform remains the industry standard for multi-cloud DevSecOps roles.

---

## 3. Configuration Management: Ansible vs. Packer vs. User Data

### The Decision: Ansible
Ansible was used to configure the EC2 instances after they were provisioned by Terraform.

**Why?**
* **Imperative Control**: Perfect for running sequential setup tasks (installing Docker, downloading K3s binaries, configuring systemd).
* **Agentless**: Ansible operates over standard SSH. It doesn't require pre-installing an agent on the target machine.

**Alternatives Rejected:**
* **HashiCorp Packer**: Packer builds immutable machine images (AMIs). In a highly mature environment, using Packer to bake K3s into an AMI is superior (faster scaling). However, for a single-node cluster in development, Ansible was faster to iterate on.
* **EC2 User Data (Bash scripts)**: Difficult to debug, lack idempotency (they run once on boot, and if they fail, the machine is broken), and hard to maintain as complexity grows.

---

## 4. CI/CD Pipeline: Jenkins vs. GitHub Actions

### The Decision: Jenkins
Jenkins was chosen for the DevSecOps pipeline.

**Why?**
* **DevSecOps Standard**: Jenkins is ubiquitous in enterprise environments. Demonstrating a Jenkins pipeline controlled by a declarative `Jenkinsfile` is highly desirable in the DevOps job market.
* **Granular Plugin Control**: Allowed easy integration of specific SAST/DAST tools.
* **Self-Hosting**: Allows full control over the execution environment, runners, and caching.

**Alternatives Rejected:**
* **GitHub Actions**: GHA is faster to set up and requires zero server maintenance. However, relying solely on GHA obscures the complexities of managing a CI/CD server, which is a valuable DevOps skill to showcase.
* **GitLab CI**: Excellent tool, but Jenkins was selected to demonstrate traditional enterprise competence.

---

## 5. Security Architecture: Client-Side vs. Server-Side Encryption

### The Decision: Client-Side Encryption (Web Crypto API)
Files are encrypted in the user's browser via AES-256-GCM before transmission.

**Why?**
* **Absolute Zero-Trust**: Even if a rogue AWS administrator dumps the Postgres database and downloads the S3 bucket, they receive encrypted gibberish. The passphrase never traverses the network.
* **Liability Reduction**: The server never holds plaintext sensitive data, drastically reducing compliance and legal liabilities.

**Alternatives Rejected:**
* **Server-Side Encryption (AWS KMS / S3 SSE)**: While S3 encrypts data at rest, the data is still transmitted in plaintext (over TLS) to the backend, and the cloud provider holds the keys. If the application logic is compromised, the data can be read.

---

## 6. Storage & Upload Mechanism: Direct S3 Presigned URLs vs. API Proxy

### The Decision: Direct S3 Presigned URLs
The frontend requests a temporary URL from the Vault API, then `PUT`s the file directly to S3.

**Why?**
* **Bandwidth & Compute Efficiency**: Routing 1GB files through a Go backend requires significant RAM and network bandwidth on the EC2 instance. Offloading this to S3 allows the Go backend to process thousands of requests per second with minimal resources.
* **Resiliency**: S3's ingestion network is infinitely more resilient and faster than a custom API proxy.

**Alternatives Rejected:**
* **API Proxy (`multipart/form-data`)**: Traditional upload method. High CPU/RAM overhead, bottlenecking the entire microservices cluster during heavy uploads.

---

## 7. Backend Language: Golang vs. Python / Node.js

### The Decision: Golang
The Vault API and Wiper daemon are written in Go.

**Why?**
* **Performance & Binary Size**: Go compiles to a tiny, statically linked binary. Container images are < 20MB, reducing storage costs and drastically speeding up pod boot times in K8s.
* **Concurrency**: Go's Goroutines are incredibly lightweight. The Wiper daemon can efficiently query the DB and issue multiple asynchronous S3 delete requests concurrently.
* **Type Safety**: Strongly typed, catching many errors at compile time rather than runtime.

**Alternatives Rejected:**
* **Node.js**: Interpreted language, resulting in larger Docker images (due to node_modules and the runtime). Slower cold starts compared to Go.
* **Python**: Excellent for data tasks, but slower and more resource-intensive for high-throughput HTTP APIs compared to Go.

---

## 8. Database: PostgreSQL vs. DynamoDB

### The Decision: PostgreSQL (Relational DB)
Postgres is used to store file metadata (UUIDs, sizes, download counts, TTLs).

**Why?**
* **ACID Compliance**: Ensuring that decrementing a "download limit" is strongly consistent. If two people click download at the exact same millisecond, transactional locks prevent a file with 1 remaining download from being served twice.
* **Familiarity & Tooling**: Ecosystem tooling (pgAdmin, standard SQL) is highly mature.

**Alternatives Rejected:**
* **DynamoDB (NoSQL)**: DynamoDB would be an excellent fit here due to its native `TTL` feature (automatically deleting expired records without needing our custom `Wiper` cronjob). However, managing strong consistency on download decrements can be tricky, and Postgres was chosen to demonstrate relational database administration via Terraform RDS modules.
