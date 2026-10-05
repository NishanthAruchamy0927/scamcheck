# SCAMCHECK AI/ML Training Pipeline (Phase 4)

## Dataset
The model is trained on the [UCI SMS Spam Collection Dataset](https://archive.ics.uci.edu/ml/datasets/SMS+Spam+Collection). It contains over 5,500 labeled messages (ham vs. spam) and serves as an excellent baseline for text-based fraud detection.

## Data Ingestion & Preprocessing
The `train.py` script automatically:
1. Downloads the dataset ZIP file from the UCI repository.
2. Extracts it and loads the tab-separated values.
3. Prepares labels: `spam` -> `1`, `ham` -> `0`.
4. Performs TF-IDF (Term Frequency-Inverse Document Frequency) vectorization with stop words removed.

## Feature Extraction
Alongside standard TF-IDF, the pipeline can be expanded to include:
- URL presence flags
- Suspicious keyword frequency
- Grammar and casing metrics

## Model Selection & Evaluation
The training script tests multiple baseline models:
1. **Logistic Regression**
2. **Linear SVM**
3. **Random Forest Classifier**

The script evaluates each model using cross-validation accuracy, precision, recall, and F1-score. The best-performing model (based on F1-score) is selected automatically and serialized.

## Serialization
The final artifacts are saved to `ml_service/models/`:
- `vectorizer.pkl`: The fitted TF-IDF vectorizer.
- `model.pkl`: The chosen classification model.

These are loaded by the FastAPI inference service at startup.

## How to Retrain
To retrain the model on new data:
```bash
cd ml_service
.\venv\Scripts\activate
python train.py
```
