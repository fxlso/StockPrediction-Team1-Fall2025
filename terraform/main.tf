# Provider Configuration
# Specifies the AWS provider and region for Terraform to manage resources in.
provider "aws" {
  region = "us-east-1"
}


module "vpc" {
  source = "./modules/vpc"
}


# Security
module "security" {
  source = "./modules/security"
  vpc_id = module.vpc.vpc_id
}

# Database Subnet Group
module "subnet_group" {
  source            = "./modules/subnet_group"
  public_subnet_id  = module.vpc.public_subnet_id
  private_subnet_id = module.vpc.private_subnet_id
}

# RDS
module "rds" {
  source               = "./modules/rds"
  db_name              = var.db_name
  db_username          = var.db_username
  db_password          = var.db_password
  rds_sg_id            = module.security.rds_sg_id
  db_subnet_group_name = module.subnet_group.subnet_group_name
}


resource "aws_eip" "ec2_eip" {
  domain = "vpc"
}

module "cognito" {
  source                = "./modules/cognito"
  cognito_domain_prefix = "proj-ryan-demo-1234"
  redirect_base_url     = "https://${aws_eip.ec2_eip.public_dns}"
}


# EC2
module "ec2" {
  source             = "./modules/ec2"
  db_endpoint        = module.rds.db_endpoint
  public_subnet_id   = module.vpc.public_subnet_id
  db_username        = var.db_username
  db_password        = var.db_password
  db_name            = var.db_name
  key_name           = var.key_name
  ec2_sg_id          = module.security.ec2_sg_id
  app_url            = "https://${aws_eip.ec2_eip.public_dns}"
  auth_issuer        = module.cognito.issuer
  auth_client_id     = module.cognito.client_id
  auth_client_secret = module.cognito.client_secret
  repo_url           = var.repo_url
}

resource "aws_eip_association" "ec2_eip_assoc" {
  instance_id   = module.ec2.instance_id
  allocation_id = aws_eip.ec2_eip.id
}


# Outputs
# Outputs the public IP of the EC2 instance and the RDS endpoint.

output "ec2_public_ip" {
  value = module.ec2.public_ip
}

output "rds_endpoint" {
  value = module.rds.db_endpoint
}
