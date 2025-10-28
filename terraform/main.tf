# Provider Configuration
# Specifies the AWS provider and region for Terraform to manage resources in.
provider "aws" {
  region = "us-east-1"
}


module "vpc" {
  source              = "./modules/vpc"
}


# Security
module "security" {
  source = "./modules/security"
  vpc_id = module.vpc.vpc_id
}

# Database Subnet Group
module "subnet_group" {
  source     = "./modules/subnet_group"
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

# EC2
module "ec2" {
  source        = "./modules/ec2"
  db_endpoint = module.rds.db_endpoint
  public_subnet_id = module.vpc.public_subnet_id
  db_username = var.db_username
  db_password = var.db_password
  db_name = var.db_name
  key_name    = var.key_name
  ec2_sg_id   = module.security.ec2_sg_id
}


# Outputs
# Outputs the public IP of the EC2 instance and the RDS endpoint.

output "ec2_public_ip" {
  value = module.ec2.public_ip
}

output "rds_endpoint" {
  value = module.rds.db_endpoint
}
