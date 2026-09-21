import numpy as np
from rdkit import Chem
from rdkit.Chem import AllChem


def smiles_to_morgan_fingerprint(
    smiles: str, radius: int = 2, n_bits: int = 1024
) -> np.ndarray:
  mol = Chem.MolFromSmiles(smiles)
  if mol is None:
    return np.zeros((n_bits,), dtype=int)
  fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=radius, nBits=n_bits)
  return np.array(fp)


def generate_pair_features(drug_smiles: str, food_smiles: str) -> np.ndarray:
  drug_fp = smiles_to_morgan_fingerprint(drug_smiles)
  food_fp = smiles_to_morgan_fingerprint(food_smiles)
  return np.concatenate([drug_fp, food_fp])


if __name__ == "__main__":
  # Example test
  sample_drug = "CC(=O)NC1=CC=C(O)C=C1"  # Paracetamol
  sample_food = "CCO"  # Ethanol
  feats = generate_pair_features(sample_drug, sample_food)
  print(f"Extracted feature vector length: {len(feats)}")