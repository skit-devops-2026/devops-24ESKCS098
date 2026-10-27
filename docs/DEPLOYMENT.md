# Deployment Documentation

This directory holds deployment evidence for M6 grading.

## Required Screenshots

Place the following screenshots in this directory:

1. **deployment-screenshot.png** — Screenshot showing the live deployed application responding in a browser
2. **kubectl-pods.png** — Screenshot of `kubectl get pods` showing pods in Ready state (for M7)

## How to Take Screenshots

```bash
# For M7 — Kubernetes pods
kubectl get pods -o wide
# Take a screenshot of the terminal output
```

For the deployment screenshot, navigate to your live URL in a browser and take a screenshot showing the page loaded successfully.
