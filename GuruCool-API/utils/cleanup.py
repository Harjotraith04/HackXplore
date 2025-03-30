import os
import time
import logging
from pathlib import Path

def delete_old_files(directory, days_old=1):
    """
    Delete files in the specified directory that are older than the given number of days.
    
    Args:
        directory (str): Directory path where the files are located.
        days_old (int): Number of days old a file should be before deletion. Defaults to 1 day.
    """
    now = time.time()
    cutoff_time = now - days_old * 86400  # 86400 seconds in a day

    if not os.path.exists(directory):
        logging.warning(f"Directory {directory} does not exist. Skipping cleanup.")
        return

    for file_path in Path(directory).glob('*'):
        file_modified_time = os.path.getmtime(file_path)
        if file_modified_time < cutoff_time:
            try:
                if file_path.is_file():
                    os.remove(file_path)
                    logging.info(f"Deleted old file: {file_path}")
                elif file_path.is_dir():
                    os.rmdir(file_path)
                    logging.info(f"Deleted old directory: {file_path}")
            except Exception as e:
                logging.error(f"Error deleting file {file_path}: {e}")

def schedule_cleanup(DATA_PATH):
    """
    Periodically delete old files in the DATA_PATH directory.
    
    Args:
        DATA_PATH (str): The root path where data is stored.
    """
    logging.info("Starting scheduled cleanup for old files.")
    while True:
        if not Path(DATA_PATH).exists():
            logging.warning(f"DATA_PATH {DATA_PATH} does not exist. Skipping cleanup.")
            time.sleep(7200)  
            continue
        
        for subject_dir in Path(DATA_PATH).iterdir():
            if subject_dir.is_dir():
                for unit_dir in subject_dir.iterdir():
                    if unit_dir.is_dir():
                        for lecture_dir in unit_dir.iterdir():
                            if lecture_dir.is_dir():
                                delete_old_files(lecture_dir)
        
        logging.info("Cleanup complete. Sleeping for 2 hours.")
        time.sleep(7200)  