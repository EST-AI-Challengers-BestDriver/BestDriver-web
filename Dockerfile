# syntax=docker/dockerfile:1

FROM python:3.14-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update \
    && apt-get install --no-install-recommends -y libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 ecoroute \
    && useradd --system --uid 1001 --gid ecoroute --home-dir /app ecoroute \
    && chown ecoroute:ecoroute /app

COPY requirements.txt ./
RUN python -m pip install --no-cache-dir --upgrade pip \
    && python -m pip install --no-cache-dir -r requirements.txt

COPY --chown=ecoroute:ecoroute . .

USER ecoroute
EXPOSE 3000

CMD ["python", "serve_demo.py", "--host", "0.0.0.0", "--port", "3000", "--no-browser"]
