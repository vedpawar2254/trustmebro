# trustmebro Backend API

FastAPI backend for trustmebro freelance platform.

## Features

- **FastAPI Framework**: Modern, fast Python web framework
- **SQLAlchemy ORM**: PostgreSQL database with ORM
- **JWT Authentication**: Secure token-based authentication
- **CORS Support**: Cross-origin resource sharing
- **Pydantic Validation**: Request/response validation
- **Database Migrations**: Alembic support
- **File Upload Support**: Multipart form handling
- **Logging**: Structured logging configuration

## Installation

### Using Poetry (Recommended)

```bash
cd backend
poetry install
```

### Using pip

```bash
cd backend
pip install -r requirements.txt
```

## Configuration

1. Copy `.env.example` to `.env`
2. Fill in your configuration:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/trustmebro
JWT_SECRET_KEY=your-secret-key-change-in-production-min-32-chars
```

## Running

### Development

```bash
poetry run uvicorn src.main:app --reload --host 0.0.0.0 --port 3001
```

### Production

```bash
poetry run uvicorn src.main:app --host 0.0.0.0 --port 3001
```

## API Endpoints

### Authentication

#### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123",
  "role": "employer"
}
```

**Response (201):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "employer",
    "pfi_score": 100.0
  }
}
```

**Errors:**
- `400`: Invalid input (weak password, invalid email)
- `409`: Email already registered
- `500`: Server error

#### POST /auth/login
Authenticate a user and return JWT token.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "employer",
    "pfi_score": 100.0
  }
}
```

**Errors:**
- `400`: Missing email or password
- `401`: Invalid credentials
- `500`: Server error

#### GET /users/me
Get current user information.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "employer",
  "pfi_score": 100.0
}
```

**Errors:**
- `401`: Invalid or missing authentication token
- `404`: User not found
- `500`: Server error

### Health Check

#### GET /health
Health check endpoint.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-03-14T00:00:00Z"
}
```

## Database

### PostgreSQL Setup

1. Install PostgreSQL:
```bash
brew install postgresql  # macOS
sudo apt-get install postgresql  # Ubuntu
```

2. Create database:
```sql
CREATE DATABASE trustmebro;
CREATE USER trustmebro WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE trustmebro TO trustmebro;
```

3. Run migrations (coming soon):
```bash
poetry run alembic upgrade head
```

### Models

- **User**: Users with roles (employer/freelancer) and PFI scores
- **Job**: Jobs with gig types, budgets, and statuses
- **JobSpec**: Job specifications with milestones
- **Bid**: Freelancer bids on jobs
- **Escrow**: Payment escrow tracking
- **Submission**: Work submissions with verification reports
- **ChatChannel**: Chat channels for projects
- **ChangeRequest**: Change requests for scope changes

## Architecture

```
backend/
├── src/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── database.py           # Database connection
│   ├── auth.py              # JWT authentication
│   ├── models.py             # SQLAlchemy models
│   ├── routes/               # API routes (coming soon)
│   └── utils/               # Utilities (coming soon)
├── alembic/                # Database migrations (coming soon)
├── pyproject.toml          # Poetry configuration
├── requirements.txt         # pip requirements
└── .env.example           # Environment template
```

## Development

### Code Style

- Use `black` for formatting
- Use `ruff` for linting
- Use `mypy` for type checking

```bash
poetry run black src/
poetry run ruff check src/
poetry run mypy src/
```

### Testing

```bash
poetry run pytest
```

## Error Handling

All errors return structured JSON responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Invalid request data |
| `AUTH_ERROR` | Authentication failed |
| `NOT_FOUND` | Resource not found |
| `INTERNAL_ERROR` | Server error |

## Logging

Logs are written to stdout with consistent formatting:

```
2024-03-14 12:00:00 - api - INFO - Starting backend API...
2024-03-14 12:00:01 - api - INFO - Server URL: http://0.0.0.0:3001
2024-03-14 12:00:02 - api - INFO - Registration attempt: john@example.com
```

## License

MIT
