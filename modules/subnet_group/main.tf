# DB Subnet Group
resource "aws_db_subnet_group" "wordpress_db_subnet_group" {
  name       = "wordpress_db_subnet_group"
  subnet_ids = [var.public_subnet_id, var.private_subnet_id]

  tags = {
    Name = "WordPress DB Subnet Group"
  }
}
