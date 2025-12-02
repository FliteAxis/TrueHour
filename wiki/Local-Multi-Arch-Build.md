# Local Multi-Architecture Docker Builds

## Overview

This guide explains how to build Docker images on your Mac (ARM) that support multiple architectures: **x86_64 (amd64)**, **ARM64**.

---

## Prerequisites

### 1. Docker Desktop for Mac
- Already installed ✅
- Includes Docker Buildx by default

### 2. Enable Containerd Image Store (Recommended)
This improves multi-platform build performance.

```bash
# Check current settings
docker info | grep "Storage Driver"

# Enable in Docker Desktop:
# Settings → Features in development → Use containerd for pulling and storing images
```

---

## Setup Multi-Architecture Builder

### Step 1: Create Buildx Builder

```bash
# Create a new builder instance
docker buildx create --name multiarch --driver docker-container --use

# Bootstrap the builder (downloads QEMU emulators)
docker buildx inspect multiarch --bootstrap

# Verify builder is ready
docker buildx ls
```

**Expected output:**
```
NAME/NODE    DRIVER/ENDPOINT             STATUS   BUILDKIT   PLATFORMS
multiarch *  docker-container
  multiarch0 unix:///var/run/docker.sock running  v0.12.0    linux/arm64, linux/amd64,  linux/arm/v6
```

### Step 2: Test Multi-Arch Build

```bash
# From repository root
cd /Users/rkelch/code/flight_budget

# Build for all platforms (no push)
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ryakel/flight-budget:test \
  -f infrastructure/Dockerfile \
  .
```

**Note**: Multi-platform builds cannot be loaded into local Docker directly. You must either:
- Push to registry: `--push`
- Save to tarball: `--output type=docker`
- Build single platform for local testing: `--load`

---

## Build Commands

### Local Testing (Single Platform - Your Mac ARM)

```bash
# Build for local testing on Mac ARM
docker buildx build \
  --platform linux/arm64 \
  -t ryakel/flight-budget:test \
  -f infrastructure/Dockerfile \
  --load \
  .

# Run locally
docker run -d -p 8181:80 ryakel/flight-budget:test
```

### Multi-Platform Build (No Push)

```bash
# Build all platforms but don't push
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ryakel/flight-budget:test \
  -f infrastructure/Dockerfile \
  .
```

### Multi-Platform Build and Push

```bash
# Login to Docker Hub first
docker login

# Build and push all platforms
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ryakel/flight-budget:latest \
  -f infrastructure/Dockerfile \
  --push \
  .
```

### Build Specific Platform

```bash
# Build only for x86_64 (amd64)
docker buildx build \
  --platform linux/amd64 \
  -t ryakel/flight-budget:amd64 \
  -f infrastructure/Dockerfile \
  --load \
  .

# Build only for ARM64
docker buildx build \
  --platform linux/arm64 \
  -t ryakel/flight-budget:arm64 \
  -f infrastructure/Dockerfile \
  --load \
  .

# Build only for ARM v7 (Raspberry Pi)
docker buildx build \
  -t ryakel/flight-budget:armv7 \
  -f infrastructure/Dockerfile \
  --load \
  .
```

---

## Platform Reference

| Platform | Architecture | Use Case | Devices |
|----------|--------------|----------|---------|
| `linux/amd64` | x86_64 | Most servers, Intel Macs | AWS EC2, Azure VMs, Intel/AMD servers |
| `linux/arm64` | ARM 64-bit | Apple Silicon, ARM servers | M1/M2/M3 Macs, Raspberry Pi 4, AWS Graviton |
| `linux/386` | i386 32-bit | Legacy systems | Old 32-bit x86 servers (rare) |

**Note**: Our current setup builds for **amd64 and arm64**. We don't build for i386 as it's rarely needed for modern deployments.

---

## Troubleshooting

### Issue: "multiple platforms feature is currently not supported"

**Solution**: You're using regular `docker build`. Use `docker buildx build` instead.

```bash
# ❌ Won't work for multi-platform
docker build --platform linux/amd64,linux/arm64 ...

# ✅ Correct
docker buildx build --platform linux/amd64,linux/arm64 ...
```

### Issue: "no builder instance selected"

**Solution**: Create and use a builder.

```bash
docker buildx create --name multiarch --use
docker buildx inspect multiarch --bootstrap
```

### Issue: Build is very slow

**Cause**: Building non-native architectures requires QEMU emulation.

**Solutions**:
- Build only your native platform for local testing: `--platform linux/arm64`
- Use GitHub Actions for multi-platform builds (runs on native hardware)
- Enable build cache: `--cache-from type=local,src=/tmp/buildx-cache`

### Issue: Can't load multi-platform image

**Expected behavior**: Multi-platform images can't be loaded into local Docker.

**Solutions**:
- Push to Docker Hub: `--push`
- Build single platform: `--platform linux/arm64 --load`
- Save to file: `--output type=oci,dest=image.tar`

---

## Build Cache

### Local Cache

```bash
# Create cache directory
mkdir -p /tmp/buildx-cache

# Build with cache
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ryakel/flight-budget:latest \
  -f infrastructure/Dockerfile \
  --cache-from type=local,src=/tmp/buildx-cache \
  --cache-to type=local,dest=/tmp/buildx-cache,mode=max \
  .
```

### Registry Cache

```bash
# Use Docker Hub as cache
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ryakel/flight-budget:latest \
  -f infrastructure/Dockerfile \
  --cache-from type=registry,ref=ryakel/flight-budget:buildcache \
  --cache-to type=registry,ref=ryakel/flight-budget:buildcache,mode=max \
  --push \
  .
```

---

## GitHub Actions vs Local Builds

### GitHub Actions (Recommended for Production)
- ✅ Builds all platforms in parallel on native hardware
- ✅ Faster (no QEMU emulation overhead)
- ✅ Automated on git push
- ✅ Free for public repos
- ✅ Integrated with semantic versioning

### Local Builds (Development/Testing)
- ✅ Immediate feedback
- ✅ Test before pushing
- ⚠️ Slower (QEMU emulation for non-native)
- ⚠️ Manual process

**Recommendation**:
- Use **local builds** (single platform) for development/testing
- Use **GitHub Actions** for production multi-platform builds

---

## Quick Reference

### Setup (One-time)
```bash
docker buildx create --name multiarch --driver docker-container --use
docker buildx inspect multiarch --bootstrap
```

### Local Testing (Fast)
```bash
docker buildx build \
  --platform linux/arm64 \
  -t ryakel/flight-budget:test \
  -f infrastructure/Dockerfile \
  --load \
  . && \
docker run -d -p 8181:80 ryakel/flight-budget:test
```

### Multi-Platform Build (Slow)
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ryakel/flight-budget:latest \
  -f infrastructure/Dockerfile \
  --push \
  .
```

### Verify Multi-Platform Image
```bash
# After pushing
docker buildx imagetools inspect ryakel/flight-budget:latest
```

---

## Testing Different Platforms Locally

### Option 1: QEMU Emulation
```bash
# Run x86_64 image on Mac ARM (emulated)
docker pull ryakel/flight-budget:latest --platform linux/amd64
docker run -d -p 8181:80 --platform linux/amd64 ryakel/flight-budget:latest
```

### Option 2: Use Cloud VMs
- AWS EC2 (t3.micro free tier) for amd64 testing
- Oracle Cloud (free ARM instances) for arm64 testing

### Option 3: Raspberry Pi

---

## Advanced: Custom Dockerfile Per Platform

If you need platform-specific optimizations:

```dockerfile
FROM --platform=$BUILDPLATFORM nginx:alpine

ARG TARGETPLATFORM
ARG BUILDPLATFORM

RUN echo "Building on $BUILDPLATFORM for $TARGETPLATFORM"

# Platform-specific logic
RUN case "$TARGETPLATFORM" in \
    "linux/amd64")  echo "x86_64 optimizations" ;; \
    "linux/arm64")  echo "ARM64 optimizations" ;; \
    esac
```

---

## Best Practices

### For Local Development
1. ✅ Build single platform (native): `--platform linux/arm64 --load`
2. ✅ Test functionality thoroughly
3. ✅ Push to development branch
4. ✅ Let GitHub Actions build multi-platform

### For Production
1. ✅ Use GitHub Actions for multi-platform builds
2. ✅ Test on actual target platforms when possible
3. ✅ Monitor image sizes per platform
4. ✅ Use semantic versioning via commit messages

### Build Performance
1. ✅ Use build cache (`--cache-from`, `--cache-to`)
2. ✅ Build only needed platforms locally
3. ✅ Use `.dockerignore` to exclude unnecessary files
4. ✅ Order Dockerfile commands from least to most frequently changed

---

## Monitoring Build Performance

### Check Build Time
```bash
time docker buildx build \
  --platform linux/arm64 \
  -t ryakel/flight-budget:test \
  -f infrastructure/Dockerfile \
  --load \
  .
```

### Check Image Size Per Platform
```bash
# After pushing
docker buildx imagetools inspect ryakel/flight-budget:latest | grep -A 3 "Platform"
```

### Expected Image Sizes
- **amd64**: ~35-40 MB
- **arm64**: ~35-40 MB

---

## Summary

### Quick Setup
```bash
# One-time setup
docker buildx create --name multiarch --use
docker buildx inspect multiarch --bootstrap

# Local testing (fast, native)
docker buildx build --platform linux/arm64 -t test -f infrastructure/Dockerfile --load .

# Production (use GitHub Actions, not local)
git commit -m "feat: new feature"
git push origin main
# GitHub Actions builds all platforms automatically
```

### Platform Support
- ✅ **linux/amd64** - Most servers
- ✅ **linux/arm64** - Apple Silicon, modern ARM
- ❌ **linux/386** - Not needed (rare)

---

**Last Updated**: 2025-11-27
**Tested On**: Mac ARM (M-series)
**Docker Version**: 24.0+
**Buildx Version**: 0.12+
