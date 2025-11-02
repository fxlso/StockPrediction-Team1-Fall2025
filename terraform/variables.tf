variable "db_username" {
  description = "Database admin username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database admin password"
  type        = string
  sensitive   = true
}

variable "db_name" {
  description = "Name of the WordPress database"
  type        = string
  default     = "stockdb"
}

variable "key_name" {
  description = "SSH key name for EC2"
  type        = string
  sensitive   = true
}

variable "repo_url" {
  description = "Git repository URL for the application code"
  type        = string
}
