# Use minimal Python 3.11 image (Debian-based)
FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer issues
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /workspace

# Install build tools, LibreOffice, and Fonts in a single layer for optimization
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libreoffice \
    fontconfig \
    fonts-liberation \
    fonts-freefont-ttf \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files into the container
COPY . .

# Create a non-root user for security and assign ownership
RUN useradd -m api_user && chown -R api_user:api_user /workspace
USER api_user

# Expose API port
EXPOSE 8000

# Start command
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]