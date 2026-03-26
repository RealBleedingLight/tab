FROM python:3.12-slim

WORKDIR /app

# Copy both packages
COPY gp2tab /app/gp2tab
COPY guitar-teacher /app/guitar-teacher

# Install
RUN pip install --no-cache-dir /app/gp2tab "/app/guitar-teacher[api,llm]"

# Run
ENV GUITAR_TEACHER_THEORY_DIR=/app/guitar-teacher/theory
ENV PORT=8000
EXPOSE 8000
CMD ["uvicorn", "guitar_teacher.api.app:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
