import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from rdkit import Chem
from rdkit.Chem import Descriptors, AllChem, rdMolDescriptors

class MolecularFeatureExtractor:
    """Extracts physicochemical descriptors and Morgan bit fingerprints for pairwise interaction models."""
    
    def __init__(self, radius: int = 2, n_bits: int = 1024):
        self.radius = radius
        self.n_bits = n_bits

    def smiles_to_morgan_fp(self, smiles: str) -> np.ndarray:
        """Calculates Morgan circular fingerprint bit vector."""
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return np.zeros((self.n_bits,), dtype=np.int8)
        fp = AllChem.GetMorganFingerprintAsBitVect(mol, radius=self.radius, nBits=self.n_bits)
        return np.array(fp, dtype=np.int8)

    def compute_descriptors_dict(self, smiles: str) -> Dict[str, float]:
        """Calculates 20+ key 2D RDKit molecular descriptors."""
        mol = Chem.MolFromSmiles(smiles)
        if mol is None:
            return {
                "MolWt": 0.0, "MolLogP": 0.0, "TPSA": 0.0, "NumHDonors": 0.0,
                "NumHAcceptors": 0.0, "NumRotatableBonds": 0.0, "RingCount": 0.0,
                "FractionCSP3": 0.0, "HeavyAtomCount": 0.0, "NumAromaticRings": 0.0
            }
        
        return {
            "MolWt": float(Descriptors.MolWt(mol)),
            "MolLogP": float(Descriptors.MolLogP(mol)),
            "TPSA": float(Descriptors.TPSA(mol)),
            "NumHDonors": float(Descriptors.NumHDonors(mol)),
            "NumHAcceptors": float(Descriptors.NumHAcceptors(mol)),
            "NumRotatableBonds": float(Descriptors.NumRotatableBonds(mol)),
            "RingCount": float(Descriptors.RingCount(mol)),
            "FractionCSP3": float(Descriptors.FractionCSP3(mol)),
            "HeavyAtomCount": float(mol.GetNumHeavyAtoms()),
            "NumAromaticRings": float(Descriptors.NumAromaticRings(mol))
        }

    def generate_pairwise_vector(self, drug_smiles: str, food_smiles: str) -> np.ndarray:
        """Constructs concatenated pairwise feature vector: [Drug_Desc, Food_Desc, Desc_Deltas, Drug_FP, Food_FP]."""
        d_desc = self.compute_descriptors_dict(drug_smiles)
        f_desc = self.compute_descriptors_dict(food_smiles)

        desc_keys = sorted(list(d_desc.keys()))
        d_vals = np.array([d_desc[k] for k in desc_keys])
        f_vals = np.array([f_desc[k] for k in desc_keys])
        delta_vals = np.abs(d_vals - f_vals)

        d_fp = self.smiles_to_morgan_fp(drug_smiles)
        f_fp = self.smiles_to_morgan_fp(food_smiles)

        return np.concatenate([d_vals, f_vals, delta_vals, d_fp, f_fp])
