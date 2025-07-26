#!/bin/bash

# Database initialization script for TaskFlow
# This script runs automatically when PostgreSQL container starts

set -e

echo "🚀 Starting TaskFlow Database Initialization..."

# Wait for PostgreSQL to be ready
until pg_isready -U postgres; do
  echo "⏳ Waiting for PostgreSQL to be ready..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Check if database exists
if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw taskflow; then
    echo "📊 Database 'taskflow' already exists"
else
    echo "📊 Creating database 'taskflow'..."
    createdb -U postgres taskflow
    echo "✅ Database 'taskflow' created successfully"
fi

# Check if schema is already initialized
if psql -U postgres -d taskflow -c "\dt" | grep -q users; then
    echo "📋 Database schema already exists"
else
    echo "📋 Initializing database schema..."
    psql -U postgres -d taskflow -f /docker-entrypoint-initdb.d/schema.sql
    echo "✅ Database schema initialized successfully"
fi

# Run migrations to ensure schema is up to date
echo "🔄 Running database migrations..."
psql -U postgres -d taskflow -f /docker-entrypoint-initdb.d/migrations.sql
echo "✅ Database migrations completed"

# Check if initial data exists
if psql -U postgres -d taskflow -c "SELECT COUNT(*) FROM tenants;" | grep -q "0"; then
    echo "📝 Creating initial data..."
    psql -U postgres -d taskflow -f /docker-entrypoint-initdb.d/seed.sql
    echo "✅ Initial data created successfully"
else
    echo "📝 Initial data already exists"
fi

echo "🎉 TaskFlow Database Initialization Complete!"
echo "📊 Database: taskflow"
echo "🔗 Host: localhost"
echo "🚪 Port: 5432"
echo "👤 User: postgres" 