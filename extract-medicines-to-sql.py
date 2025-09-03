#!/usr/bin/env python3
"""
Extract medicines from JavaScript file and convert to SQL INSERT statements
This script processes the import_medicines_no_duplicates.mjs file and generates
comprehensive SQL INSERT statements for all medicines.
"""

import re
import json
from pathlib import Path

def extract_medicines_from_js():
    """Extract medicine objects from the JavaScript file"""
    
    js_file_path = Path('import_medicines_no_duplicates.mjs')
    if not js_file_path.exists():
        print(f"Error: {js_file_path} not found!")
        return []
    
    with open(js_file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find the medicines array
    medicines_match = re.search(r'const medicines = \[(.*?)\];', content, re.DOTALL)
    if not medicines_match:
        print("Could not find medicines array!")
        return []
    
    medicines_content = medicines_match.group(1)
    
    # Find the additionalMedicines array
    additional_match = re.search(r'const additionalMedicines = \[(.*?)\];', content, re.DOTALL)
    additional_content = additional_match.group(1) if additional_match else ""
    
    # Combine both arrays
    all_medicines_content = medicines_content
    if additional_content:
        all_medicines_content += "," + additional_content
    
    # Extract individual medicine objects
    medicine_objects = re.findall(r'\{([^}]+)\}', all_medicines_content)
    
    medicines = []
    for obj_content in medicine_objects:
        medicine = parse_medicine_object(obj_content)
        if medicine:
            medicines.append(medicine)
    
    return medicines

def parse_medicine_object(obj_content):
    """Parse a single medicine object from JavaScript"""
    
    medicine = {}
    
    # Extract fields using regex
    fields = [
        'name', 'generic_name', 'brand_names', 'category', 'subcategory', 
        'therapeutic_class', 'pharmacological_class', 'dosage_forms', 'strengths',
        'standard_dosage_adult', 'standard_dosage_pediatric', 'routes', 'frequencies',
        'indications', 'contraindications', 'side_effects', 'drug_interactions',
        'warnings', 'max_daily_dose', 'duration_guidelines', 'monitoring_requirements',
        'mechanism_of_action', 'pregnancy_category', 'controlled_substance',
        'prescription_required', 'search_keywords', 'synonyms', 'icd_codes'
    ]
    
    for field in fields:
        # Handle different field types
        if field in ['brand_names', 'dosage_forms', 'strengths', 'routes', 'frequencies', 
                     'indications', 'contraindications', 'side_effects', 'drug_interactions',
                     'warnings', 'monitoring_requirements', 'search_keywords', 'synonyms', 'icd_codes']:
            # Array fields
            pattern = f"{field}\\s*:\\s*\\[([^\\]]+)\\]"
            match = re.search(pattern, obj_content)
            if match:
                # Extract array items
                array_content = match.group(1)
                items = re.findall(r"'([^']+)'", array_content)
                medicine[field] = items
        elif field in ['controlled_substance', 'prescription_required']:
            # Boolean fields
            pattern = f"{field}\\s*:\\s*(true|false)"
            match = re.search(pattern, obj_content)
            if match:
                medicine[field] = match.group(1) == 'true'
        else:
            # String fields
            pattern = f"{field}\\s*:\\s*'([^']+)'"
            match = re.search(pattern, obj_content)
            if match:
                medicine[field] = match.group(1)
    
    return medicine if medicine.get('name') else None

def format_sql_array(arr):
    """Format Python array as PostgreSQL array"""
    if not arr:
        return 'NULL'
    
    # Escape single quotes in array items
    escaped_items = [item.replace("'", "''") for item in arr]
    formatted_items = "', '".join(escaped_items)
    return f"ARRAY['{formatted_items}']"

def format_sql_value(value):
    """Format a value for SQL"""
    if value is None:
        return 'NULL'
    elif isinstance(value, bool):
        return 'true' if value else 'false'
    elif isinstance(value, list):
        return format_sql_array(value)
    else:
        # Escape single quotes
        escaped_value = str(value).replace("'", "''")
        return f"'{escaped_value}'"

def generate_sql_inserts(medicines):
    """Generate SQL INSERT statements"""
    
    sql_parts = []
    sql_parts.append("-- Generated medicine INSERT statements")
    sql_parts.append("-- Total medicines: " + str(len(medicines)))
    sql_parts.append("")
    
    # Process in batches of 50 to avoid too large transactions
    batch_size = 50
    
    for i in range(0, len(medicines), batch_size):
        batch = medicines[i:i + batch_size]
        
        sql_parts.append(f"-- Batch {i//batch_size + 1}: medicines {i+1} to {min(i+batch_size, len(medicines))}")
        sql_parts.append("INSERT INTO medicine_master (")
        sql_parts.append("    name, generic_name, brand_names, category, subcategory, therapeutic_class,")
        sql_parts.append("    dosage_forms, strengths, standard_dosage_adult, standard_dosage_pediatric,")
        sql_parts.append("    routes, indications, contraindications, side_effects, interactions,")
        sql_parts.append("    pregnancy_category, controlled_substance, prescription_required, is_active")
        sql_parts.append(") VALUES")
        
        value_lines = []
        for j, medicine in enumerate(batch):
            # Map drug_interactions to interactions to match table schema
            interactions = medicine.get('drug_interactions', medicine.get('interactions', []))
            
            values = [
                format_sql_value(medicine.get('name')),
                format_sql_value(medicine.get('generic_name')),
                format_sql_array(medicine.get('brand_names', [])),
                format_sql_value(medicine.get('category')),
                format_sql_value(medicine.get('subcategory')),
                format_sql_value(medicine.get('therapeutic_class')),
                format_sql_array(medicine.get('dosage_forms', [])),
                format_sql_array(medicine.get('strengths', [])),
                format_sql_value(medicine.get('standard_dosage_adult')),
                format_sql_value(medicine.get('standard_dosage_pediatric')),
                format_sql_array(medicine.get('routes', [])),
                format_sql_array(medicine.get('indications', [])),
                format_sql_array(medicine.get('contraindications', [])),
                format_sql_array(medicine.get('side_effects', [])),
                format_sql_array(interactions),
                format_sql_value(medicine.get('pregnancy_category')),
                'true' if medicine.get('controlled_substance') else 'false',
                'true' if medicine.get('prescription_required', True) else 'false',
                'true'  # is_active
            ]
            
            value_line = "(" + ", ".join(values) + ")"
            if j < len(batch) - 1:
                value_line += ","
            else:
                value_line += ";"
            
            value_lines.append(value_line)
        
        sql_parts.extend(value_lines)
        sql_parts.append("")
    
    return "\n".join(sql_parts)

def main():
    """Main function"""
    print("Extracting medicines from JavaScript file...")
    
    medicines = extract_medicines_from_js()
    if not medicines:
        print("No medicines found or error occurred!")
        return
    
    print(f"Found {len(medicines)} medicines")
    
    # Generate SQL
    print("Generating SQL INSERT statements...")
    sql_content = generate_sql_inserts(medicines)
    
    # Write to file
    output_file = Path('insert-all-medicines.sql')
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("-- SwamIDesk Complete Medicine Database\n")
        f.write("-- Auto-generated from import_medicines_no_duplicates.mjs\n")
        f.write("-- Total medicines: " + str(len(medicines)) + "\n\n")
        f.write("BEGIN;\n\n")
        f.write(sql_content)
        f.write("\n\nCOMMIT;\n\n")
        f.write("-- Success message\n")
        f.write(f"SELECT 'Successfully inserted {len(medicines)} medicines!' as result;\n")
    
    print(f"Generated {output_file} with {len(medicines)} medicines")
    print("Run this SQL file after create-all-tables.sql to populate the medicine database")

if __name__ == "__main__":
    main()