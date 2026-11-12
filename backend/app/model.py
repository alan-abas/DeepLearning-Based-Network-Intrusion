import torch
import torch.nn as nn

class NetworkIntrusionANN(nn.Module):
    """
    Deep Feedforward Artificial Neural Network (MLP) for Network Intrusion Detection.
    Optimized for tabular flow statistical metrics from CICIDS2017.
    """
    def __init__(self, input_dim: int):
        super(NetworkIntrusionANN, self).__init__()
        self.input_dim = input_dim
        
        self.network = nn.Sequential(
            nn.Linear(input_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(),
            nn.Dropout(0.2),
            
            nn.Linear(128, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.2),
            
            nn.Linear(64, 32),
            nn.BatchNorm1d(32),
            nn.ReLU(),
            nn.Dropout(0.1),
            
            nn.Linear(32, 1)
        )
        
    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # returns raw logits
        return self.network(x).squeeze(-1)
    
    def predict_proba(self, x: torch.Tensor) -> torch.Tensor:
        # returns probability of class 1 (Attack)
        self.eval()
        with torch.no_grad():
            logits = self.forward(x)
            probs = torch.sigmoid(logits)
        return probs
