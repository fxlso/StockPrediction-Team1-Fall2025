# DB Subnet Group
resource "aws_db_subnet_group" "stock_db_subnet_group" {
  name       = "stock_db_subnet_group"
  subnet_ids = [var.public_subnet_id, var.private_subnet_id]

  tags = {
    Name = "Stock DB Subnet Group"
  }
}
