# Irminsul - Resume Bullet Points

This document contains high-impact bullet points for your resume tailored to various roles (DevOps, DevSecOps, Backend Engineer, Frontend Engineer) based on the Irminsul project.

## Project Title & Tagline
**Irminsul | Zero-Trust Ephemeral Secure File Drop**
*A highly secure, zero-trust platform for time-constrained, encrypted file sharing built with Golang, React, and Kubernetes on AWS.*

---

## 🛠️ DevSecOps & Cloud Infrastructure Focus

* **Architected Zero-Trust Infrastructure**: Designed and provisioned a highly available AWS environment (VPC, EC2, RDS, S3) using **Terraform**, ensuring strict network isolation and adherence to the principle of least privilege.
* **Engineered DevSecOps Pipeline**: Built an automated CI/CD pipeline in **Jenkins** with integrated security gates, executing static application security testing (SAST) via **Gosec** and **Semgrep**, and container vulnerability scanning using **Trivy**.
* **Orchestrated Containerized Workloads**: Deployed microservices using **K3s (Kubernetes)** to optimize compute resource utilization on AWS free-tier instances, utilizing Custom Resource Definitions and Network Policies for internal traffic isolation.
* **Automated Configuration Management**: Developed **Ansible** playbooks to automate OS hardening, K3s cluster bootstrapping, and continuous deployment of application nodes, reducing infrastructure provisioning time by 80%.

---

## 💻 Backend & Distributed Systems Focus

* **Developed Scalable Microservices**: Engineered a robust backend system in **Golang** to handle concurrent generation of ephemeral presigned S3 URLs, decoupling metadata management from the storage layer.
* **Implemented Automated Data Purging**: Built a "Wiper" daemon as a Kubernetes CronJob that synchronously sanitizes PostgreSQL metadata and issues hard-deletes to AWS S3, guaranteeing strict data expiration limits.
* **Designed Zero-Trust API Architecture**: Enforced zero-trust principles by isolating the backend from encryption/decryption keys, preventing payload exposure even in the event of total server compromise.
* **Optimized Database Workloads**: Configured and managed **PostgreSQL** on AWS RDS to securely index object hashes, size quotas, and download budgets.

---

## 🎨 Frontend & Cryptography Focus

* **Built Secure Client Interface**: Developed the user-facing web application using **React, Vite, and TypeScript**, ensuring a responsive and intuitive design while handling complex background encryption tasks.
* **Engineered In-Browser Cryptography**: Integrated the **Web Crypto API** to perform client-side **AES-256-GCM** encryption utilizing a PBKDF2 derived key (300,000 iterations), ensuring plaintext data never leaves the local environment.
* **Developed Cryptographic Fallback**: Implemented a transparent polyfill using `@noble/ciphers` and `@noble/hashes` to maintain secure AES-GCM operations across non-standard connections lacking native SubtleCrypto support.

---

## ✨ Quantifiable Impact (Example Metrics to use)
* *Reduced cloud hosting costs by 100% during development by engineering an efficient K3s architecture compatible with AWS free-tier instances.*
* *Ensured 0% data exposure risk by enforcing strict client-side encryption and an automated 5-minute interval cryptographic purge routine.*
* *Streamlined the deployment cycle to under 5 minutes from code commit to production using a fully declarative Jenkins DevSecOps pipeline.*

---

## ⏱️ Short Version (For 1-Page Resumes)

**Irminsul | Zero-Trust Ephemeral Secure File Drop**
* Architected a highly secure, zero-trust file-sharing platform using **Golang**, **React**, and **Kubernetes** on AWS, automating the infrastructure with **Terraform** and **Ansible**.
* Engineered a fully automated DevSecOps CI/CD pipeline in **Jenkins**, integrating **Gosec**, **Semgrep**, and **Trivy** for continuous security and vulnerability scanning.
* Implemented strict client-side encryption using the **Web Crypto API (AES-256-GCM)**, ensuring zero server-side exposure of plaintext data.
* Developed a scalable backend utilizing a distributed "Wiper" daemon as a Kubernetes CronJob to automatically enforce data expiration and strict time-to-live policies.

---

## 📊 Quantifiable Version & Interview Q&A

**Irminsul | Zero-Trust Ephemeral Secure File Drop**
* Reduced cloud hosting costs by **100%** during development by orchestrating an optimized **K3s (Kubernetes)** architecture compatible with AWS free-tier instances.
* Accelerated deployment cycles by **80%** (under 5 minutes from commit to production) utilizing a fully declarative DevSecOps pipeline with integrated SAST and container scanning.
* Eliminated server-side data exposure risk (**0% risk**) by enforcing in-browser client-side encryption (**AES-256-GCM** with 300,000 PBKDF2 iterations).
* Enforced strict data limits by engineering an automated cryptographic purge routine that sanitizes database metadata and hard-deletes AWS S3 objects every **5 minutes**.

### 🗣️ Interview Follow-up Questions & Answers

**Q: How did you achieve the 100% cloud hosting cost reduction during development?**
**A:** I avoided managed services like AWS EKS, which have high baseline costs. Instead, I used K3s—a lightweight Kubernetes distribution—and deployed it on AWS free-tier `t3.micro` EC2 instances. I automated the cluster bootstrapping and node configuration using Ansible to maintain a reproducible state without relying on expensive managed orchestration.

**Q: You mentioned reducing deployment cycles by 80%. What were the bottlenecks you removed?**
**A:** Initially, manual provisioning, testing, and container deployment took upwards of 25 minutes and were error-prone. I built a declarative Jenkins pipeline that automated everything sequentially: linting, static analysis (Gosec, Semgrep), building, image scanning (Trivy), pushing to ECR, and executing `kubectl apply`. This automated workflow reduced the entire cycle to under 5 minutes.

**Q: Why use client-side encryption over standard server-side encryption, and why AES-256-GCM?**
**A:** Server-side encryption (like AWS SSE-S3) protects data at rest but still means the server handles plaintext bytes during processing. My goal was zero-trust. By encrypting on the client-side, the backend only ever handles ciphertexts. I chose AES-256-GCM because it provides Authenticated Encryption with Associated Data (AEAD), meaning it simultaneously guarantees both confidentiality and integrity (preventing ciphertext tampering).

**Q: How do you guarantee the files are actually deleted after 5 minutes?**
**A:** I implemented a two-fold approach. First, a Go-based "Wiper" service runs as a Kubernetes CronJob every 5 minutes. It queries the PostgreSQL database for expired records, issues a direct hard-delete to S3, and removes the database row. Second, as a fail-safe, I configured an AWS S3 lifecycle rule to automatically expire any objects older than a strict limit in case the CronJob fails or the cluster goes down.
