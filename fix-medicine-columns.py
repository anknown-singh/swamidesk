#!/usr/bin/env python3
"""
Fix the medicine_master_1000plus.sql file to match the actual table schema
by removing columns that don't exist in the database table.
"""

import re
from pathlib import Path

def fix_medicine_sql():
    """Fix the SQL file to match actual table columns"""
    
    input_file = Path('medicine_master_1000plus.sql')
    output_file = Path('medicine_master_1000plus_fixed.sql')
    
    if not input_file.exists():
        print(f"Error: {input_file} not found!")
        return
    
    with open(input_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Split content into header and values
    lines = content.strip().split('\n')
    
    # Find where VALUES starts
    values_start = None
    for i, line in enumerate(lines):
        if ') VALUES' in line:
            values_start = i + 1
            break
    
    if values_start is None:
        print("Could not find VALUES section!")
        return
    
    # Keep header up to VALUES
    header_lines = lines[:values_start]
    
    # Process VALUES section
    values_content = '\n'.join(lines[values_start:])
    
    # Find all medicine entries (enclosed in parentheses)
    medicine_pattern = r'\(([^)]+(?:\([^)]*\)[^)]*)*)\),'
    
    # Split into individual medicine entries
    medicine_entries = []
    current_entry = ""
    paren_count = 0
    
    i = 0
    while i < len(values_content):
        char = values_content[i]
        current_entry += char
        
        if char == '(':
            paren_count += 1
        elif char == ')':
            paren_count -= 1
            
            # If we've closed all parentheses and found a comma, this is end of entry
            if paren_count == 0:
                if i + 1 < len(values_content) and values_content[i + 1] == ',':
                    current_entry += ','
                    medicine_entries.append(current_entry.strip())
                    current_entry = ""
                    i += 1  # Skip the comma
                elif i + 1 >= len(values_content) or values_content[i + 1:].strip().startswith('--') or not values_content[i + 1:].strip():
                    # End of file or comment follows
                    medicine_entries.append(current_entry.strip())
                    current_entry = ""
        
        i += 1
    
    if current_entry.strip():
        medicine_entries.append(current_entry.strip())
    
    # Process each medicine entry to keep only the required columns
    fixed_entries = []
    
    for entry_text in medicine_entries:
        if not entry_text.strip() or entry_text.strip().startswith('--'):
            continue
            
        # Remove leading/trailing parentheses and comma
        clean_entry = entry_text.strip()
        if clean_entry.startswith('('):
            clean_entry = clean_entry[1:]
        if clean_entry.endswith(','):
            clean_entry = clean_entry[:-1]
        if clean_entry.endswith(')'):
            clean_entry = clean_entry[:-1]
        
        # Parse the values - this is complex due to nested arrays and quotes
        values = parse_sql_values(clean_entry)
        
        if len(values) >= 19:  # We need at least 19 values for our columns
            # Keep only the columns that exist in the table:
            # name, generic_name, brand_names, category, subcategory, therapeutic_class,
            # dosage_forms, strengths, standard_dosage_adult, standard_dosage_pediatric,
            # routes, indications, contraindications, side_effects, interactions,
            # pregnancy_category, controlled_substance, prescription_required, is_active
            
            # Original order was:
            # 0: name, 1: generic_name, 2: brand_names, 3: category, 4: subcategory, 5: therapeutic_class,
            # 6: pharmacological_class (REMOVE), 7: dosage_forms, 8: strengths, 9: standard_dosage_adult,
            # 10: standard_dosage_pediatric, 11: routes, 12: frequencies (REMOVE), 13: indications,
            # 14: contraindications, 15: side_effects, 16: drug_interactions, 17: warnings (REMOVE),
            # 18: max_daily_dose (REMOVE), 19: duration_guidelines (REMOVE), 20: monitoring_requirements (REMOVE),
            # 21: mechanism_of_action (REMOVE), 22: pregnancy_category, 23: controlled_substance,
            # 24: prescription_required, 25: search_keywords (REMOVE), 26: synonyms (REMOVE),
            # 27: icd_codes (REMOVE), 28: is_active
            
            kept_values = [
                values[0],   # name
                values[1],   # generic_name  
                values[2],   # brand_names
                values[3],   # category
                values[4],   # subcategory
                values[5],   # therapeutic_class
                values[7],   # dosage_forms (skip pharmacological_class)
                values[8],   # strengths
                values[9],   # standard_dosage_adult
                values[10],  # standard_dosage_pediatric
                values[11],  # routes
                values[13],  # indications (skip frequencies)
                values[14],  # contraindications
                values[15],  # side_effects
                values[16],  # drug_interactions -> interactions
                values[22],  # pregnancy_category
                values[23],  # controlled_substance
                values[24],  # prescription_required
                values[28] if len(values) > 28 else 'TRUE'  # is_active
            ]
            
            fixed_entry = "(" + ", ".join(kept_values) + ")"
            fixed_entries.append(fixed_entry)
    
    # Write the fixed file
    with open(output_file, 'w', encoding='utf-8') as f:
        # Write header
        f.write("-- Comprehensive Medicine Master Database with 1000+ Medicines\n")
        f.write("-- Insert data for medicine_master table\n")
        f.write("-- Fixed to match actual table schema\n\n")
        
        f.write("INSERT INTO medicine_master (\n")
        f.write("  name, generic_name, brand_names, category, subcategory, therapeutic_class,\n")
        f.write("  dosage_forms, strengths, standard_dosage_adult, standard_dosage_pediatric,\n")
        f.write("  routes, indications, contraindications, side_effects, interactions,\n")
        f.write("  pregnancy_category, controlled_substance, prescription_required, is_active\n")
        f.write(") VALUES\n\n")
        
        # Write medicine entries
        for i, entry in enumerate(fixed_entries):
            if i == len(fixed_entries) - 1:
                # Last entry, no comma
                f.write(entry + ";\n")
            else:
                f.write(entry + ",\n")
    
    print(f"Fixed {len(fixed_entries)} medicine entries")
    print(f"Generated {output_file}")

def parse_sql_values(text):
    """Parse SQL VALUES string into individual values, handling arrays and quotes"""
    values = []
    current_value = ""
    in_quotes = False
    in_array = False
    array_depth = 0
    quote_char = None
    
    i = 0
    while i < len(text):
        char = text[i]
        
        if not in_quotes and not in_array:
            if char in ["'", '"']:
                in_quotes = True
                quote_char = char
                current_value += char
            elif char.upper() == 'A' and text[i:i+5].upper() == 'ARRAY':
                in_array = True
                current_value += char
            elif char == ',' and array_depth == 0:
                values.append(current_value.strip())
                current_value = ""
                i += 1
                continue
            else:
                current_value += char
        elif in_quotes:
            current_value += char
            if char == quote_char:
                # Check if it's escaped
                if i + 1 < len(text) and text[i + 1] == quote_char:
                    # Escaped quote, continue
                    i += 1
                    current_value += text[i]
                else:
                    # End of quoted string
                    in_quotes = False
                    quote_char = None
        elif in_array:
            current_value += char
            if char == '[':
                array_depth += 1
            elif char == ']':
                array_depth -= 1
                if array_depth == 0:
                    in_array = False
        else:
            current_value += char
        
        i += 1
    
    if current_value.strip():
        values.append(current_value.strip())
    
    return values

if __name__ == "__main__":
    fix_medicine_sql()