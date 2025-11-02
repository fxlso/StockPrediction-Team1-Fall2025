locals {
  base_url = trimsuffix(var.redirect_base_url, "/")
  callback = "${local.base_url}${var.callback_path}"
}

resource "aws_cognito_user_pool" "pool" {
  name                     = "simple-users"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]
}

resource "aws_cognito_user_pool_domain" "domain" {
  domain       = var.cognito_domain_prefix
  user_pool_id = aws_cognito_user_pool.pool.id
}

resource "aws_cognito_user_pool_client" "client" {
  name                                 = "stock-client"
  user_pool_id                         = aws_cognito_user_pool.pool.id
  generate_secret                      = true
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code"]
  allowed_oauth_scopes                 = ["openid", "email", "profile"]
  supported_identity_providers         = ["COGNITO"]
  callback_urls                        = [local.callback]
  prevent_user_existence_errors        = "ENABLED"
  enable_token_revocation              = true
}
