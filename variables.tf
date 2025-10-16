variable "db_username" {
	type = string
	sensitive = true
}

variable "db_name" {
	type = string
	sensitive = true
}

variable "db_password" {
	type = string
	sensitive = true
}

variable "aws_key_name" {
	type = string
	sensitive = true
}

variable "db_instance_type" {
	type = string
}

variable "ec2_instance_type" {
	type = string
}