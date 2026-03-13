"""GitHub API client wrapper for repository operations."""
from typing import Optional, List, Dict, Any

from github import Github, GithubException, Repository, ContentFile

from src.config import settings
from src.utils.logger import verification_logger


class GitHubClient:
    """Wrapper for GitHub API with error handling."""

    def __init__(self):
        """Initialize GitHub client."""
        self.client = Github(settings.github_token)
        verification_logger.info("GitHub client initialized")

    def get_repository(self, repo_url: str) -> Optional[Repository]:
        """Get a GitHub repository from URL.

        Args:
            repo_url: GitHub repository URL (e.g., https://github.com/user/repo)

        Returns:
            Repository object or None if not found

        Raises:
            Exception: If repository access fails
        """
        try:
            # Extract owner and repo name from URL
            if not repo_url.startswith("https://github.com/"):
                raise ValueError(f"Invalid GitHub URL: {repo_url}")

            parts = repo_url.rstrip("/").split("/")
            if len(parts) < 2:
                raise ValueError(f"Invalid GitHub URL: {repo_url}")

            owner, repo_name = parts[-2], parts[-1]

            verification_logger.debug(f"Fetching repository: {owner}/{repo_name}")
            repo = self.client.get_repo(f"{owner}/{repo_name}")

            return repo

        except GithubException as e:
            verification_logger.error(f"GitHub API error: {e}")
            if "Not Found" in str(e):
                return None
            raise Exception(f"Failed to access repository: {str(e)}") from e
        except Exception as e:
            verification_logger.error(f"Unexpected error accessing GitHub: {e}")
            raise Exception(f"Failed to access GitHub: {str(e)}") from e

    def get_file_content(
        self,
        repo_url: str,
        file_path: str,
        branch: str = "main",
    ) -> Optional[str]:
        """Get file content from a GitHub repository.

        Args:
            repo_url: GitHub repository URL
            file_path: Path to file within repository
            branch: Git branch (default: main)

        Returns:
            File content as decoded string or None if not found

        Raises:
            Exception: If file access fails
        """
        try:
            repo = self.get_repository(repo_url)
            if not repo:
                return None

            verification_logger.debug(f"Fetching file: {file_path} from {repo.name}")

            # Get file content
            content_file: ContentFile = repo.get_contents(file_path, ref=branch)

            if not content_file or content_file.size > 1000000:  # 1MB limit
                verification_logger.warning(f"File too large to fetch: {file_path}")
                return None

            # Decode content (GitHub returns base64)
            file_content = content_file.decoded_content.decode("utf-8")

            return file_content

        except GithubException as e:
            verification_logger.error(f"GitHub API error fetching file: {e}")
            if "Not Found" in str(e):
                return None
            raise Exception(f"Failed to fetch file: {str(e)}") from e
        except Exception as e:
            verification_logger.error(f"Unexpected error fetching file: {e}")
            raise Exception(f"Failed to fetch file: {str(e)}") from e

    def clone_repository(self, repo_url: str, target_dir: str) -> bool:
        """Clone a GitHub repository to a local directory.

        Args:
            repo_url: GitHub repository URL
            target_dir: Local directory to clone to

        Returns:
            True if successful, False otherwise

        Raises:
            Exception: If cloning fails
        """
        try:
            from git import Repo

            verification_logger.info(f"Cloning repository: {repo_url} to {target_dir}")

            # Clone repository
            Repo.clone_from(repo_url, target_dir)

            verification_logger.info(f"Successfully cloned repository to {target_dir}")
            return True

        except ImportError:
            verification_logger.error("GitPython not installed")
            raise Exception("GitPython is required for cloning repositories")
        except Exception as e:
            verification_logger.error(f"Failed to clone repository: {e}")
            raise Exception(f"Failed to clone repository: {str(e)}") from e

    def get_commit_history(
        self,
        repo_url: str,
        since_date: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Get commit history for a repository.

        Args:
            repo_url: GitHub repository URL
            since_date: Optional ISO date string to filter from

        Returns:
            List of commit dictionaries with date and message

        Raises:
            Exception: If fetching history fails
        """
        try:
            repo = self.get_repository(repo_url)
            if not repo:
                return []

            verification_logger.debug(f"Fetching commit history for {repo.name}")

            commits = []
            for commit in repo.get_commits(since=since_date):
                commits.append(
                    {
                        "sha": commit.sha,
                        "date": commit.commit.author.date.isoformat() if commit.commit.author else None,
                        "message": commit.commit.message,
                        "author": commit.author.login if commit.author else None,
                    }
                )

            return commits

        except GithubException as e:
            verification_logger.error(f"GitHub API error fetching commits: {e}")
            raise Exception(f"Failed to fetch commit history: {str(e)}") from e
        except Exception as e:
            verification_logger.error(f"Unexpected error fetching commits: {e}")
            raise Exception(f"Failed to fetch commit history: {str(e)}") from e


# Singleton instance
github_client = GitHubClient()
