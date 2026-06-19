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
