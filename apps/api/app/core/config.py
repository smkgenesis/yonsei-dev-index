from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Yonsei Dev Index API"
    app_env: str = "development"
    app_secret_key: str = "change-me"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/ysdevidx"
    app_web_url: str = "http://localhost:3000"
    session_cookie_domain: str = "localhost"
    session_cookie_name: str = "ysdi_session"
    session_cookie_secure: bool = False
    session_cookie_same_site: str = "lax"
    session_ttl_days: int = 30
    oauth_state_cookie_name: str = "ysdi_oauth_state"
    github_client_id: str = ""
    github_client_secret: str = ""
    github_callback_url: str = "http://localhost:8000/api/v1/auth/github/callback"
    github_oauth_authorize_url: str = "https://github.com/login/oauth/authorize"
    github_oauth_token_url: str = "https://github.com/login/oauth/access_token"
    github_api_user_url: str = "https://api.github.com/user"
    github_oauth_scope: str = "read:user"
    email_from: str = "no-reply@ysdevidx.com"
    email_provider_api_key: str = ""
    verification_code_ttl_minutes: int = 10
    verification_max_attempts: int = 5
    verification_request_cooldown_seconds: int = 60
    verification_request_max_per_day: int = 5
    profile_update_max_per_day: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore",
    )


settings = Settings()
