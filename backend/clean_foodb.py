from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"


def load_and_clean_data():
  # Adjust file name based on extracted CSV in data/
  train_path = DATA_DIR / "00_training.csv"

  if not train_path.exists():
    raise FileNotFoundError(f"Missing dataset at {train_path}")

    df = pd.read_csv(train_path)
    print(f"Loaded raw data with shape: {df.shape}")

    # Clean missing values and reset index
    df = df.dropna().reset_index(drop=True)
    return df


if __name__ == "__main__":
    df = load_and_clean_data()
    print("Preprocessing complete. Cleaned samples:", len(df))
    df.to_csv("food_compounds_cleaned.csv", index=False)