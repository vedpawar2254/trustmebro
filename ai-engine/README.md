# trustmebro AI Engine

AI-powered verification engine for the trustmebro freelance platform.

## Features

- **Modular Verification Lanes**: Separate lanes for different gig types (Software, Copywriting, Data Entry, Translation)
- **OpenRouter Integration**: GPT-4o/4o-mini LLM for feature verification and analysis
- **GitHub API**: Repository analysis and structure verification
- **Plagiarism Detection**: Placeholder for plagiarism API integration
- **Scoring System**: Automatic score calculation and payment decision
- **Error Handling**: Comprehensive logging and error management

## Installation

### Using Poetry (Recommended)

```bash
cd ai-engine
poetry install
```

### Using pip

```bash
cd ai-engine
pip install -r requirements.txt
```

## Configuration

1. Copy `.env.example` to `.env`
2. Fill in your API keys:

```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
GITHUB_TOKEN=your_github_token_here
```

## Running

### Development

```bash
poetry run uvicorn src.main:app --reload --host 0.0.0.0 --port 3002
```

### Production

```bash
poetry run uvicorn src.main:app --host 0.0.0.0 --port 3002
```

## API Endpoints

### GET /
Root endpoint with server info

### GET /health
Health check endpoint

### POST /verify
Verify a submission and generate verification report

**Request Body:**
```json
{
  "milestone_id": "m1",
  "job_id": "job_123",
  "submission": {
    "gig_type": "SOFTWARE",
    "github_url": "https://github.com/user/repo"
  },
  "criteria": [
    {
      "name": "Repo Structure",
      "type": "PRIMARY",
      "weight": 0.1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "milestone_id": "m1",
    "gig_type": "SOFTWARE",
    "gig_subtype": "WEB_DEVELOPMENT",
    "overall_score": 72,
    "payment_decision": "HOLD",
    "criteria": [...],
    "pfi_signals": [...],
    "resubmissions_remaining": 2,
    "feedback_for_freelancer": "Improve README and add tests",
    "verification_lane": "SoftwareLane"
  }
}
```

## Architecture

```
ai-engine/
├── src/
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration management
│   ├── lanes/               # Verification lanes
│   │   ├── base.py         # Abstract base class
│   │   ├── software.py     # Software verification
│   │   └── router.py       # Lane router
│   └── utils/              # Utilities
│       ├── logger.py        # Logging configuration
│       ├── openai_client.py # OpenAI wrapper
│       └── github_client.py # GitHub wrapper
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

## Supported Gig Types

- SOFTWARE: Code repositories (GitHub links)
- TODO: COPYWRITING: Documents, text content
- TODO: DATA_ENTRY: CSV, XLSX files
- TODO: TRANSLATION: Source/target documents

## Error Handling

All errors are logged and return structured JSON responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Logging

Logs are written to stdout with consistent formatting:

```
2024-03-14 12:00:00 - verification - INFO - Verifying milestone: m1
2024-03-14 12:00:01 - verification - INFO - Verification complete: score=72, decision=HOLD
```

## License

MIT
