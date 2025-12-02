# Docker Build Fixes

## Issues Resolved

### Issue 1: `.dockerignore` Excluding Required Files ❌

**Problem:**
```
ERROR: failed to compute cache key: "/infrastructure/nginx/nginx.conf": not found
```

**Root Cause:**
The `.dockerignore` file was excluding the entire `infrastructure/` folder:
```
infrastructure/
```

But the Dockerfile needed `infrastructure/nginx/nginx.conf`:
```dockerfile
COPY infrastructure/nginx/nginx.conf /etc/nginx/conf.d/default.conf
```

**Fix:**
Changed `.dockerignore` to be more specific - exclude only unnecessary files, not the entire folder:

```diff
- # Infrastructure folder (copied specifically in Dockerfile)
- infrastructure/
+ # Infrastructure files (exclude everything except nginx config)
+ infrastructure/docker-compose.yml
+ infrastructure/Dockerfile
+ infrastructure/.env*
```

Now `infrastructure/nginx/` directory is included in the build context.

---

### Issue 2: File Permissions Causing 403 Forbidden ❌

**Problem:**
Container built successfully but returned:
```
HTTP/1.1 403 Forbidden
```

**Root Cause:**
Local files had restrictive permissions (600):
```bash
-rw-------  1 rkelch  staff  16644 Nov 27 16:43 index.html
```

These permissions were copied into the Docker image, preventing nginx from reading the files.

**Fix:**
Added permission correction in Dockerfile after copying files:

```dockerfile
# Copy application files
COPY app/ /usr/share/nginx/html/

# Set proper permissions for web content
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} \; && \
    find /usr/share/nginx/html -type f -exec chmod 644 {} \; && \
    chown -R nginx:nginx /usr/share/nginx/html
```

This ensures:
- Directories: `755` (rwxr-xr-x) - readable/executable by nginx
- Files: `644` (rw-r--r--) - readable by nginx
- Owner: `nginx:nginx` - owned by nginx user

---

### Issue 3: Non-Root User Preventing nginx Startup ❌

**Problem:**
Initial attempt to run as non-root user failed:
```
nginx: [emerg] open() "/etc/nginx/conf.d/default.conf" failed (13: Permission denied)
```

**Root Cause:**
Dockerfile had:
```dockerfile
USER nginx
CMD ["nginx", "-g", "daemon off;"]
```

nginx needs to start as root to bind to port 80 and read configuration files. It then automatically drops privileges for worker processes.

**Fix:**
Removed the `USER nginx` directive:

```dockerfile
# Start nginx (runs as root, worker processes run as nginx user)
CMD ["nginx", "-g", "daemon off;"]
```

nginx runs as root for initialization but worker processes run as the nginx user (defined in nginx.conf).

---

## Multi-Architecture Build Setup

### Mac ARM Requirements

Since you're building on Mac ARM (M1/M2/M3) but need to support multiple architectures, use Docker Buildx.

### Initial Setup (One-Time)

```bash
# Create builder instance
docker buildx create --name multiarch --driver docker-container --use

# Bootstrap (downloads QEMU emulators)
docker buildx inspect multiarch --bootstrap

# Verify
docker buildx ls
```

### Build Commands

**Local Testing (Fast - Native ARM64):**
```bash
docker buildx build \
  --platform linux/arm64 \
  -t ryakel/flight-budget:test \
  -f infrastructure/Dockerfile \
  --load \
  .
```

**Multi-Platform Build (Slower - Includes x86_64, ARM64, ARMv7):**
```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ryakel/flight-budget:latest \
  -f infrastructure/Dockerfile \
  --push \
  .
```

**Note:** Multi-platform builds require `--push` to Docker Hub. They cannot be loaded locally with `--load`.

---

## Files Modified

### 1. `.dockerignore`
**Before:**
```
infrastructure/
```

**After:**
```
infrastructure/docker-compose.yml
infrastructure/Dockerfile
infrastructure/.env*
```

### 2. `infrastructure/Dockerfile`
**Added:**
```dockerfile
# Set proper permissions for web content
RUN find /usr/share/nginx/html -type d -exec chmod 755 {} \; && \
    find /usr/share/nginx/html -type f -exec chmod 644 {} \; && \
    chown -R nginx:nginx /usr/share/nginx/html
```

**Removed:**
```dockerfile
USER nginx  # Removed - nginx needs root to start
```

---

## Verification Results

### ✅ Build Succeeded
```
[12/12] exporting to image
naming to docker.io/ryakel/flight-budget:test done
```

### ✅ Container Runs Successfully
```
CONTAINER ID   STATUS                   PORTS
e95208d18bef   Up 7 seconds (healthy)   0.0.0.0:8181->80/tcp
```

### ✅ Application Accessible
```
HTTP/1.1 200 OK
Server: nginx/1.29.3
Content-Type: text/html
Content-Length: 16644
```

### ✅ Optimal Image Size
- **Compressed:** 24.1 MB (on Docker Hub)
- **On Disk:** 85 MB
- **Base:** nginx:alpine (~25MB)

---

## Testing Checklist

- [x] Docker build completes without errors
- [x] Container starts successfully
- [x] nginx process runs as root with worker processes as nginx user
- [x] HTTP 200 OK response received
- [x] index.html loads correctly
- [x] Health check passes
- [x] Image size is optimal (~24MB compressed)
- [x] File permissions are correct (644 for files, 755 for dirs)
- [x] Owner is nginx:nginx

---

## Next Steps

### 1. **Push to GitHub** ✅ Ready
All issues resolved. Code is ready to push.

```bash
git add .
git commit -m "fix: resolve Docker build issues with .dockerignore and file permissions"
git push origin main
```

### 2. **GitHub Actions Will Build Multi-Platform** ✅ Ready
Once pushed, GitHub Actions will automatically:
- Build for linux/amd64, linux/arm64
- Push to Docker Hub
- Create semantic version tag
- Generate GitHub release

### 3. **Local Multi-Platform Testing** (Optional)
See [LOCAL_MULTI_ARCH_BUILD.md](LOCAL_MULTI_ARCH_BUILD.md) for details.

---

## Lessons Learned

### 1. `.dockerignore` Specificity
- ❌ Don't exclude entire folders needed by Dockerfile
- ✅ Be specific about what to exclude
- ✅ Test build locally before pushing

### 2. File Permissions in Containers
- ❌ Don't rely on host file permissions
- ✅ Explicitly set permissions in Dockerfile
- ✅ Use `find` with `chmod` to recursively fix permissions

### 3. Docker USER Directive
- ❌ Don't use `USER nginx` before starting nginx
- ✅ Let nginx run as root (worker processes still run as nginx)
- ✅ nginx automatically drops privileges for security

### 4. Multi-Platform Builds
- ✅ Use GitHub Actions for production multi-platform builds
- ✅ Use local buildx for testing (single platform with `--load`)
- ✅ Multi-platform requires `--push`, cannot use `--load`

---

## Documentation Created

1. **[LOCAL_MULTI_ARCH_BUILD.md](LOCAL_MULTI_ARCH_BUILD.md)** - Guide for building multi-architecture images on Mac ARM
2. **[PRE_DEPLOYMENT_CHECKLIST.md](PRE_DEPLOYMENT_CHECKLIST.md)** - Updated with buildx commands
3. **[DOCKER_BUILD_FIXES.md](DOCKER_BUILD_FIXES.md)** - This document

---

**Status**: ✅ All issues resolved
**Build Time**: ~5 seconds (cached)
**Image Size**: 24.1 MB (compressed)
**Ready for**: Production deployment
**Date**: 2025-11-27
