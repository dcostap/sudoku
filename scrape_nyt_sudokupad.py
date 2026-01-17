import time
import datetime
import os
import sys
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
import json

# --- CONFIGURATION ---
START_DATE = datetime.date(2025, 3, 1) 
END_DATE = datetime.date(2026, 1, 15)
OUTPUT_FILE = "src/lib/nyt_puzzles.json"

def setup_driver():
    options = Options()
    # options.add_argument("--headless=new") # DISABLED: Let's see the browser!
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1200,1000")
    # Mute audio/logs
    options.add_argument("--log-level=3")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    return driver

def parse_svg_grid(html_source):
    soup = BeautifulSoup(html_source, 'html.parser')
    
    # 1. Find the Group
    givens_group = soup.find('g', id='cell-givens')
    if not givens_group:
        return None

    # 2. Find the Text Nodes
    text_nodes = givens_group.find_all('text')
    if not text_nodes:
        return None

    # 3. Map Coordinates to Grid
    grid = ["."] * 81
    for node in text_nodes:
        try:
            val = node.text.strip()
            # Simple integer division usually works best for grid alignment
            # Cell size is 64px.
            x = float(node['x'])
            y = float(node['y'])
            
            col = int(x // 64)
            row = int(y // 64)
            
            if 0 <= row < 9 and 0 <= col < 9:
                grid[row * 9 + col] = val
        except:
            continue

    return "".join(grid)

def scrape_puzzle(driver, date_obj):
    date_str = date_obj.strftime("%Y%m%d")
    puzzle_id = f"{date_str}hard"
    url = f"https://sudokupad.app/nyt/{puzzle_id}"
    
    print(f"[{date_str}] Opening {url} ... ", end="", flush=True)

    try:
        driver.get(url)

        # --- CRITICAL WAIT ---
        # Wait until we actually see a NUMBER inside the givens group.
        # This prevents grabbing the HTML before the JS has drawn the board.
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "#cell-givens text"))
            )
        except Exception:
            # If we timed out, check if we hit a 404 or just an empty board
            if "Page not found" in driver.title or "Error" in driver.page_source:
                print("Skipped (404/Not Found)")
            else:
                print("Skipped (Timeout waiting for numbers)")
            return None

        # --- SCRAPE ---
        svg_html = driver.page_source
        puzzle_string = parse_svg_grid(svg_html)

        if not puzzle_string or puzzle_string == "."*81:
            print("Failed (Grid Empty)")
            return None

        # --- SOLUTION (OPTIONAL) ---
        try:
            solution = driver.execute_script("return Framework.app.puzzle.metadata.solution")
        except:
            solution = ""

        print(f"Success! ({puzzle_string[:5]}...)")
        return {
            "id": f"nyt:hard-{date_obj.strftime('%Y-%m-%d')}",
            "group": "NYT Puzzle",
            "digits": puzzle_string,
            "date": date_obj.strftime("%Y-%m-%dT%H:%M:%S.000Z"), # ISO format
            "difficulty": "hard",
            "source": "New York Times",
            "solution": solution
        }

    except Exception as e:
        print(f"Error: {e}")
        return None

def save_puzzles(puzzles_by_id):
    final_list = sorted(puzzles_by_id.values(), key=lambda x: x["date"], reverse=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(final_list, f, indent=2)

def main():
    print("Launching Visible Browser (Do not minimize)...")
    driver = setup_driver()
    
    print(f"Saving to: {OUTPUT_FILE}")
    print("-" * 60)

    # Load existing puzzles if file exists
    all_puzzles = []
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, "r", encoding="utf-8") as f:
                all_puzzles = json.load(f)
            print(f"Loaded {len(all_puzzles)} existing puzzles.")
        except Exception as e:
            print(f"Error loading existing JSON: {e}")

    # Index by ID for easy update/check
    puzzles_by_id = {p["id"]: p for p in all_puzzles}

    current_date = START_DATE
    while current_date <= END_DATE:
        puzzle_id = f"nyt:hard-{current_date.strftime('%Y-%m-%d')}"
        if puzzle_id in puzzles_by_id:
            print(f"[{current_date.strftime('%Y%m%d')}] Already in database. Skipping.")
            current_date += datetime.timedelta(days=1)
            continue

        result = scrape_puzzle(driver, current_date)
        
        if result:
            puzzles_by_id[result["id"]] = result
            save_puzzles(puzzles_by_id)
        
        current_date += datetime.timedelta(days=1)
        time.sleep(1) # Pause to let you see what's happening

    print(f"\nFinished. Total puzzles in database: {len(puzzles_by_id)}")
    print("Closing browser.")
    driver.quit()

if __name__ == "__main__":
    main()