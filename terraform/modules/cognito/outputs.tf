output "client_id" {
  description = "Cognito app client ID"
  value       = aws_cognito_user_pool_client.client.id
}

output "client_secret" {
  description = "Cognito app client secret (sensitive)"
  value       = aws_cognito_user_pool_client.client.client_secret
  sensitive   = true
}

output "issuer" {
  description = "OIDC issuer URL for discovery"
  value       = "https://${aws_cognito_user_pool_domain.domain.domain}.auth.us-east-1.amazoncognito.com"
}
