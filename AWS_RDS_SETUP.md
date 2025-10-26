# AWS RDS Setup Guide

This guide will help you set up and connect AWS RDS PostgreSQL database to your application.

## Prerequisites

- AWS Account
- AWS CLI configured (optional)
- Knowledge of AWS RDS

## Step 1: Create AWS RDS PostgreSQL Instance

### Option A: Using AWS Console

1. **Go to RDS Dashboard**
   - Sign in to AWS Console
   - Navigate to RDS service

2. **Create Database**
   - Click "Create Database"
   - Choose "Create Database"

3. **Configure Database**
   - **Engine**: PostgreSQL (version 15 or later recommended)
   - **Template**: Free tier (for testing) or Production
   - **DB Instance Identifier**: `oneprocentclub-db`
   - **Master Username**: Choose a username (e.g., `admin`)
   - **Master Password**: Create a strong password (save it!)
   
4. **Instance Configuration**
   - **Instance Size**: t3.micro (free tier) or larger
   - **Storage**: 20 GB (free tier) or more
   - **Storage Type**: General Purpose (SSD)

5. **Networking**
   - **VPC**: Default VPC (or create new)
   - **Public Access**: Yes (for development)
   - **Security Group**: Create new or use existing
     - Add inbound rule: PostgreSQL (port 5432) from your IP

6. **Database Authentication**
   - Choose: Password authentication

7. **Review and Create**
   - Review configuration
   - Click "Create Database"
   - Wait for database to become available (5-15 minutes)

### Option B: Using AWS CLI

```bash
aws rds create-db-instance \
  --db-instance-identifier oneprocentclub-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password YourStrongPassword \
  --allocated-storage 20 \
  --publicly-accessible
```

## Step 2: Configure Security Group

1. **Go to EC2 Console** → Security Groups
2. **Find your RDS security group**
3. **Add Inbound Rule**:
   - Type: PostgreSQL
   - Protocol: TCP
   - Port: 5432
   - Source: Your IP address (use `0.0.0.0/0` for testing, restrict in production)

## Step 3: Get Connection Details

After database is created:

1. **Endpoint**: Look like `oneprocentclub-db.xxxxx.us-east-1.rds.amazonaws.com`
2. **Port**: 5432
3. **Database Name**: `postgres` (or your custom name)
4. **Username**: The master username you chose
5. **Password**: The password you created

## Step 4: Configure Application

1. **Copy environment variables**:
   ```bash
   cp env.example .env.local
   ```

2. **Update `.env.local`** with your RDS credentials:
   ```bash
   # AWS RDS Database Configuration
   DB_HOST=oneprocentclub-db.xxxxx.us-east-1.rds.amazonaws.com
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=admin
   DB_PASSWORD=YourStrongPassword
   DB_SSL=true
   ```

3. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

4. **Install tsx** (for running migrations):
   ```bash
   npm install --save-dev tsx
   ```

## Step 5: Run Database Migration

1. **Test connection**:
   ```bash
   npm run db:test
   ```
   Should output: `✅ Database connection successful!`

2. **Create tables**:
   ```bash
   npm run db:migrate
   ```
   Should output: `Migration completed successfully!`

## Step 6: Verify Setup

Connect to your database and verify tables were created:

```bash
# Using psql (if installed)
psql -h your-endpoint.rds.amazonaws.com -U admin -d postgres

# Once connected:
\dt
```

You should see the `users` table.

## Step 7: Test User Registration

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Go to signup page** and create a new account

3. **Check database** for the new user:
   ```sql
   SELECT * FROM users;
   ```

## Troubleshooting

### Connection Timeout
- Check security group allows connections from your IP
- Verify DB instance is publicly accessible
- Check RDS endpoint is correct

### Authentication Failed
- Verify username and password are correct
- Check master username is correct (often `postgres`)

### SSL Connection Error
- Set `DB_SSL=false` for testing
- For production, use proper SSL certificates

### Migration Fails
- Ensure database user has CREATE TABLE permission
- Verify database exists
- Check connection details

## Production Considerations

### 1. Security
- [ ] Use private subnets for database
- [ ] Enable encryption at rest
- [ ] Use SSL/TLS connections only
- [ ] Rotate passwords regularly
- [ ] Use IAM database authentication (advanced)

### 2. Backup
- [ ] Enable automated backups
- [ ] Set backup retention period
- [ ] Test restore procedures

### 3. Monitoring
- [ ] Enable CloudWatch monitoring
- [ ] Set up alerting for CPU, memory, storage
- [ ] Monitor connection count

### 4. Scaling
- [ ] Plan for read replicas
- [ ] Configure Multi-AZ for high availability
- [ ] Monitor and adjust instance size

## Environment Variables Reference

```bash
# Required
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=postgres
DB_USER=<username>
DB_PASSWORD=<password>

# Optional
DB_SSL=true  # Use SSL for production
```

## Commands Reference

```bash
# Test database connection
npm run db:test

# Run migration (create tables)
npm run db:migrate

# Start development server
npm run dev
```

## Next Steps

1. ✅ Database is set up
2. ✅ Tables are created
3. ✅ Connection is working
4. 🔄 Start developing features
5. 🔄 Add more tables as needed
6. 🔄 Set up monitoring and alerts
7. 🔄 Plan for production deployment

## Resources

- [AWS RDS Documentation](https://docs.aws.amazon.com/rds/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg (Node.js PostgreSQL client)](https://node-postgres.com/)

## Support

If you encounter issues:
1. Check AWS RDS console for errors
2. Review security group settings
3. Test connection with `npm run db:test`
4. Check database logs in CloudWatch

