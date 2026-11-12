import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve
)
import torch
import torch.nn as nn
from torch.utils.data import TensorDataset, DataLoader

from backend.app.model import NetworkIntrusionANN

# Paths
DATA_PATH = "data/CICIDS2017_sample.csv"
ARTIFACTS_DIR = "backend/ml/artifacts"
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

def load_and_preprocess_data():
    print(f"Loading data from {DATA_PATH}...")
    df = pd.read_csv(DATA_PATH)
    
    # Strip whitespace from column names
    df.columns = [c.strip() for c in df.columns]
    
    # Clean infinities and NaN
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.dropna(inplace=True)
    
    print(f"Dataset cleaned. Remaining rows: {len(df)}")
    
    # Target encoding: BENIGN = 0, everything else = 1
    # Save original labels for sample selection
    original_labels = df['Label'].copy()
    y = (df['Label'].str.strip() != 'BENIGN').astype(int).values
    
    # Feature columns (exclude Label)
    feature_cols = [c for c in df.columns if c != 'Label']
    
    # Drop zero variance columns to improve training stability
    stds = df[feature_cols].std()
    zero_variance_cols = stds[stds == 0].index.tolist()
    if zero_variance_cols:
        print(f"Dropping {len(zero_variance_cols)} zero-variance columns: {zero_variance_cols}")
        feature_cols = [c for c in feature_cols if c not in zero_variance_cols]
        
    X_df = df[feature_cols]
    
    # Feature statistics for UI and validation
    feature_stats = {}
    for col in feature_cols:
        feature_stats[col] = {
            "name": col,
            "min": float(X_df[col].min()),
            "max": float(X_df[col].max()),
            "mean": float(X_df[col].mean()),
            "std": float(X_df[col].std()),
            "median": float(X_df[col].median())
        }
        
    # Split train/test
    X = X_df.values.astype(np.float32)
    X_train, X_test, y_train, y_test, orig_train, orig_test = train_test_split(
        X, y, original_labels.values, test_size=0.20, random_state=42, stratify=y
    )
    
    # Fit Scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save a curated set of authentic test samples for UI demo
    sample_records = []
    # Pick a few distinct classes: BENIGN, PortScan, DoS, Bot, WebAttack
    unique_classes = pd.Series(orig_test).unique()
    for u_class in unique_classes:
        idxs = np.where(orig_test == u_class)[0]
        # pick up to 2 samples per class
        for idx in idxs[:2]:
            rec = {
                "original_label": str(u_class),
                "binary_label": int(y_test[idx]),
                "features": {col: float(X_test[idx][i]) for i, col in enumerate(feature_cols)}
            }
            sample_records.append(rec)
            
    with open(os.path.join(ARTIFACTS_DIR, "sample_records.json"), "w") as f:
        json.dump(sample_records, f, indent=2)
        
    with open(os.path.join(ARTIFACTS_DIR, "features.json"), "w") as f:
        json.dump({
            "feature_names": feature_cols,
            "stats": feature_stats,
            "total_features": len(feature_cols)
        }, f, indent=2)
        
    joblib.dump(scaler, os.path.join(ARTIFACTS_DIR, "scaler.joblib"))
    
    # Save small background dataset for SHAP (100 samples)
    np.save(os.path.join(ARTIFACTS_DIR, "background_data.npy"), X_train_scaled[:100])
    
    print(f"Data preprocessing complete. Features count: {len(feature_cols)}")
    print(f"Train samples: {len(X_train)}, Test samples: {len(X_test)}")
    return (X_train_scaled, X_test_scaled, y_train, y_test, feature_cols, scaler)

def train_baseline(X_train, y_train, X_test, y_test):
    print("\n--- Training Scikit-Learn Baseline (Random Forest) ---")
    start_time = time.time()
    rf = RandomForestClassifier(
        n_estimators=100,
        max_depth=16,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train, y_train)
    train_duration = time.time() - start_time
    print(f"Random Forest trained in {train_duration:.2f}s")
    
    joblib.dump(rf, os.path.join(ARTIFACTS_DIR, "baseline_model.joblib"))
    
    # Evaluate
    start_eval = time.time()
    y_pred = rf.predict(X_test)
    y_prob = rf.predict_proba(X_test)[:, 1]
    eval_latency_ms = ((time.time() - start_eval) / len(X_test)) * 1000
    
    cm = confusion_matrix(y_test, y_pred).tolist()
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    # Subsample roc points for clean JSON storage
    step = max(1, len(fpr) // 50)
    roc_points = [{"fpr": float(fpr[i]), "tpr": float(tpr[i])} for i in range(0, len(fpr), step)]
    
    metrics = {
        "model_name": "Random Forest Baseline (Scikit-Learn)",
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "f1_score": float(f1_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "confusion_matrix": {
            "tn": int(cm[0][0]),
            "fp": int(cm[0][1]),
            "fn": int(cm[1][0]),
            "tp": int(cm[1][1])
        },
        "roc_curve": roc_points,
        "latency_ms_per_record": float(eval_latency_ms),
        "train_time_sec": float(train_duration)
    }
    print(f"Baseline Accuracy: {metrics['accuracy']:.4f}, F1: {metrics['f1_score']:.4f}, AUC: {metrics['roc_auc']:.4f}")
    return rf, metrics

def train_pytorch_ann(X_train, y_train, X_test, y_test, input_dim):
    print("\n--- Training PyTorch Deep ANN (MLP) ---")
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Using device: {device}")
    
    model = NetworkIntrusionANN(input_dim=input_dim).to(device)
    
    # Datasets and Loaders
    train_dataset = TensorDataset(torch.from_numpy(X_train).float(), torch.from_numpy(y_train).float())
    val_dataset = TensorDataset(torch.from_numpy(X_test).float(), torch.from_numpy(y_test).float())
    
    train_loader = DataLoader(train_dataset, batch_size=128, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=256, shuffle=False)
    
    criterion = nn.BCEWithLogitsLoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=2)
    
    epochs = 12
    history = []
    start_train = time.time()
    
    for epoch in range(1, epochs + 1):
        model.train()
        total_loss = 0.0
        correct = 0
        total = 0
        for batch_x, batch_y in train_loader:
            batch_x, batch_y = batch_x.to(device), batch_y.to(device)
            optimizer.zero_grad()
            logits = model(batch_x)
            loss = criterion(logits, batch_y)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item() * len(batch_y)
            preds = (torch.sigmoid(logits) >= 0.5).float()
            correct += (preds == batch_y).sum().item()
            total += len(batch_y)
            
        train_loss = total_loss / total
        train_acc = correct / total
        
        # Validation
        model.eval()
        val_loss_total = 0.0
        val_correct = 0
        val_total = 0
        with torch.no_grad():
            for batch_x, batch_y in val_loader:
                batch_x, batch_y = batch_x.to(device), batch_y.to(device)
                logits = model(batch_x)
                loss = criterion(logits, batch_y)
                val_loss_total += loss.item() * len(batch_y)
                preds = (torch.sigmoid(logits) >= 0.5).float()
                val_correct += (preds == batch_y).sum().item()
                val_total += len(batch_y)
                
        val_loss = val_loss_total / val_total
        val_acc = val_correct / val_total
        scheduler.step(val_loss)
        
        history.append({
            "epoch": epoch,
            "train_loss": float(train_loss),
            "train_acc": float(train_acc),
            "val_loss": float(val_loss),
            "val_acc": float(val_acc)
        })
        print(f"Epoch {epoch:02d}/{epochs:02d} | Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} | Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}")
        
    train_duration = time.time() - start_train
    print(f"PyTorch ANN trained in {train_duration:.2f}s")
    
    # Save weights (always use CPU state dict for portable loading)
    torch.save(model.cpu().state_dict(), os.path.join(ARTIFACTS_DIR, "ann_model.pth"))
    
    # Evaluate on full test set
    model.eval()
    start_eval = time.time()
    with torch.no_grad():
        test_x_tensor = torch.from_numpy(X_test).float()
        logits = model(test_x_tensor)
        y_prob = torch.sigmoid(logits).numpy()
        y_pred = (y_prob >= 0.5).astype(int)
    eval_latency_ms = ((time.time() - start_eval) / len(X_test)) * 1000
    
    cm = confusion_matrix(y_test, y_pred).tolist()
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    step = max(1, len(fpr) // 50)
    roc_points = [{"fpr": float(fpr[i]), "tpr": float(tpr[i])} for i in range(0, len(fpr), step)]
    
    metrics = {
        "model_name": "PyTorch Deep ANN (MLP)",
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "precision": float(precision_score(y_test, y_pred)),
        "recall": float(recall_score(y_test, y_pred)),
        "f1_score": float(f1_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "confusion_matrix": {
            "tn": int(cm[0][0]),
            "fp": int(cm[0][1]),
            "fn": int(cm[1][0]),
            "tp": int(cm[1][1])
        },
        "roc_curve": roc_points,
        "latency_ms_per_record": float(eval_latency_ms),
        "train_time_sec": float(train_duration),
        "history": history
    }
    print(f"ANN Accuracy: {metrics['accuracy']:.4f}, F1: {metrics['f1_score']:.4f}, AUC: {metrics['roc_auc']:.4f}")
    return model, metrics

def main():
    X_train, X_test, y_train, y_test, feature_cols, scaler = load_and_preprocess_data()
    
    rf_model, rf_metrics = train_baseline(X_train, y_train, X_test, y_test)
    ann_model, ann_metrics = train_pytorch_ann(X_train, y_train, X_test, y_test, input_dim=len(feature_cols))
    
    # Save combined metrics
    all_metrics = {
        "baseline": rf_metrics,
        "ann": ann_metrics,
        "comparison": {
            "accuracy_diff": float(ann_metrics["accuracy"] - rf_metrics["accuracy"]),
            "f1_diff": float(ann_metrics["f1_score"] - rf_metrics["f1_score"]),
            "auc_diff": float(ann_metrics["roc_auc"] - rf_metrics["roc_auc"]),
            "latency_ratio": float(ann_metrics["latency_ms_per_record"] / max(1e-6, rf_metrics["latency_ms_per_record"]))
        },
        "test_set_size": len(y_test),
        "test_distribution": {
            "benign_count": int(np.sum(y_test == 0)),
            "attack_count": int(np.sum(y_test == 1))
        }
    }
    with open(os.path.join(ARTIFACTS_DIR, "metrics.json"), "w") as f:
        json.dump(all_metrics, f, indent=2)
        
    print("\nAll models trained and saved to artifacts successfully!")

if __name__ == "__main__":
    main()
