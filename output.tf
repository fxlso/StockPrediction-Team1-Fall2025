# Outputs
# Outputs the public IP of the EC2 instance and the RDS endpoint.

output "ec2_public_ip" {
  value = aws_instance.wordpress_ec2.public_ip
}

output "rds_endpoint" {
  value = aws_db_instance.wordpress_db.endpoint
}