variable "cognito_domain_prefix" { type = string }
variable "redirect_base_url"     { type = string }
variable "callback_path" {
  type = string
  default = "/api/auth/callback"
}
