#!/usr/bin/env python3
"""
Schema Comparison Tool
Compares the current local schema with the complete-database-setup.sql file
"""

import re
import sys
from pathlib import Path

def extract_schema_elements(sql_content):
    """Extract key schema elements from SQL content"""
    elements = {
        'tables': set(),
        'functions': set(),
        'indexes': set(),
        'policies': set(),
        'constraints': set(),
        'triggers': set()
    }
    
    # Extract table names
    table_matches = re.findall(r'CREATE TABLE (?:IF NOT EXISTS )?(?:public\.)?(\w+)', sql_content, re.IGNORECASE)
    elements['tables'] = set(table_matches)
    
    # Extract function names
    function_matches = re.findall(r'CREATE (?:OR REPLACE )?FUNCTION (?:public\.)?(\w+)\s*\(', sql_content, re.IGNORECASE)
    elements['functions'] = set(function_matches)
    
    # Extract index names
    index_matches = re.findall(r'CREATE (?:UNIQUE )?INDEX (?:IF NOT EXISTS )?(\w+)', sql_content, re.IGNORECASE)
    elements['indexes'] = set(index_matches)
    
    # Extract policy names
    policy_matches = re.findall(r'CREATE POLICY "([^"]+)"', sql_content, re.IGNORECASE)
    elements['policies'] = set(policy_matches)
    
    # Extract constraint names
    constraint_matches = re.findall(r'CONSTRAINT (\w+)', sql_content, re.IGNORECASE)
    elements['constraints'] = set(constraint_matches)
    
    # Extract trigger names
    trigger_matches = re.findall(r'CREATE TRIGGER (\w+)', sql_content, re.IGNORECASE)
    elements['triggers'] = set(trigger_matches)
    
    return elements

def compare_schemas(local_file, complete_file):
    """Compare two schema files and return differences"""
    
    # Read files
    try:
        with open(local_file, 'r') as f:
            local_content = f.read()
    except FileNotFoundError:
        print(f"❌ Error: {local_file} not found")
        return False
        
    try:
        with open(complete_file, 'r') as f:
            complete_content = f.read()
    except FileNotFoundError:
        print(f"❌ Error: {complete_file} not found")
        return False
    
    # Extract schema elements
    local_schema = extract_schema_elements(local_content)
    complete_schema = extract_schema_elements(complete_content)
    
    print("🔍 SCHEMA COMPARISON RESULTS")
    print("=" * 50)
    
    # Compare each element type
    differences_found = False
    
    for element_type in ['tables', 'functions', 'indexes', 'policies', 'constraints', 'triggers']:
        local_set = local_schema[element_type]
        complete_set = complete_schema[element_type]
        
        # Filter out system/internal elements for cleaner comparison
        if element_type == 'tables':
            local_set = {t for t in local_set if not t.startswith('_') and t not in ['extensions', 'tenants', 'schema_migrations']}
            complete_set = {t for t in complete_set if not t.startswith('_')}
        elif element_type == 'indexes':
            local_set = {i for i in local_set if i.startswith('idx_')}
            complete_set = {i for i in complete_set if i.startswith('idx_')}
        elif element_type == 'functions':
            # Filter out system functions
            local_set = {f for f in local_set if f not in ['get_auth']}
            
        only_in_local = local_set - complete_set
        only_in_complete = complete_set - local_set
        common = local_set & complete_set
        
        print(f"\n📊 {element_type.upper()}:")
        print(f"   Common: {len(common)} items")
        
        if only_in_local:
            print(f"   ⚠️  Only in LOCAL: {sorted(only_in_local)}")
            differences_found = True
            
        if only_in_complete:
            print(f"   ⚠️  Only in COMPLETE: {sorted(only_in_complete)}")
            differences_found = True
            
        if not only_in_local and not only_in_complete:
            print(f"   ✅ Perfect match!")
    
    print("\n" + "=" * 50)
    
    if differences_found:
        print("❌ SCHEMAS ARE DIFFERENT")
        print("\nRecommendations:")
        print("1. Check if missing elements in local are intentional")
        print("2. Consider updating complete-database-setup.sql if local has newer changes")
        print("3. Run migrations to sync schemas if needed")
    else:
        print("✅ SCHEMAS ARE IDENTICAL")
        print("Local schema matches complete-database-setup.sql perfectly!")
    
    return not differences_found

def main():
    """Main function"""
    script_dir = Path(__file__).parent
    local_file = script_dir / "current-local-schema.sql"
    complete_file = script_dir / "complete-database-setup.sql"
    
    print("🔄 Comparing Local Docker Supabase Schema with Complete Setup")
    print(f"Local schema: {local_file}")
    print(f"Complete setup: {complete_file}")
    print()
    
    schemas_match = compare_schemas(local_file, complete_file)
    
    if schemas_match:
        sys.exit(0)
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()
