# Technologies and Practices Glossary (TECH.md)

This document provides a comprehensive breakdown of the methodologies, practices, and specific technologies utilized in the Irminsul platform.

---

## 🔄 Core Methodologies

### DevOps (Development & Operations)
DevOps is a cultural and technical philosophy aimed at breaking down silos between software developers and IT operations. 
* **In Irminsul**: This is demonstrated by the seamless flow from writing code (React/Go) to deploying it into infrastructure (K3s/AWS) using automated pipelines. There is no manual "hand-off" to a sysadmin.

### DevSecOps (Development, Security, & Operations)
An evolution of DevOps that integrates security practices at every phase of the software development lifecycle (SDLC), rather than treating security as an afterthought.
* **In Irminsul**: Security is "shifted left." The Jenkins pipeline automatically scans the Go code for vulnerabilities (SAST via Gosec/Semgrep) and scans the Docker containers for CVEs (Trivy) *before* anything is allowed to be deployed.

### Zero-Trust Architecture
A security framework requiring all users, whether in or outside the organization's network, to be authenticated, authorized, and continuously validated. The core tenet is "never trust, always verify."
* **In Irminsul**: The backend API explicitly does not trust the database or the storage bucket with user data. It utilizes Client-Side Encryption, meaning the backend assumes it will be breached, and guarantees data remains safe even in that scenario.

### Infrastructure as Code (IaC)
The process of managing and provisioning computer data centers through machine-readable definition files, rather than physical hardware configuration or interactive configuration tools.
* **In Irminsul**: Terraform provisions the AWS hardware. Ansible configures the software on that hardware.

---

## ☁️ Infrastructure & Cloud Technologies

### AWS (Amazon Web Services)
The primary public cloud provider used to host the infrastructure.
* **VPC (Virtual Private Cloud)**: The logically isolated network where our servers live.
* **EC2 (Elastic Compute Cloud)**: The virtual servers (VMs) that host the K3s cluster.
* **RDS (Relational Database Service)**: The managed Postgres database handling metadata.
* **S3 (Simple Storage Service)**: The highly scalable object storage where the encrypted files are kept.
* **IAM (Identity and Access Management)**: Controls which services (like the K3s nodes) have permission to talk to other services (like S3).

### Terraform (by HashiCorp)
The Infrastructure as Code tool used to declare the AWS resources.
* **State Management**: Terraform remembers what it built via a `terraform.tfstate` file, allowing it to modify or destroy resources intelligently.
* **HCL (HashiCorp Configuration Language)**: The declarative language used to write Terraform files.

### Ansible (by Red Hat)
A configuration management tool used to automate software provisioning and application deployment.
* **Playbooks**: YAML files defining what software should be installed on the EC2 instances (e.g., Docker, K3s).
* **Idempotency**: Ansible ensures that running a script multiple times results in the same state without breaking things.

---

## 🐳 Containerization & Orchestration

### Docker
A platform designed to help developers build, share, and run modern applications inside isolated environments called containers.
* **In Irminsul**: Both the Vault API and the Frontend React app are packaged into lightweight Docker images.

### Kubernetes (K3s)
An open-source system for automating deployment, scaling, and management of containerized applications. K3s is a lightweight, certified Kubernetes distribution built for IoT and Edge computing (or AWS Free Tier).
* **Pods**: The smallest deployable units in Kubernetes. A pod holds our Docker containers.
* **Deployments**: Manages stateless applications (like the Vault API), ensuring a specified number of pods are always running.
* **CronJobs**: Time-based jobs. Used to run the Wiper daemon every 5 minutes.
* **Services & Ingress**: Routes external internet traffic to the correct internal Pods.

---

## 🛠️ Application Stack

### Golang (Go)
A statically typed, compiled programming language designed at Google. Known for simplicity, performance, and concurrency.
* Used for the backend **Vault API** and the **Wiper** service. It compiles down to a single binary, making the Docker container extremely small (~15MB).

### React, Vite, & TypeScript
* **React**: A JavaScript library for building user interfaces based on components.
* **Vite**: A modern frontend build tool that is significantly faster than Webpack (Create React App).
* **TypeScript**: Adds static typing to JavaScript, reducing runtime errors and improving developer experience.

### Web Crypto API & Cryptography
* **AES-256-GCM**: Advanced Encryption Standard with a 256-bit key in Galois/Counter Mode. It encrypts the data and provides a cryptographic checksum to verify data integrity.
* **PBKDF2**: Password-Based Key Derivation Function 2. It takes the user's password and hashes it thousands of times (300,000 in Irminsul) to create the 256-bit AES key, thwarting brute-force attacks.
* **@noble/ciphers**: A heavily audited JavaScript cryptography library used as a polyfill when the browser's native Web Crypto API is blocked (e.g., over standard HTTP connections).

---

## 🚦 Continuous Integration / Continuous Deployment (CI/CD)

### Jenkins
An open-source automation server that enables developers to build, test, and deploy their software.
* **Pipeline as Code**: The `Jenkinsfile` dictates the steps required to take code from a GitHub push to a deployed application.

### SAST & DAST (Security Testing)
* **Gosec**: A Static Application Security Testing (SAST) tool specifically for Golang code. It scans the source code for hardcoded passwords, SQL injection vulnerabilities, etc.
* **Semgrep**: A lightweight static analysis tool for multiple languages.
* **Trivy**: A comprehensive vulnerability scanner for container images. It checks if the base Linux image in our Docker container has known CVEs (Common Vulnerabilities and Exposures).
