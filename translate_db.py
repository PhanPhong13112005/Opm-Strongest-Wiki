import json
import time
import os
import re
from deep_translator import GoogleTranslator

db_path = 'd:/Code/OpmWiki/src/data/characters_en.json'
temp_path = 'd:/Code/OpmWiki/src/data/characters_en_temp.json'

with open(db_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

translator = GoogleTranslator(source='vi', target='en')

# Dictionary to cache translations to avoid redundant API calls and speed up process
translation_cache = {}

def translate_text(text):
    if not text or not isinstance(text, str):
        return text
    if not re.search('[a-zA-Z]', text):
        return text # Skip if no letters
    # Simple check if already mostly English (if we resume)
    # But for safety, we'll just rely on the cache or translator
    if text in translation_cache:
        return translation_cache[text]
    
    try:
        translated = translator.translate(text)
        translation_cache[text] = translated
        # Sleep slightly to prevent rate limits
        time.sleep(0.1)
        return translated
    except Exception as e:
        print(f"Error translating: {text[:20]}... Error: {e}")
        time.sleep(1) # Backoff
        return text

total = len(data)
print(f"Starting translation of {total} characters...")

for i, char in enumerate(data):
    # Only translate if not already translated (we can guess by checking if 'bio' is still Vietnamese)
    # Actually we will just translate everything, the cache will handle duplicates.
    # To make it resume-able, we can check if 'bio' contains Vietnamese typical words, but Google Translate is idempotent mostly.
    
    # Bio
    if char.get('bio'):
        char['bio'] = translate_text(char['bio'])
    
    # Characteristic
    if char.get('characteristic'):
        char['characteristic'] = translate_text(char['characteristic'])
        
    # Duyen
    if char.get('duyen'):
        char['duyen'] = translate_text(char['duyen'])
        
    # PVP Stats
    if char.get('pvpStats'):
        for k, v in char['pvpStats'].items():
            if isinstance(v, str):
                char['pvpStats'][k] = translate_text(v)
                
    # Skills
    if char.get('skills'):
        for skill in char['skills']:
            if skill.get('name'):
                skill['name'] = translate_text(skill['name'])
            if skill.get('desc'):
                skill['desc'] = translate_text(skill['desc'])
                
    # Effects
    if char.get('effects'):
        for effect in char['effects']:
            if effect.get('name'):
                effect['name'] = translate_text(effect['name'])
            if effect.get('desc'):
                effect['desc'] = translate_text(effect['desc'])

    if (i + 1) % 10 == 0 or (i + 1) == total:
        print(f"Progress: {i + 1}/{total} characters translated...")
        with open(temp_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

# Final save
with open(db_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

if os.path.exists(temp_path):
    os.remove(temp_path)

print("Translation completed successfully!")
