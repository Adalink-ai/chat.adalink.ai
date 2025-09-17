#!/bin/bash

# Apply database indexes for performance optimization
# Alternative script if the TypeScript version doesn't work

set -e  # Exit on error

echo "🚀 Starting database index optimization (Shell version)..."

# Check if POSTGRES_URL is set
if [ -z "$POSTGRES_URL" ]; then
    echo "❌ POSTGRES_URL environment variable is not set"
    exit 1
fi

echo "📍 Database URL: $(echo $POSTGRES_URL | cut -d'@' -f2)"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql command not found. Please install PostgreSQL client tools."
    exit 1
fi

# Path to the SQL file
SQL_FILE="lib/db/indexes.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL file not found: $SQL_FILE"
    exit 1
fi

echo "📊 Applying indexes from $SQL_FILE"
echo ""

# Execute the SQL file
echo "⏳ Executing SQL statements..."

# Use psql to execute the file, ignoring duplicate index errors
psql "$POSTGRES_URL" -f "$SQL_FILE" -v ON_ERROR_STOP=0 2>&1 | while IFS= read -r line; do
    if [[ "$line" == *"already exists"* ]]; then
        echo "⚠️  $line"
    elif [[ "$line" == *"ERROR"* ]]; then
        echo "❌ $line"
    elif [[ "$line" == *"CREATE INDEX"* ]]; then
        echo "✅ $line"
    else
        echo "   $line"
    fi
done

echo ""
echo "📈 Updating table statistics..."
psql "$POSTGRES_URL" -c "ANALYZE \"Message_v2\", \"Chat\", \"User\", \"Stream\";" 2>/dev/null && echo "✅ Statistics updated" || echo "⚠️  Statistics update failed"

echo ""
echo "🎉 Database optimization script completed!"
echo ""
echo "💡 Expected improvements:"
echo "   • Query times should reduce from ~250ms to ~50ms"
echo "   • Message count queries will be much faster"
echo "   • Chat retrieval will be optimized"
echo ""
echo "🔧 Usage examples:"
echo "   npm run optimize-db     # Run TypeScript version"
echo "   chmod +x scripts/apply-indexes.sh && ./scripts/apply-indexes.sh  # Run this shell version"