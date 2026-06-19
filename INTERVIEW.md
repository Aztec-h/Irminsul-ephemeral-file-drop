# Irminsul - Interview Guide

This document contains 25 likely interview questions (and detailed answers) you might face when discussing the Irminsul project. They cover System Design, DevOps, Security, Backend, and Frontend.

---

## 🏗️ System Architecture & Design

### 1. Can you describe the high-level architecture of Irminsul?
**Answer**: Irminsul is a microservices-based, zero-trust platform. The frontend (React/TypeScript) encrypts files locally via AES-256-GCM. It requests a presigned S3 URL from the Vault service (Golang API). The encrypted file goes straight to S3, bypassing our backend. Metadata (download limits, expiry) is stored in Postgres. A separate Wiper service (Golang CronJob) runs every 5 minutes to delete expired S3 objects and Postgres metadata. Everything is deployed on K3s within AWS, provisioned by Terraform.

### 2. Why did you choose a microservices architecture instead of a monolith?
**Answer**: I wanted to enforce strict separation of concerns, especially regarding security. By splitting the API (Vault) from the cleanup routine (Wiper), I ensured the API doesn't get bogged down by background tasks. It also allowed me to scale the frontend independently and package the Wiper daemon as a Kubernetes CronJob rather than a continuous background thread.

### 3. How does Irminsul enforce a "Zero-Trust" model?
**Answer**: Our backend explicitly distrusts itself. The server never receives the encryption passphrase and never sees the plaintext file. The file is encrypted entirely in the browser, and the resulting ciphertext is uploaded directly to S3. Even if a malicious actor gained root access to the Postgres DB and the S3 bucket, they could not decrypt the data without the user's out-of-band passphrase.

### 4. Why use AWS S3 Presigned URLs instead of proxying uploads through the backend?
**Answer**: Proxying large file uploads through a backend server consumes significant network bandwidth and memory, creating a massive bottleneck. Presigned URLs offload the heavy lifting directly to AWS S3's globally distributed network, keeping the Go backend lean, stateless, and cost-efficient.

### 5. What happens if a file upload fails mid-way?
**Answer**: If a direct-to-S3 upload fails, the object in S3 might be incomplete, or not exist. However, the database record was already created when the presigned URL was generated. The Wiper service will eventually catch this "orphaned" record during its 5-minute sweep once its TTL expires, and clean up both the DB and any partial S3 data.

---

## 🔐 DevSecOps & Security

### 6. What tools did you use in your DevSecOps pipeline and why?
**Answer**: I used Jenkins to orchestrate the CI/CD flow. For static analysis (SAST), I integrated **Gosec** (to catch Go-specific vulnerabilities) and **Semgrep** (for broader code pattern analysis). For container scanning, I used **Trivy** to ensure no high/critical CVEs made it into the Docker images before pushing them to the Elastic Container Registry (ECR). 

### 7. Explain AES-256-GCM and why you used it over CBC.
**Answer**: AES-256-GCM is an authenticated encryption mode. Unlike CBC (Cipher Block Chaining), which only provides confidentiality, GCM provides both confidentiality and data integrity (authentication). This ensures that if an attacker alters the encrypted file in transit or at rest, the decryption process will fail immediately rather than returning corrupted plaintext.

### 8. Why use PBKDF2 with 300,000 iterations for the key derivation?
**Answer**: PBKDF2 is a key derivation function designed to be computationally expensive. Passphrases are often weak or short. By hashing the passphrase 300,000 times with a random salt, we drastically slow down brute-force and dictionary attacks. 300k is aligned with modern OWASP recommendations for PBKDF2.

### 9. How did you handle secrets management in Kubernetes?
**Answer**: I utilized Kubernetes `Secret` resources to decouple sensitive data (like DB passwords and AWS credentials) from the application code. These were injected into the Pods as environment variables. In a production environment, I would extend this with AWS Secrets Manager or HashiCorp Vault.

### 10. How do you prevent DDOS attacks on the Presigned URL generation endpoint?
**Answer**: Currently, network policies and standard Ingress rate limiting can mitigate this. Moving forward, integrating AWS WAF at the load balancer level and implementing application-level rate limiting (e.g., via Redis) on the `/api/generate` endpoint would be necessary for production scale.

---

## ⚙️ DevOps & Infrastructure

### 11. Why did you choose Terraform over AWS CloudFormation?
**Answer**: Terraform is cloud-agnostic and has a much more expressive syntax (HCL). It allowed me to rapidly provision VPCs, Subnets, EC2s, and RDS using open-source modules. It also separates the planning phase (`terraform plan`) from execution, reducing the risk of accidental infrastructure destruction.

### 12. You used Ansible in this project. What was its role?
**Answer**: Once Terraform provisioned the raw EC2 instances, Ansible took over for configuration management. It SSH'd into the instances to install necessary dependencies, apply OS hardening rules, and bootstrap the K3s cluster. Ansible is excellent for imperative state enforcement on raw machines.

### 13. Why use K3s instead of AWS EKS?
**Answer**: EKS charges an hourly control plane fee (~$70/month), which breaks the AWS free-tier boundaries. K3s is a highly optimized, lightweight Kubernetes distribution by Rancher that runs perfectly on `t3.micro` instances. It provided all the K8s orchestration benefits (CronJobs, Deployments, Services) at zero cost for this project.

### 14. Explain your Jenkins pipeline strategy.
**Answer**: My pipeline is declarative and split into logical stages:
1. **Checkout & Lint**: Verify syntax.
2. **SAST**: Run Gosec & Semgrep.
3. **Build & Test**: Compile Go binaries, run unit tests.
4. **Containerize**: Docker build the images.
5. **Scan**: Run Trivy on the images.
6. **Push**: Upload to AWS ECR.
7. **Deploy**: `kubectl apply` to update the cluster.

### 15. How do you ensure your infrastructure code doesn't drift?
**Answer**: Storing Terraform state in an S3 backend with DynamoDB locking ensures state consistency across team members. To detect drift, we can run a scheduled `terraform plan` in Jenkins to alert us if the AWS state diverges from the code in Git.

---

## 🛠️ Backend (Golang)

### 16. Why did you choose Golang for the backend services?
**Answer**: Go compiles to a single, statically linked binary, making containerization incredibly small and fast. It also has a phenomenal standard library for concurrency (goroutines) and network requests, which is perfect for an API and background daemons like the Wiper service.

### 17. How does the Wiper service interact with the Kubernetes ecosystem?
**Answer**: The Wiper is deployed as a Kubernetes `CronJob`. Instead of writing a persistent daemon that sleeps, Kubernetes natively handles the scheduling. Every 5 minutes, K8s spins up a Wiper pod, the Go binary queries Postgres for expired records, deletes them from S3, cleans the DB, and the pod cleanly exits.

### 18. What would happen if two Wiper cronjobs ran at the exact same time?
**Answer**: In K8s, the `CronJob` spec has a `concurrencyPolicy`. Setting it to `Forbid` prevents concurrent executions. If it did run concurrently, we could use a database transaction with `SELECT ... FOR UPDATE SKIP LOCKED` to ensure both workers process different records without deadlocking.

### 19. How did you structure your Go project?
**Answer**: I followed standard Go project layouts. `cmd/` contains the application entry points. `internal/` contains code strictly for this project (handlers, db connections, models) that cannot be imported by other repositories. `pkg/` would be used for shared public libraries.

### 20. How does the Vault handle database connections efficiently?
**Answer**: The Vault service uses `database/sql` combined with the `pgx` driver, which natively supports connection pooling. It keeps a pool of idle connections open, preventing the overhead of establishing a new TCP/TLS connection to RDS for every API request.

---

## 🌐 Frontend (React & TypeScript)

### 21. What challenges did you face with client-side encryption?
**Answer**: The biggest challenge was the `crypto.subtle` Web Crypto API. Browsers enforce a strict security context, meaning Web Crypto is disabled over HTTP (except localhost). For development on AWS without an SSL certificate, I had to engineer a polyfill using `@noble/ciphers` to ensure the encryption still worked over standard HTTP.

### 22. How does a user download and decrypt a file?
**Answer**: The downloader visits the share link, which contains the unique ID in the URL and the decryption passphrase in the URL fragment (e.g., `#passphrase`). The fragment is *never* sent to the server. The frontend fetches the encrypted blob from S3, derives the key using the fragment, decrypts it in-memory, and triggers a browser download.

### 23. Why use Vite over Create React App (CRA)?
**Answer**: CRA is effectively deprecated and uses Webpack, which is notoriously slow. Vite uses esbuild (written in Go) for pre-bundling dependencies and offers near-instant hot module replacement (HMR), vastly improving developer experience.

### 24. How did you manage state in the React application?
**Answer**: Since the application flow is largely linear (Upload -> Share -> Download), complex global state managers like Redux were unnecessary. I relied on standard React hooks (`useState`, `useEffect`) and React Router for view transitions.

### 25. How do you handle massive files without crashing the browser?
**Answer**: Currently, files are processed in memory using `ArrayBuffer`, which limits file sizes to what the browser can hold in RAM (typically a few hundred MBs). To scale this for multi-gigabyte files, I would implement the Streams API, reading the file in chunks, encrypting the chunk, and using S3 Multipart Uploads.
