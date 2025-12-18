"""
Script to update the currentdbschema.md file with latest database schema.
Run this from the backend directory.
"""

import os
from supabase import create_client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Query for table columns
columns_query = """
SELECT 
    c.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM 
    information_schema.columns c
WHERE 
    c.table_schema = 'public'
    AND c.table_name NOT IN ('spatial_ref_sys')
ORDER BY 
    c.table_name, 
    c.ordinal_position;
"""

# Query for views
views_query = """
SELECT 
    table_name,
    view_definition
FROM 
    information_schema.views
WHERE 
    table_schema = 'public'
ORDER BY 
    table_name;
"""

try:
    # Fetch columns
    columns_result = supabase.rpc('exec_sql', {'query': columns_query}).execute()
    
    # Fetch views
    views_result = supabase.rpc('exec_sql', {'query': views_query}).execute()
    
    # Generate markdown
    markdown = "| table_name                 | column_name                 | data_type                | is_nullable | column_default     |\n"
    markdown += "| -------------------------- | --------------------------- | ------------------------ | ----------- | ------------------ |\n"
    
    for row in columns_result.data:
        table_name = (row['table_name'] or '').ljust(26)
        column_name = (row['column_name'] or '').ljust(27)
        data_type = (row['data_type'] or '').ljust(24)
        is_nullable = (row['is_nullable'] or '').ljust(11)
        column_default = (row['column_default'] or 'null').ljust(18)
        markdown += f"| {table_name} | {column_name} | {data_type} | {is_nullable} | {column_default} |\n"
    
    markdown += "\n\n\n\n## the views are\n"
    markdown += "| table_name                 | view_definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |\n"
    markdown += "| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |\n"
    
    for row in views_result.data:
        table_name = (row['table_name'] or '').ljust(26)
        view_def = row['view_definition'] or 'null'
        markdown += f"| {table_name} | {view_def[:1000]} |\n"
    
    # Write to file
    output_path = os.path.join(os.path.dirname(__file__), '..', 'currentdbschema.md')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(markdown)
    
    print(f"✓ Schema documentation updated successfully at: {output_path}")
    
except Exception as e:
    print(f"Error: {e}")
    print("\nAlternatively, run these queries directly in Supabase SQL Editor:")
    print("\n1. For columns:")
    print(columns_query)
    print("\n2. For views:")
    print(views_query)
