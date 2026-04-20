export interface AppConfig {
  port: number;
  nodeEnv: string;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface DatabaseConfig {
  url: string;
}

export interface RedisConfig {
  host: string;
  port: number;
}
