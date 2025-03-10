#!/bin/bash

# Navigate to the frontend directory
cd "$(dirname "$0")/.."

# Generate the Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Check if the generation was successful
if [ $? -eq 0 ]; then
  echo "Prisma client generated successfully!"
else
  echo "Failed to generate Prisma client."
  exit 1
fi

echo "Done!" 